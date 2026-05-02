import json
import re
import asyncio
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel("gemini-2.5-flash")


def _extract_json(text: str) -> dict:
    """Bóc JSON từ response Gemini — tolerant với markdown fences và rác."""
    if not text:
        raise ValueError("Empty response")
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?", "", cleaned, flags=re.IGNORECASE).strip()
    cleaned = re.sub(r"```$", "", cleaned).strip()
    # Lấy đoạn JSON đầu tiên
    m = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if m:
        cleaned = m.group(0)
    return json.loads(cleaned)


async def _gemini(prompt: str) -> dict:
    """Wrapper async cho Gemini — dùng to_thread vì SDK của google-generativeai chủ yếu sync."""
    response = await asyncio.to_thread(model.generate_content, prompt)
    return _extract_json(response.text)


# ─────────────────────────────────────────────────────────────────────────────
# 1. PHÒNG TẬP — phân tích tin nhắn của member
# ─────────────────────────────────────────────────────────────────────────────
async def analyze_message(text: str) -> dict:
    """
    Phân tích một câu/tin nhắn tiếng Việt theo lăng kính 'thẳng thắn vs né tránh'.
    Trả về JSON với:
      - score (0-100): càng cao càng thẳng thắn
      - status: "direct" | "vague" | "silence"
      - highlights: list các cụm từ cần tô màu, kèm type và lý do
      - rewrite: bản viết lại thẳng thắn hơn
      - feedback: 1 câu nhận xét tổng quan tiếng Việt
    """
    prompt = f"""Bạn là chuyên gia coaching giao tiếp công sở Việt Nam, tinh thần "Dám Sai - Nói Thẳng".

Phân tích tin nhắn sau và trả về JSON với các trường:
- "score": số nguyên 0-100, đo độ THẲNG THẮN (100 = cực kỳ thẳng thắn, có hành động cụ thể; 50 = mơ hồ; 0 = né tránh hoàn toàn)
- "status": một trong "direct" (>=70), "vague" (50-69), "silence" (<50)
- "highlights": list các object {{"phrase": "<cụm từ trong tin nhắn>", "type": "<silence|vague|direct|face>", "reason": "<lý do ngắn>"}}. Trong đó:
    * "silence": từ né tránh, im lặng (vd: "không sao", "thôi bỏ qua")
    * "vague": từ mơ hồ, thiếu cam kết (vd: "sẽ cố", "có thể")
    * "direct": từ thẳng thắn, có cam kết (vd: "tôi cần", "deadline là 17h")
    * "face": từ giữ thể diện (vd: "ngại quá", "kỳ cục lắm")
  Chỉ trích các phrase CÓ TRONG tin nhắn gốc.
- "rewrite": viết lại tin nhắn theo hướng thẳng thắn nhưng vẫn tôn trọng. Có thời gian/hành động cụ thể.
- "feedback": 1 câu tiếng Việt nhận xét điểm mạnh/yếu của tin nhắn gốc.

Tin nhắn cần phân tích:
\"\"\"{text}\"\"\"

Chỉ trả về JSON thuần, không markdown, không giải thích thêm.
"""
    try:
        return await _gemini(prompt)
    except Exception as e:
        # Fallback an toàn nếu Gemini fail / rate limit
        return {
            "score": 50,
            "status": "vague",
            "highlights": [],
            "rewrite": text,
            "feedback": f"Không phân tích được bằng AI ({type(e).__name__}). Vui lòng thử lại.",
            "_error": str(e),
        }


# ─────────────────────────────────────────────────────────────────────────────
# 2. THỬ THÁCH — chấm bằng chứng nộp
# ─────────────────────────────────────────────────────────────────────────────
async def score_challenge_evidence(proof_text: str, challenge_text: str, max_points: int = 50) -> dict:
    """AI chấm điểm bằng chứng nộp thử thách."""
    prompt = f"""Bạn là HR đánh giá thành quả nhân sự, tinh thần "Dám Sai - Nói Thẳng".

Thử thách: "{challenge_text}"
Bằng chứng người nộp: "{proof_text}"

Đánh giá xem bằng chứng có đáp ứng tiêu chí (1) hành động CỤ THỂ và (2) KẾT QUẢ đo lường được không.

Trả về JSON với:
- "approved": true/false
- "awarded_points": 0 hoặc {max_points} (full nếu approved, 0 nếu không; có thể trả {max_points // 2} nếu nửa-vời)
- "ai_feedback": 1 câu tiếng Việt phản hồi xây dựng
- "ai_reason": 1 câu giải thích lý do điểm

Chỉ trả về JSON thuần.
"""
    try:
        return await _gemini(prompt)
    except Exception as e:
        return {
            "approved": False,
            "awarded_points": 0,
            "ai_feedback": "AI tạm thời không khả dụng. Bạn có thể thử lại sau.",
            "ai_reason": f"Lỗi gọi AI: {type(e).__name__}",
            "_error": str(e),
        }


# ─────────────────────────────────────────────────────────────────────────────
# 3. HR DASHBOARD — phân tích sức khỏe team
# ─────────────────────────────────────────────────────────────────────────────
async def analyze_team_health(team_data: dict) -> dict:
    """Gọi Gemini phân tích sức khoẻ đội nhóm."""
    prompt = f"""Bạn là chuyên gia HR. Phân tích dữ liệu team dưới đây và trả về JSON:
- "insights": nhận xét tổng quan, 1-2 câu tiếng Việt
- "patterns": list 3 patterns phát hiện được (mỗi item là 1 câu)
- "recommendations": list 3 khuyến nghị cụ thể, có thể hành động ngay

Dữ liệu team:
{json.dumps(team_data, ensure_ascii=False, indent=2)}

Chỉ trả về JSON thuần.
"""
    try:
        return await _gemini(prompt)
    except Exception as e:
        return {
            "insights": "Không phân tích được bằng AI.",
            "patterns": [],
            "recommendations": [],
            "_error": str(e),
        }

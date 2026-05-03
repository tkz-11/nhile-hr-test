import json
import re
import asyncio
import hashlib
import time
from collections import OrderedDict
import google.generativeai as genai
from app.config import settings

genai.configure(api_key=settings.gemini_api_key)
# gemini-2.5-flash-lite: model nhẹ nhất, free tier ~30 RPM / 1000 RPD ổn định.
# gemini-2.0-flash hiện limit=0 cho free tier (Google đã thắt từ 2025).
# Override qua env GEMINI_MODEL nếu account có Tier 1 và muốn dùng model mạnh hơn.
import os
_MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
model = genai.GenerativeModel(_MODEL_NAME)

# In-memory LRU cache cho prompt → response (tiết kiệm quota khi gõ lại text trùng)
_CACHE_TTL_SECONDS = 600  # 10 phút
_CACHE_MAX_ENTRIES = 256
_response_cache: "OrderedDict[str, tuple[float, dict]]" = OrderedDict()


def _cache_key(prompt: str) -> str:
    return hashlib.sha256(prompt.encode("utf-8")).hexdigest()


def _cache_get(key: str) -> dict | None:
    entry = _response_cache.get(key)
    if not entry:
        return None
    ts, value = entry
    if time.time() - ts > _CACHE_TTL_SECONDS:
        _response_cache.pop(key, None)
        return None
    _response_cache.move_to_end(key)
    return value


def _cache_set(key: str, value: dict) -> None:
    _response_cache[key] = (time.time(), value)
    _response_cache.move_to_end(key)
    while len(_response_cache) > _CACHE_MAX_ENTRIES:
        _response_cache.popitem(last=False)


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


# Lỗi tạm thời từ Gemini SDK — đáng retry
_RETRYABLE_ERRORS = ("ResourceExhausted", "DeadlineExceeded", "ServiceUnavailable", "InternalServerError")


async def _gemini(prompt: str, max_retries: int = 2) -> dict:
    """Gemini call với in-memory cache + exponential backoff retry trên rate limit.

    Cache giảm quota khi user gõ lại text trùng. Retry tránh user thấy lỗi
    transient ngay lần đầu (Gemini free tier 15 RPM hay bị burst).
    """
    key = _cache_key(prompt)
    cached = _cache_get(key)
    if cached is not None:
        return cached

    last_err: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            response = await asyncio.to_thread(model.generate_content, prompt)
            data = _extract_json(response.text)
            _cache_set(key, data)
            return data
        except Exception as e:
            last_err = e
            if type(e).__name__ in _RETRYABLE_ERRORS and attempt < max_retries:
                # 1s, 2s, 4s — đủ để vượt qua rate limit window 6s của 10 RPM
                await asyncio.sleep(2 ** attempt)
                continue
            raise
    raise last_err  # type: ignore[misc]


def _friendly_error(e: Exception) -> str:
    """Map exception name → message tiếng Việt thân thiện cho UI."""
    name = type(e).__name__
    return {
        "ResourceExhausted": "AI đang quá tải, vui lòng đợi 30 giây và thử lại.",
        "DeadlineExceeded": "AI phản hồi chậm, vui lòng thử lại.",
        "ServiceUnavailable": "Dịch vụ AI tạm thời gián đoạn, thử lại sau.",
        "DefaultCredentialsError": "Cấu hình AI chưa hoàn tất — liên hệ quản trị.",
    }.get(name, f"Không phân tích được bằng AI ({name}). Vui lòng thử lại.")


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
        return {
            "score": 50,
            "status": "vague",
            "highlights": [],
            "rewrite": text,
            "feedback": _friendly_error(e),
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
            "ai_feedback": _friendly_error(e),
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
            "insights": _friendly_error(e),
            "patterns": [],
            "recommendations": [],
            "_error": str(e),
        }

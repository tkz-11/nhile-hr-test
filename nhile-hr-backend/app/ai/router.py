from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user, require_role
from app.ai import service

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────
class AnalyzeMessageIn(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000)


class ScoreEvidenceIn(BaseModel):
    proof_text: str = Field(..., min_length=1, max_length=2000)
    challenge_text: str = Field(..., min_length=1, max_length=500)
    max_points: int = 50


class TeamHealthIn(BaseModel):
    team_id: Optional[str] = None
    team_name: Optional[str] = None
    member_count: Optional[int] = None
    health_index: Optional[float] = None
    support_rate: Optional[float] = None
    avg_scores: Optional[dict] = None


# ── Endpoints ──────────────────────────────────────────────────────────────
@router.post("/analyze-message")
async def analyze_message(
    payload: AnalyzeMessageIn,
    current_user=Depends(get_current_user),
):
    """Phòng Tập Giao Tiếp — phân tích thẳng thắn vs né tránh, gợi ý viết lại."""
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Text rỗng")
    return await service.analyze_message(payload.text)


@router.post("/score-evidence")
async def score_evidence(
    payload: ScoreEvidenceIn,
    current_user=Depends(get_current_user),
):
    """Thử Thách — AI chấm điểm bằng chứng nộp thử thách."""
    return await service.score_challenge_evidence(
        proof_text=payload.proof_text,
        challenge_text=payload.challenge_text,
        max_points=payload.max_points,
    )


@router.post("/team-health")
async def team_health(
    payload: TeamHealthIn,
    current_user=Depends(require_role(["hr_manager", "leader"])),
):
    """HR Dashboard — phân tích sức khoẻ đội nhóm, trả về insights/patterns/recommendations."""
    return await service.analyze_team_health(payload.model_dump(exclude_none=True))

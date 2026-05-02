from uuid import uuid4
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.culture.models import Story
from app.culture.schemas import StoryCreate
from app.users.models import UserProfile

router = APIRouter()


@router.get("/stories")
async def list_stories(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Trả về danh sách stories công khai mới nhất, kèm tên user (nếu không ẩn danh)."""
    stmt = (
        select(Story, UserProfile.full_name)
        .outerjoin(UserProfile, Story.user_id == UserProfile.id)
        .where(Story.is_public == True)  # noqa: E712
        .order_by(desc(Story.created_at))
        .limit(50)
    )
    result = await db.execute(stmt)
    rows = result.all()
    out = []
    for s, full_name in rows:
        is_anon = bool(getattr(s, "is_anonymous", False))
        out.append({
            "id": str(s.id),
            "user_id": None if is_anon else (str(s.user_id) if s.user_id else None),
            "user_name": None if is_anon else full_name,
            "is_anonymous": is_anon,
            "team_id": str(s.team_id) if s.team_id else None,
            "content": s.content,
            "experience_type": s.experience_type,
            "courage_level": s.courage_level,
            "support_level": s.support_level,
            "reactions": s.reactions or {"brave": 0, "respect": 0, "learn": 0},
            "created_at": s.created_at.isoformat() if s.created_at else None,
        })
    return out


@router.post("/stories", status_code=status.HTTP_201_CREATED)
async def create_story(
    payload: StoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Đăng story mới — gắn user_id từ token. Nếu is_anonymous=True thì ẩn tên khi GET."""
    user_id = getattr(current_user, "id", None)
    story = Story(
        id=uuid4(),
        user_id=user_id,  # vẫn lưu user_id để audit, chỉ ẩn khi GET
        content=payload.content,
        experience_type=payload.experience_type,
        courage_level=payload.courage_level,
        support_level=payload.support_level,
        is_public=payload.is_public,
        is_anonymous=payload.is_anonymous,
    )
    db.add(story)
    await db.commit()
    await db.refresh(story)
    return {"id": str(story.id), "content": story.content, "is_anonymous": story.is_anonymous}

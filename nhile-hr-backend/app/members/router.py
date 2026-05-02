from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.users.models import UserProfile
from app.members.models import Team

router = APIRouter()


@router.get("/")
async def list_members(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Trả về danh sách user_profiles (tất cả thành viên trong tổ chức)."""
    result = await db.execute(select(UserProfile).limit(200))
    rows = result.scalars().all()
    return [
        {
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "primary_role": u.primary_role,
            "culture_xp": u.culture_xp or 0,
            "streak_days": u.streak_days or 0,
        }
        for u in rows
    ]


@router.get("/teams")
async def list_teams(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Trả về danh sách team."""
    result = await db.execute(select(Team).limit(100))
    rows = result.scalars().all()
    return [{"id": str(t.id), "name": t.name} for t in rows]

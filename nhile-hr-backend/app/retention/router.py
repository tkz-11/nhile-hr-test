from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.auth.dependencies import get_current_user, require_role
from app.retention import schemas, crud

router = APIRouter()

@router.get("/members", response_model=list[schemas.MemberRiskOut])
async def get_retention_members(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["hr_manager", "leader"]))
):
    """Lấy danh sách members với risk level hiện tại."""
    members = await crud.get_members_with_risk(db, org_id=current_user.org_id)
    return members

@router.post("/intervene", response_model=schemas.InterventionOut, status_code=status.HTTP_201_CREATED)
async def log_intervention(
    payload: schemas.InterventionCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_role(["hr_manager", "leader"]))
):
    """Log một hành động can thiệp nhân sự."""
    log = await crud.create_intervention(db, hr_id=current_user.id, payload=payload)
    return log

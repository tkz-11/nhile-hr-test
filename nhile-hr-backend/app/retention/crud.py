from uuid import uuid4
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.retention import models, schemas


async def get_members_with_risk(db: AsyncSession, org_id=None):
    """
    Lấy danh sách risk_scores mới nhất (đơn giản: tất cả bản ghi, sắp xếp theo created_at desc).
    Để rõ ràng cho demo, chưa filter org_id — sẽ thêm sau khi có nhiều org.
    """
    stmt = select(models.RiskScore).order_by(desc(models.RiskScore.created_at)).limit(50)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [
        schemas.MemberRiskOut(
            id=r.id,
            user_id=r.user_id,
            risk_level=r.risk_level,
            stuck_days=r.stuck_days or 0,
            emotional_note=r.emotional_note,
        )
        for r in rows
    ]


async def create_intervention(db: AsyncSession, hr_id, payload: schemas.InterventionCreate):
    log = models.InterventionLog(
        id=uuid4(),
        member_id=payload.member_id,
        hr_id=hr_id,
        action_type=payload.action_type,
        note=payload.note,
    )
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log

from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class MemberRiskOut(BaseModel):
    id: UUID
    user_id: UUID
    risk_level: str
    stuck_days: int
    emotional_note: Optional[str] = None

    class Config:
        from_attributes = True

class InterventionCreate(BaseModel):
    member_id: UUID
    action_type: str
    note: Optional[str] = None

class InterventionOut(InterventionCreate):
    id: UUID
    hr_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

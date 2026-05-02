from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class TeamOut(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True

class MemberDetail(BaseModel):
    id: UUID
    user_id: UUID
    team_id: UUID
    role: str
    is_primary: bool

    class Config:
        from_attributes = True

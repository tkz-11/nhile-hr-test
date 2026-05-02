from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserOut(BaseModel):
    id: UUID
    full_name: str
    email: str
    primary_role: str
    culture_xp: int
    streak_days: int

    class Config:
        from_attributes = True

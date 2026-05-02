from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class StoryCreate(BaseModel):
    content: str
    experience_type: Optional[str] = None
    courage_level: Optional[str] = None
    support_level: Optional[str] = None
    is_public: bool = True
    is_anonymous: bool = False

class ChallengeSubmissionCreate(BaseModel):
    proof_text: str

from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class RewriteLogCreate(BaseModel):
    original_text: str
    rewritten_text: Optional[str] = None
    detected_type: Optional[str] = None

class CultureDailyLogCreate(BaseModel):
    deadline_met: bool = False
    wyfls_checked: bool = False
    banned_word: bool = False
    direct_score: Optional[int] = None
    identity_choice: Optional[str] = None

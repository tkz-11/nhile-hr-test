from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True)
    org_id = Column(UUID(as_uuid=True))
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    primary_role = Column(String, nullable=False)
    avatar_url = Column(String)
    culture_xp = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    last_active_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

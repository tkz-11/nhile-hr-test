from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Date, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    scored_at = Column(Date, nullable=False, server_default=func.current_date())
    risk_level = Column(String, nullable=False)
    risk_score = Column(Numeric(5, 2))
    days_in_team = Column(Integer)
    stuck_days = Column(Integer, default=0)
    engage_score = Column(Numeric(4, 1))
    emotional_note = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class InterventionLog(Base):
    __tablename__ = "intervention_logs"
    id = Column(UUID(as_uuid=True), primary_key=True)
    member_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    hr_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id"))
    action_type = Column(String, nullable=False)
    note = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

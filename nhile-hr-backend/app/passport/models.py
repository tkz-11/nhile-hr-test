from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Date, Numeric, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class DirectnessScore(Base):
    __tablename__ = "directness_scores"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    week_start = Column(Date, nullable=False)
    directness_score = Column(Numeric(4, 1), nullable=False)
    safety_score = Column(Numeric(4, 1))
    feedback_timeliness = Column(Numeric(4, 1))
    wyfl_compliance = Column(Numeric(4, 1))
    language_standard = Column(Numeric(4, 1))
    scenario_completion = Column(Numeric(4, 1))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class RewriteLog(Base):
    __tablename__ = "rewrite_logs"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    original_text = Column(String, nullable=False)
    rewritten_text = Column(String)
    detected_type = Column(String)
    hint_shown = Column(String)
    score_before = Column(Numeric(4, 1))
    score_after = Column(Numeric(4, 1))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CultureDailyLog(Base):
    __tablename__ = "culture_daily_logs"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    log_date = Column(Date, nullable=False, server_default=func.current_date())
    deadline_met = Column(Boolean, default=False)
    wyfls_checked = Column(Boolean, default=False)
    banned_word = Column(Boolean, default=False)
    direct_score = Column(Integer)
    identity_choice = Column(String)
    xp_earned = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

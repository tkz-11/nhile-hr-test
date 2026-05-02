from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base

class Story(Base):
    __tablename__ = "stories"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"))
    content = Column(String, nullable=False)
    experience_type = Column(String)
    courage_level = Column(String)
    support_level = Column(String)
    is_public = Column(Boolean, default=True)
    is_anonymous = Column(Boolean, default=False)
    reactions = Column(JSONB, server_default='{"brave": 0, "respect": 0, "learn": 0}')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Challenge(Base):
    __tablename__ = "challenges"
    id = Column(UUID(as_uuid=True), primary_key=True)
    type = Column(String, nullable=False)
    text = Column(String, nullable=False)
    points = Column(Integer, default=20, nullable=False)
    active_from = Column(Date)
    active_until = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ChallengeSubmission(Base):
    __tablename__ = "challenge_submissions"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    challenge_id = Column(UUID(as_uuid=True), ForeignKey("challenges.id"))
    proof_text = Column(String, nullable=False)
    ai_approved = Column(Boolean)
    ai_feedback = Column(String)
    ai_reason = Column(String)
    awarded_points = Column(Integer, default=0)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

class Milestone(Base):
    __tablename__ = "milestones"
    id = Column(UUID(as_uuid=True), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    milestone = Column(String, nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    recap_note = Column(String)

class StoryReaction(Base):
    __tablename__ = "story_reactions"
    id = Column(UUID(as_uuid=True), primary_key=True)
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"))
    reaction_type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

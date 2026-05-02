-- =====================================================================
-- NhiLe HR — Culture OS  |  Supabase Schema (PostgreSQL 15)
-- Chạy file này trong Supabase SQL Editor nếu các bảng chưa tồn tại.
-- Lệnh CREATE TABLE IF NOT EXISTS đảm bảo an toàn — không ghi đè dữ liệu cũ.
-- =====================================================================

-- Bật extension cần thiết để generate UUID tự động
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. USER PROFILES (gắn với auth.users của Supabase qua id)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id              UUID PRIMARY KEY,
    org_id          UUID,
    full_name       TEXT NOT NULL,
    email           TEXT NOT NULL,
    primary_role    TEXT NOT NULL,
    avatar_url      TEXT,
    culture_xp      INTEGER DEFAULT 0,
    streak_days     INTEGER DEFAULT 0,
    last_active_at  TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

-- ---------------------------------------------------------------------
-- 2. TEAMS & MEMBERSHIPS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teams (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id      UUID,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_memberships (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    team_id     UUID REFERENCES teams(id) ON DELETE CASCADE,
    role        TEXT DEFAULT 'member',
    joined_at   TIMESTAMPTZ DEFAULT NOW(),
    is_primary  BOOLEAN DEFAULT TRUE
);

-- ---------------------------------------------------------------------
-- 3. RETENTION (Risk + Intervention)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS risk_scores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    scored_at       DATE NOT NULL DEFAULT CURRENT_DATE,
    risk_level      TEXT NOT NULL,
    risk_score      NUMERIC(5, 2),
    days_in_team    INTEGER,
    stuck_days      INTEGER DEFAULT 0,
    engage_score    NUMERIC(4, 1),
    emotional_note  TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intervention_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id    UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    hr_id        UUID REFERENCES user_profiles(id),
    action_type  TEXT NOT NULL,
    note         TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 4. PASSPORT (Directness + Rewrite + Culture Daily)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS directness_scores (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id               UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    week_start            DATE NOT NULL,
    directness_score      NUMERIC(4, 1) NOT NULL,
    safety_score          NUMERIC(4, 1),
    feedback_timeliness   NUMERIC(4, 1),
    wyfl_compliance       NUMERIC(4, 1),
    language_standard     NUMERIC(4, 1),
    scenario_completion   NUMERIC(4, 1),
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rewrite_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    original_text   TEXT NOT NULL,
    rewritten_text  TEXT,
    detected_type   TEXT,
    hint_shown      TEXT,
    score_before    NUMERIC(4, 1),
    score_after     NUMERIC(4, 1),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS culture_daily_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    log_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline_met    BOOLEAN DEFAULT FALSE,
    wyfls_checked   BOOLEAN DEFAULT FALSE,
    banned_word     BOOLEAN DEFAULT FALSE,
    direct_score    INTEGER,
    identity_choice TEXT,
    xp_earned       INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 5. CULTURE (Stories, Challenges, Milestones, Reactions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    team_id         UUID REFERENCES teams(id),
    content         TEXT NOT NULL,
    experience_type TEXT,
    courage_level   TEXT,
    support_level   TEXT,
    is_public       BOOLEAN DEFAULT TRUE,
    reactions       JSONB DEFAULT '{"brave": 0, "respect": 0, "learn": 0}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type          TEXT NOT NULL,
    text          TEXT NOT NULL,
    points        INTEGER NOT NULL DEFAULT 20,
    active_from   DATE,
    active_until  DATE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_submissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    challenge_id    UUID REFERENCES challenges(id),
    proof_text      TEXT NOT NULL,
    ai_approved     BOOLEAN,
    ai_feedback     TEXT,
    ai_reason       TEXT,
    awarded_points  INTEGER DEFAULT 0,
    submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestones (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    milestone     TEXT NOT NULL,
    completed_at  TIMESTAMPTZ DEFAULT NOW(),
    recap_note    TEXT
);

CREATE TABLE IF NOT EXISTS story_reactions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id       UUID REFERENCES stories(id) ON DELETE CASCADE,
    user_id        UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    reaction_type  TEXT NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 6. INDEXES (tăng tốc query thường gặp)
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_profiles_email     ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user   ON team_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team   ON team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_user_date   ON risk_scores(user_id, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_team            ON stories(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_culture_daily_user_date ON culture_daily_logs(user_id, log_date DESC);

-- ---------------------------------------------------------------------
-- 7. KIỂM TRA: chạy đoạn này để xem tất cả bảng đã được tạo
-- ---------------------------------------------------------------------
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;

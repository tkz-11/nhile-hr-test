-- =====================================================================
-- NhiLe HR — Culture OS  |  SEED DATA mẫu để test
-- Chạy SAU khi đã chạy supabase_schema.sql.
-- Idempotent: dùng ON CONFLICT DO NOTHING để chạy nhiều lần không lỗi.
-- =====================================================================

-- 1) USERS — bao gồm 1 dev HR (UUID 1111... khớp với DEV_USER_ID trong code)
INSERT INTO user_profiles (id, org_id, full_name, email, primary_role, culture_xp, streak_days)
VALUES
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001',
     'Nguyễn Thanh Trang', 'hr@nhile.local', 'hr_manager', 480, 12),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001',
     'Trần Văn Bình', 'leader1@nhile.local', 'leader', 320, 7),
    ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001',
     'Phạm Ngọc Lan', 'leader2@nhile.local', 'leader', 290, 5),
    ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001',
     'Nguyễn Minh Anh', 'minhanh@nhile.local', 'member', 120, 2),
    ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001',
     'Lê Thị Thu Hà', 'thuha@nhile.local', 'member', 180, 4),
    ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000001',
     'Đinh Quốc Việt', 'quocviet@nhile.local', 'member', 90, 1),
    ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000001',
     'Vũ Thị Bảo Châu', 'baochau@nhile.local', 'member', 250, 6),
    ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000001',
     'Phạm Đức Dũng', 'ducdung@nhile.local', 'member', 140, 3)
ON CONFLICT (id) DO NOTHING;

-- 2) TEAMS
INSERT INTO teams (id, org_id, name)
VALUES
    ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Editor'),
    ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Design'),
    ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'IT/Tech'),
    ('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Product')
ON CONFLICT (id) DO NOTHING;

-- 3) TEAM MEMBERSHIPS
INSERT INTO team_memberships (id, user_id, team_id, role, is_primary)
VALUES
    ('bbbbbbbb-0000-0000-0000-000000000001',
     '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001', 'leader', TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000002',
     '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000002', 'leader', TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000003',
     '44444444-4444-4444-4444-444444444444', 'aaaaaaaa-0000-0000-0000-000000000001', 'member', TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000004',
     '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-0000-0000-0000-000000000002', 'member', TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000005',
     '66666666-6666-6666-6666-666666666666', 'aaaaaaaa-0000-0000-0000-000000000003', 'member', TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000006',
     '77777777-7777-7777-7777-777777777777', 'aaaaaaaa-0000-0000-0000-000000000001', 'member', TRUE),
    ('bbbbbbbb-0000-0000-0000-000000000007',
     '88888888-8888-8888-8888-888888888888', 'aaaaaaaa-0000-0000-0000-000000000004', 'member', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 4) RISK SCORES — 3 mức risk để test radar
INSERT INTO risk_scores (id, user_id, scored_at, risk_level, risk_score, days_in_team, stuck_days, engage_score, emotional_note)
VALUES
    ('cccccccc-0000-0000-0000-000000000001',
     '44444444-4444-4444-4444-444444444444', CURRENT_DATE,
     'high', 8.5, 85, 8, 3.2,
     'Cảm thấy bị cô lập do thiếu kết nối liên tục 2 tuần qua'),

    ('cccccccc-0000-0000-0000-000000000002',
     '55555555-5555-5555-5555-555555555555', CURRENT_DATE,
     'medium', 5.8, 68, 4, 5.5,
     'Đang chịu áp lực cao nhưng có xu hướng im lặng chịu đựng'),

    ('cccccccc-0000-0000-0000-000000000003',
     '66666666-6666-6666-6666-666666666666', CURRENT_DATE,
     'low', 2.1, 30, 0, 7.8,
     NULL),

    ('cccccccc-0000-0000-0000-000000000004',
     '77777777-7777-7777-7777-777777777777', CURRENT_DATE,
     'low', 1.5, 80, 0, 8.5,
     NULL),

    ('cccccccc-0000-0000-0000-000000000005',
     '88888888-8888-8888-8888-888888888888', CURRENT_DATE,
     'low', 2.3, 45, 0, 7.2,
     NULL)
ON CONFLICT (id) DO NOTHING;

-- 5) STORIES (Văn hoá chia sẻ)
INSERT INTO stories (id, user_id, team_id, content, experience_type, courage_level, support_level, is_public)
VALUES
    ('dddddddd-0000-0000-0000-000000000001',
     '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000001',
     'Hôm nay tôi đã nói rõ với team về deadline thật, không che giấu nữa. Cảm thấy nhẹ nhõm.',
     'directness', 'high', 'medium', TRUE),

    ('dddddddd-0000-0000-0000-000000000002',
     '55555555-5555-5555-5555-555555555555', 'aaaaaaaa-0000-0000-0000-000000000002',
     'Lần đầu phản hồi thẳng với leader về một quyết định mình không đồng ý — kết quả: được lắng nghe.',
     'feedback', 'high', 'high', TRUE),

    ('dddddddd-0000-0000-0000-000000000003',
     '77777777-7777-7777-7777-777777777777', 'aaaaaaaa-0000-0000-0000-000000000001',
     'Đã chủ động hỏi thăm một bạn ít nói trong team — phát hiện bạn đang gặp khó. Đã kết nối với HR.',
     'support', 'medium', 'high', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 6) CHALLENGES
INSERT INTO challenges (id, type, text, points, active_from, active_until)
VALUES
    ('eeeeeeee-0000-0000-0000-000000000001', 'daily', 'Nói rõ deadline cụ thể trong tin nhắn giao việc đầu tiên hôm nay.', 20, CURRENT_DATE, CURRENT_DATE + 30),
    ('eeeeeeee-0000-0000-0000-000000000002', 'weekly', 'Đưa 1 phản hồi thẳng nhưng tôn trọng cho leader trong tuần này.', 50, CURRENT_DATE, CURRENT_DATE + 7)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- KIỂM TRA — bỏ comment để xem dữ liệu sau khi chạy
-- ─────────────────────────────────────────────────────────────────────
-- SELECT primary_role, COUNT(*) FROM user_profiles GROUP BY primary_role;
-- SELECT risk_level, COUNT(*) FROM risk_scores GROUP BY risk_level;
-- SELECT * FROM stories ORDER BY created_at DESC;

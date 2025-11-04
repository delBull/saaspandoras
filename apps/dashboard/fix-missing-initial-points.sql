-- Script to fix missing initial points and achievements for existing gamification profiles

-- First, let's check which users have profiles but 0 points
-- UPDATE gamification_profiles SET total_points = 10, level_progress = 10 WHERE total_points = 0;

-- Add initial points records for users who have profiles but no points
INSERT INTO user_points (user_id, points, reason, category, metadata, created_at)
SELECT
    gp.user_id,
    10,
    'Primer Login: Conexión inicial al sistema',
    'daily_login',
    '{"type": "first_login"}',
    NOW()
FROM gamification_profiles gp
LEFT JOIN user_points up ON gp.user_id = up.user_id AND up.reason LIKE 'Primer Login%'
WHERE gp.total_points = 0
AND up.id IS NULL;

-- Update gamification profiles to have initial points
UPDATE gamification_profiles
SET
    total_points = 10,
    level_progress = 10,
    points_to_next_level = 90,
    total_active_days = 1,
    last_activity_date = NOW(),
    updated_at = NOW()
WHERE total_points = 0;

-- Grant "Primer Login" achievement to users who have profiles but no achievements
INSERT INTO user_achievements (user_id, achievement_id, progress, is_unlocked, unlocked_at, created_at, updated_at)
SELECT
    gp.user_id,
    a.id,
    100,
    true,
    NOW(),
    NOW(),
    NOW()
FROM gamification_profiles gp
CROSS JOIN achievements a
LEFT JOIN user_achievements ua ON gp.user_id = ua.user_id AND ua.achievement_id = a.id
WHERE a.name = 'Primer Login'
AND gp.total_points = 0
AND ua.id IS NULL;

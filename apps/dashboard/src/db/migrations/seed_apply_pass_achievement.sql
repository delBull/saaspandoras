INSERT INTO achievements (name, description, icon, type, required_points, points_reward, badge_url, is_active)
SELECT 'Apply Pass Holder', 'Poseedor del acceso exclusivo para crear protocolos en Pandora.', '🎟️', 'early_adopter', 0, 100, '/badges/apply-pass.png', true
WHERE NOT EXISTS (
    SELECT 1 FROM achievements WHERE name = 'Apply Pass Holder'
);

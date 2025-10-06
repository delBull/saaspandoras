-- Check existing projects in database
SELECT
  id,
  title,
  slug,
  status,
  created_at
FROM projects
ORDER BY created_at DESC;

-- 🔹 Migration Script: Assign wallet addresses to existing projects
-- This updates projects that don't have applicant_wallet_address assigned yet

-- 1. Update existing projects that have email but no wallet address
-- This maps using the user relationship (assuming projects.user_id exists)
UPDATE projects p
SET applicant_wallet_address = LOWER(u."walletAddress")
FROM "User" u
WHERE p.user_id IS NOT NULL
  AND u.id = p.user_id
  AND p.applicant_wallet_address IS NULL
  AND u."walletAddress" IS NOT NULL;

-- 2. Alternative: For cases where projects store applicant_email directly
-- This handles legacy projects that only have email
UPDATE projects p
SET applicant_wallet_address = LOWER(u."walletAddress")
FROM "User" u
WHERE p.applicant_email IS NOT NULL
  AND u.email = p.applicant_email
  AND p.applicant_wallet_address IS NULL
  AND u."walletAddress" IS NOT NULL;

-- 3. Verify the migration worked
-- Check how many projects remain without wallet addresses
SELECT
  COUNT(*) as total_projects,
  COUNT(CASE WHEN applicant_wallet_address IS NOT NULL THEN 1 END) as with_wallet,
  COUNT(CASE WHEN applicant_wallet_address IS NULL THEN 1 END) as without_wallet,
  COUNT(CASE WHEN applicant_email IS NOT NULL AND applicant_wallet_address IS NULL THEN 1 END) as legacy_with_email
FROM projects;

-- 4. List projects that still don't have wallet addresses (for manual review)
SELECT
  p.id,
  p.title,
  p.applicant_email,
  p.applicant_wallet_address,
  p.created_at
FROM projects p
WHERE p.applicant_wallet_address IS NULL
ORDER BY p.created_at DESC;

-- Instructions:
-- 1. Run this script in your database (via psql, database GUI, or migration tool)
-- 2. Check the verification results
-- 3. If there are projects with NULL applicant_wallet_address, they may need:
--    - Manual wallet address assignment
--    - Or deletion if they're old/unused projects

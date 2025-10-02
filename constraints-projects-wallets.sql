-- 🔹 Data Integrity Constraints for Projects and Wallets
-- Run this AFTER the migration script above

-- 1. First, ensure no NULL values remain (check migration results before proceeding)
-- The following command should show 0 rows:
-- SELECT COUNT(*) FROM projects WHERE applicant_wallet_address IS NULL;

-- 2. Make applicant_wallet_address required (NOT NULL)
-- This ensures all future projects MUST have a wallet address
ALTER TABLE projects
ALTER COLUMN applicant_wallet_address SET NOT NULL;

-- 3. Normalize existing wallet addresses to lowercase
-- Consistency is crucial for blockchain addresses
UPDATE projects
SET applicant_wallet_address = LOWER(applicant_wallet_address)
WHERE applicant_wallet_address IS NOT NULL;

-- 4. Add foreign key constraint for data integrity
-- This ensures every project wallet address corresponds to a real user
-- Note: If you have NULL values, this will fail - run migration first!
ALTER TABLE projects
ADD CONSTRAINT fk_projects_applicant_wallet
FOREIGN KEY (applicant_wallet_address)
REFERENCES "User"("walletAddress")
ON UPDATE CASCADE
ON DELETE RESTRICT; -- Prevent deleting users with active projects

-- 5. Optional: Add unique constraint if needed
-- If one wallet can only have one project, uncomment:
-- ALTER TABLE projects ADD CONSTRAINT unique_wallet_per_project
-- EXCLUDE (applicant_wallet_address WITH =) WHERE (status != 'cancelled');

-- 6. Create an index for performance
-- Speed up wallet-based project lookups
CREATE INDEX IF NOT EXISTS idx_projects_applicant_wallet
ON projects(applicant_wallet_address);

-- 7. Verification queries
-- Check constraint is working
SELECT
  COUNT(*) as total_projects,
  COUNT(DISTINCT applicant_wallet_address) as unique_wallets
FROM projects;

-- Verify foreign key relationship exists
SELECT
  p.applicant_wallet_address as project_wallet,
  u.name as user_name,
  COUNT(p.id) as project_count
FROM projects p
JOIN "User" u ON LOWER(u."walletAddress") = LOWER(p.applicant_wallet_address)
GROUP BY p.applicant_wallet_address, u.name
ORDER BY project_count DESC
LIMIT 10;

-- Instructions:
-- 1. Run migration script first (migrate-projects-wallets.sql)
-- 2. Verify no NULL wallet addresses remain
-- 3. Run this constraints script
-- 4. Test by trying to create a project without wallet address (should fail)

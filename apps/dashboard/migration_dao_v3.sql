-- Migration DAO v3: Fix Submissions Table
ALTER TABLE dao_activity_submissions ADD COLUMN IF NOT EXISTS project_id INTEGER;
ALTER TABLE dao_activity_submissions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE dao_activity_submissions ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE dao_activity_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_dao_submissions_project_id ON dao_activity_submissions(project_id);

-- Migration DAO v2: Staking, Voting, Official Threads

-- 1. DAO Activities (Labores Update)
ALTER TABLE dao_activities ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'social'; -- 'social', 'labor', 'governance'
ALTER TABLE dao_activities ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}'; -- Staking params

-- 2. DAO Submissions (Time Tracking)
ALTER TABLE dao_activity_submissions ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE; -- For staking start

-- 3. DAO Threads (Official)
ALTER TABLE dao_threads ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT FALSE;

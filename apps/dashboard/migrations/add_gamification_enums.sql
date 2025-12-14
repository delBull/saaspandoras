-- Add new values to event_type enum
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'dao_activated';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'artifact_purchased';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'staking_deposit';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'proposal_vote';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'rewards_claimed';

-- Add new values to achievement_type enum
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'dao_pioneer';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'artifact_collector';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'defi_starter';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'governor';
ALTER TYPE achievement_type ADD VALUE IF NOT EXISTS 'yield_hunter';

-- Migration V5: Add 'activity_completed' to event_type Enum
-- This allows the system to track activity completions for cooldown logic.

ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'activity_completed';

-- Verify it was added (Optional check)
-- SELECT enum_range(NULL::event_type);

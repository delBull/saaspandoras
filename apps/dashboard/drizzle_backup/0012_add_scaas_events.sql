-- Add new values to event_type enum
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'protocol_deployed';
ALTER TYPE "event_type" ADD VALUE IF NOT EXISTS 'sale_certified';

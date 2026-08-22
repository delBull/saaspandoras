-- Migration 0030: Add Unique Constraint to hermes_actor_journeys (organization_id, actor_id, journey_id)
-- Ensures idempotent physical constraint on active actor journey progression per tenant

CREATE UNIQUE INDEX IF NOT EXISTS "hermes_actor_journeys_org_actor_journey_uniq" 
ON "hermes_actor_journeys" ("organization_id", "actor_id", "journey_id");

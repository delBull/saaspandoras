ALTER TABLE "projects" ADD COLUMN "license_contract_address" varchar(42);
ALTER TABLE "projects" ADD COLUMN "utility_contract_address" varchar(42);
ALTER TABLE "projects" ADD COLUMN "loom_contract_address" varchar(42);
ALTER TABLE "projects" ADD COLUMN "governor_contract_address" varchar(42);
ALTER TABLE "projects" ADD COLUMN "chain_id" integer;
ALTER TABLE "projects" ADD COLUMN "deployment_status" varchar(50) DEFAULT 'pending';
ALTER TABLE "projects" ADD COLUMN "w2e_config" jsonb DEFAULT '{}'::jsonb;

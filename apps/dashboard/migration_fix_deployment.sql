-- Migration to add deployment status and contract addresses to projects table
DO $$ 
BEGIN 
    -- Add deployment_status if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'deployment_status') THEN
        ALTER TABLE "projects" ADD COLUMN "deployment_status" VARCHAR(50) DEFAULT 'pending';
    END IF;

    -- Add license_contract_address if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'license_contract_address') THEN
        ALTER TABLE "projects" ADD COLUMN "license_contract_address" VARCHAR(42);
    END IF;

    -- Add treasury_contract_address if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'treasury_contract_address') THEN
        ALTER TABLE "projects" ADD COLUMN "treasury_contract_address" VARCHAR(42);
    END IF;

    -- Add governor_contract_address if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'governor_contract_address') THEN
        ALTER TABLE "projects" ADD COLUMN "governor_contract_address" VARCHAR(42);
    END IF;
END $$;

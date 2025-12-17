-- Migration DAO v4: Voting Contract Address
ALTER TABLE projects ADD COLUMN IF NOT EXISTS voting_contract_address VARCHAR(42);

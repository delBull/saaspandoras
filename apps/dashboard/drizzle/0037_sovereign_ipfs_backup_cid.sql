-- 🌐 Pandora's Hermes OS — Sovereign IPFS Multi-Provider Durability Migration
-- Migration: 0037_sovereign_ipfs_backup_cid.sql

ALTER TABLE hermes_knowledge_registry ADD COLUMN IF NOT EXISTS backup_ipfs_cid VARCHAR(255);
ALTER TABLE hermes_claim_contracts ADD COLUMN IF NOT EXISTS backup_ipfs_cid VARCHAR(255);

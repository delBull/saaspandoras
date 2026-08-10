-- Deal Room: firma on-chain del firmante (mensaje EIP-191 via social login)
ALTER TABLE "nexus_deal_signers" ADD COLUMN IF NOT EXISTS "signature" text;
ALTER TABLE "nexus_deal_signers" ADD COLUMN IF NOT EXISTS "signature_message" text;

-- Agregar tu wallet como admin
INSERT INTO "administrators" ("walletAddress", "alias", "role", "addedBy", "createdAt")
VALUES (
  '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
  'Super Admin',
  'admin',
  'system',
  NOW()
) ON CONFLICT ("walletAddress") DO NOTHING;

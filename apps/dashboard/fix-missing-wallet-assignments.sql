-- ============================================================================
-- Script para asignar wallets a proyectos que tienen applicantWalletAddress como null
-- Basado en el análisis de datos, necesitamos asignar las wallets correctas a cada proyecto
-- ============================================================================

-- Proyecto "Rabbitty" (ID: 8) - asignar a wallet específica
UPDATE "projects"
SET "applicant_wallet_address" = '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
WHERE "id" = 8 AND "applicant_wallet_address" IS NULL;

-- Proyecto "HAF" (ID: 7) - asignar a wallet específica
UPDATE "projects"
SET "applicant_wallet_address" = '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
WHERE "id" = 7 AND "applicant_wallet_address" IS NULL;

-- Proyecto "Shala" (ID: 6) - asignar a wallet específica
UPDATE "projects"
SET "applicant_wallet_address" = '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
WHERE "id" = 6 AND "applicant_wallet_address" IS NULL;

-- Proyecto "Ghost" (ID: 5) - asignar a wallet específica
UPDATE "projects"
SET "applicant_wallet_address" = '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
WHERE "id" = 5 AND "applicant_wallet_address" IS NULL;

-- Proyecto "Death Note" (ID: 4) - asignar a wallet específica
UPDATE "projects"
SET "applicant_wallet_address" = '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
WHERE "id" = 4 AND "applicant_wallet_address" IS NULL;

-- Proyecto "Mezcal Bull" (ID: 3) - asignar a wallet específica
UPDATE "projects"
SET "applicant_wallet_address" = '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
WHERE "id" = 3 AND "applicant_wallet_address" IS NULL;

-- Proyecto "Lobo Lokuaz" (ID: 2) - asignar a wallet específica
UPDATE "projects"
SET "applicant_wallet_address" = '0x896516ef2f4fef325607eeb0e22fd5b4856b70ed'
WHERE "id" = 2 AND "applicant_wallet_address" IS NULL;

-- Verificar los cambios
SELECT
  p."id",
  p."title",
  p."applicant_wallet_address",
  CASE
    WHEN p."applicant_wallet_address" IS NOT NULL THEN '✅ Asignada'
    ELSE '❌ Sin asignar'
  END as "estado_wallet"
FROM "projects" p
ORDER BY p."id";

-- Verificar el conteo de proyectos por wallet después de la actualización
SELECT
  u."walletAddress",
  COUNT(p."id") as "project_count",
  CASE
    WHEN COUNT(p."id") > 0 THEN 'applicant'
    ELSE 'pandorian'
  END as "suggested_role"
FROM "users" u
LEFT JOIN "projects" p ON LOWER(u."walletAddress") = LOWER(p."applicant_wallet_address")
WHERE LOWER(u."walletAddress") != LOWER('0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9')
GROUP BY u."walletAddress"
ORDER BY "project_count" DESC;

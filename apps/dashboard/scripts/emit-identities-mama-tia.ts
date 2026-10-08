/**
 * EMISIÓN CANÓNICA DE IDENTIDAD — Ruta B (Alchemy-free, solo DB canónica)
 * Emission de canonicalIdentityId para:
 *   Mamá: Susana Del Toro — +52 322 102 3028 — emails: susana@aztecaz.xyz (primary) / azteceagle.realtor@gmail.com (sec)
 *   Tía:  Celina Del Toro — +52 322 131 8300 — emails: cely@aztecaz.xyz (primary) / aztecas@hotmail.com (sec)
 *
 * GARANTÍAS DE SEGURIDAD:
 * - PUTERO aditivo: solo INSERTs con pre-check idempotente (si la fila existe, se reutiliza su UUID; nunca duplica).
 * - Transacción única: users + user_identities (binding whatsapp) + nexus_collaborators, todo o nada.
 * - Audit trail: hermes_security_events vía SecurityAuditLogger (hash-chain canoníca de Hermes) — 1 evento por identidad.
 * - NO toca: whatsapp_users (legacy), nodes de Sofia, policíes, ni ninguna otra tabla.
 */
import { db } from "@saasfly/db-core";
import { users, userIdentities, nexusCollaborators } from "@saasfly/db-core";
import { eq, inArray } from "drizzle-orm";
import { SecurityAuditLogger } from "../../../packages/hermes-core/src/runtime/security-audit-logger";
import { randomBytes } from "crypto";

// ── Datos de entrada (la verdad, no inventada) ─────────────────────────────
const SUBJECTS = [
  {
    label: "mama",
    name: "Susana Del Toro",
    whatsapp: "523221023028", // +52 322 102 3028
    primaryEmail: "susana@aztecaz.xyz",
    secondaryEmail: "azteceagle.realtor@gmail.com",
  },
  {
    label: "tia",
    name: "Celina Del Toro",
    whatsapp: "523221318300", // +52 322 131 8300
    primaryEmail: "cely@aztecaz.xyz",
    secondaryEmail: "aztecas@hotmail.com",
  },
];
const CORRELATION_ID = `routeb-identity-emission-2026-10-08`;
const ADMIN_ACTOR = "0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa"; // Marco (real, Hermes/Nexus)

function newToken(): string {
  return `nx_${randomBytes(32).toString("hex")}`;
}

async function main() {
  const results: { label: string; canonicalIdentityId: string }[] = [];

  // 1. Transacción única: users + user_identities + nexus_collaborators
  await db.transaction(async (tx) => {
    for (const s of SUBJECTS) {
      // Pre-check idempotente: si ya existe, reutilizar (no crear segunda identidad para la misma persona)
      const existing = await tx.select({ id: users.id }).from(users).where(inArray(users.email, [s.primaryEmail, s.secondaryEmail]));
      let userId: string;

      if (existing.length > 0) {
        if (existing.length > 1) throw new Error(`Regeneración imposible: ${s.label} ya tiene ${existing.length} filas de users — resolver manualmente.`);
        userId = existing[0].id;
        console.log(`[reuse] ${s.label}: user ya existe → ${userId}`);
      } else {
        userId = crypto.randomUUID();
        await tx.insert(users).values({
          id: userId,
          name: s.name,
          email: s.primaryEmail,
          status: "ACTIVE",
          role: "user",
          acquisitionSource: "admin_identity_emission_routeb_2026-10-08",
        });
        console.log(`[insert] ${s.label}: users → ${userId}`);
      }

      // 2. Binding del canal WhatsApp (canal primario de ambas)
      const existingBinding = await tx.select({ id: userIdentities.id }).from(userIdentities)
        .where(eq(userIdentities.userId, userId));
      const hasWhatsappBinding = (await tx.select().from(userIdentities).where(inArray(userIdentities.userId, [userId])))
        .some((r: any) => r.provider === "whatsapp" && r.providerId === s.whatsapp);
      if (!hasWhatsappBinding) {
        await tx.insert(userIdentities).values({ userId, provider: "whatsapp", providerId: s.whatsapp });
        console.log(`[insert] ${s.label}: user_identities whatsapp → ${s.whatsapp}`);
      } else {
        console.log(`[reuse] ${s.label}: binding whatsapp ya existe`);
      }

      // 3. Colaborador Nexus (RBAC mínimo: COLLABORATOR, sin permisos extra)
      const existingCollab = await tx.select().from(nexusCollaborators).where(inArray(nexusCollaborators.email, [s.primaryEmail, s.secondaryEmail]));
      if (existingCollab.length === 0) {
        await tx.insert(nexusCollaborators).values({
          canonicalOrgId: "pandoras",
          name: s.name,
          email: s.primaryEmail,
          token: newToken(),
          role: "COLLABORATOR",
          permissions: {},
          whatsappPhone: s.whatsapp,
          status: "ACTIVE",
          expiresAt: new Date("2028-10-08T00:00:00Z"), // 2 años, renovable por admin
        });
        console.log(`[insert] ${s.label}: nexus_collaborators → ${s.primaryEmail}`);
      } else {
        console.log(`[reuse] ${s.label}: collaborators ya existe`);
      }

      results.push({ label: s.label, canonicalIdentityId: userId });
    }
  });

  // 4. Audit trail (hash-chain canónica de Hermes) — fuera de la tx, event per identity
  for (const s of SUBJECTS) {
    const canonical = results.find((r) => r.label === s.label)!.canonicalIdentityId;
    try {
      await SecurityAuditLogger.logEvent({
        organizationId: "pandoras",
        actorId: ADMIN_ACTOR,
        eventType: "IDENTITY_ISSUED",
        severity: "INFO",
        policyDecision: "ALLOW",
        correlationId: CORRELATION_ID,
        artifactId: canonical,
        classification: "INTERNAL",
        metadata: {
          label: s.label,
          subjectName: s.name,
          primaryEmail: s.primaryEmail,
          secondaryEmail: s.secondaryEmail,
          whatsappE164: s.whatsapp,
          emissionMethod: "admin_script_route_b",
          script: "scripts/emit-identities-mama-tia.ts",
          emittedAt: new Date().toISOString(),
        },
      });
      console.log(`[audit] ${s.label}: hermes_security_events → IDENTITY_ISSUED`);
    } catch (e: any) {
      console.error(`[audit][FAIL] ${s.label}: ${e.message} — la emisión EXISTE pero el audit chain falló. REPORTAR.`);
    }
  }

  console.log("\n=== RESULTADO FINAL (copy-ready para el registro de Sofia) ===");
  for (const r of results) {
    console.log(`${r.label}: canonicalIdentityId = ${r.canonicalIdentityId}`);
  }
  process.exit(0);
}
main().catch((e) => { console.error("EMISSION FAILED (rollback automático de la tx):", e.message); process.exit(1); });

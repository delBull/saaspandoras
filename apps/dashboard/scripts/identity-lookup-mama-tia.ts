/**
 * SOLO LECTURA — Lookup de identidades existentes: Mamá (Susana Del Toro) y Tía (Celina Del Toro)
 * No escribe nada. Reporta coincidencias por email / whatsapp / nombre en:
 * users, user_identities, nexus_collaborators, whatsapp_users
 */
import { db } from "@saasfly/db-core";
import { users, userIdentities, nexusCollaborators, whatsappUsers } from "@saasfly/db-core";
import { inArray, or, ilike, eq } from "drizzle-orm";

const EMAILS = [
  "azteceagle.realtor@gmail.com",
  "susana@aztecaz.xyz",
  "aztecas@hotmail.com",
  "cely@aztecaz.xyz",
];
const PHONES = ["523221023028", "523221318300"]; // E.164 sin '+': mamá +52 322 102 3028 / tía +52 322 131 8300
const NAMES = ["susana", "celina"];

async function main() {
  console.log("=== users por email ===");
  const u = await db.select({ id: users.id, name: users.name, email: users.email, status: users.status, role: users.role, createdAt: users.createdAt }).from(users).where(inArray(users.email, EMAILS));
  console.log(JSON.stringify(u, null, 2));

  console.log("=== users por nombre ilike ===");
  const un = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(or(...NAMES.map((n) => ilike(users.name, `%${n}%`))));
  console.log(JSON.stringify(un, null, 2));

  console.log("=== user_identities por providerId (whatsapp/phone) ===");
  const ui = await db.select().from(userIdentities).where(inArray(userIdentities.providerId, PHONES));
  console.log(JSON.stringify(ui, null, 2));

  console.log("=== nexus_collaborators por email/phone/nombre ===");
  const nc = await db.select().from(nexusCollaborators).where(
    or(inArray(nexusCollaborators.email, EMAILS), inArray(nexusCollaborators.whatsappPhone, PHONES), ...NAMES.map((n) => ilike(nexusCollaborators.name, `%${n}%`)))
  );
  console.log(JSON.stringify(nc, null, 2));

  console.log("=== whatsapp_users por phone ===");
  const wu = await db.select().from(whatsappUsers).where(inArray(whatsappUsers.phone, PHONES));
  console.log(JSON.stringify(wu, null, 2));

  console.log("=== CONVENCIÓN: muestra de 2 colaboradores existentes (expiresAt/token/role) ===");
  const sample = await db.select({ name: nexusCollaborators.name, role: nexusCollaborators.role, expiresAt: nexusCollaborators.expiresAt, tokenLen: nexusCollaborators.token, status: nexusCollaborators.status }).from(nexusCollaborators).limit(2);
  console.log(JSON.stringify(sample, null, 2));

  process.exit(0);
}
main().catch((e) => { console.error("LOOKUP FAILED:", e.message); process.exit(1); });

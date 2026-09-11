/**
 * 🔐 Seal Contact Doctrines — Backfill production script
 * apps/dashboard/scripts/seal-contact-doctrines.ts
 *
 * Sella la doctrina de TODOS los contactos con directiva de bienvenida
 * (customWelcome/welcomeDirective) a la bóveda soberana IPFS (K25 envelope +
 * CID derivable + firma EIP-712). Idempotente: crea nuevas versiones solo si
 * el contenido cambió, y re-intenta sellos pendientes (pendingReplica=true).
 *
 * Uso: bun run apps/dashboard/scripts/seal-contact-doctrines.ts
 */
import 'dotenv/config';
import { db } from '../src/db';
import { marketingLeads } from '../src/db/schema';
import { sql as drizzleSql } from 'drizzle-orm';
import { sealContactDoctrine, getContactDoctrineSeal } from '../src/lib/hermes/identity/contact-doctrine';

async function main() {
  console.log('🔐 [ContactDoctrineBackfill] Iniciando sellado soberano de doctrinas de contacto...');

  // Leads con directiva codificada (customWelcome o welcomeDirective)
  const leads = await db
    .select({ id: marketingLeads.id, name: marketingLeads.name })
    .from(marketingLeads)
    .where(drizzleSql`${marketingLeads.metadata}->>'customWelcome' IS NOT NULL OR ${marketingLeads.metadata}->>'welcomeDirective' IS NOT NULL`);

  console.log(`[ContactDoctrineBackfill] ${leads.length} contactos con doctrina a sellar.`);

  let sealed = 0;
  let pending = 0;
  let failed = 0;

  for (const lead of leads) {
    try {
      const receipt = await sealContactDoctrine(lead.id, { trigger: 'backfill' });
      if (receipt.pinned) {
        sealed++;
        console.log(`✅ ${lead.name ?? lead.id}: v${receipt.version} CID=${receipt.cid.slice(0, 20)}… pinned=${receipt.pinned}`);
      } else {
        pending++;
        console.log(`⏳ ${lead.name || lead.id}: v${receipt.version} sellada localmente, pin pendiente (nodo IPFS no alcanzable) — ${receipt.error}`);
      }
    } catch (err: any) {
      failed++;
      console.warn(`❌ ${lead.name || lead.id}: ${err?.message}`);
    }
  }

  console.log(`🏁 [ContactDoctrineBackfill] sealed=${sealed} pendingReplica=${pending} failed=${failed}`);
  process.exit(0);
}

main().catch((e) => { console.error('❌ Backfill fatal:', e); process.exit(1); });

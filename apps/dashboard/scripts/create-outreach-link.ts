/**
 * 🔗 Crea enlaces de captación atribuibles (`/l/<code>`).
 *
 * Sirve para cualquier destino: un Deal Pod o el portal de un tenant (S'Narai).
 * Cada publicación usa SU enlace, así el CRM sabe qué post trajo a cada persona
 * en lugar de decir sólo "Discord".
 *
 * Uso:
 *   bun run scripts/create-outreach-link.ts --label="AMA 1" --destination="https://snarai.aztecaz.xyz" --campaign=ama-1
 *   bun run scripts/create-outreach-link.ts --list
 */
import crypto from 'node:crypto';
import { db } from '@saasfly/db-core';
import { nexusOutreachLinks, nexusOutreachEvents } from '@saasfly/db-core/schema';
import { desc, eq, sql } from '@saasfly/db-core';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance').replace(/\/$/, '');

function newCode(): string {
  return crypto.randomBytes(4).toString('base64url').replace(/[^a-zA-Z0-9]/g, '').slice(0, 7).toLowerCase();
}

async function listLinks() {
  const rows = await db
    .select({
      code: nexusOutreachLinks.code,
      label: nexusOutreachLinks.targetLabel,
      destination: nexusOutreachLinks.destinationUrl,
      door: nexusOutreachLinks.door,
      disabledAt: nexusOutreachLinks.disabledAt,
      opens: sql<number>`count(${nexusOutreachEvents.id})::int`,
    })
    .from(nexusOutreachLinks)
    .leftJoin(nexusOutreachEvents, eq(nexusOutreachEvents.linkId, nexusOutreachLinks.id))
    .groupBy(nexusOutreachLinks.id)
    .orderBy(desc(nexusOutreachLinks.createdAt))
    .limit(50);

  if (rows.length === 0) {
    console.log('\nSin enlaces todavía.\n');
    return;
  }

  console.log('\nEnlaces de captación:\n');
  for (const r of rows) {
    console.log(
      `  ${r.disabledAt ? '⏸ ' : '  '}${BASE}/l/${r.code}  · ${String(r.opens).padStart(3)} aperturas · ${(r.label || '—').slice(0, 40).padEnd(40)} → ${r.destination || r.door || '(pod)'}`,
    );
  }
  console.log('');
}

async function main() {
  if (process.argv.includes('--list')) return listLinks();

  const label = arg('label');
  const destination = arg('destination');
  if (!label || !destination) {
    console.error('Uso: --label="..." --destination="https://..." [--campaign=slug] [--door=discord]');
    process.exit(1);
  }

  let url: URL;
  try {
    url = new URL(destination);
  } catch {
    console.error('destination inválida; debe ser una URL absoluta.');
    process.exit(1);
  }

  const campaign = arg('campaign');
  if (campaign) url.searchParams.set('utm_campaign', campaign);
  if (!url.searchParams.has('utm_source') && !url.searchParams.has('utm_medium')) {
    url.searchParams.set('utm_source', arg('door') || 'discord');
    url.searchParams.set('utm_medium', 'social');
  }

  // Código único con reintento corto por colisión.
  let code = newCode();
  for (let i = 0; i < 4; i++) {
    const [taken] = await db
      .select({ id: nexusOutreachLinks.id })
      .from(nexusOutreachLinks)
      .where(eq(nexusOutreachLinks.code, code))
      .limit(1);
    if (!taken) break;
    code = newCode();
  }

  await db.insert(nexusOutreachLinks).values({
    code,
    door: arg('door') || 'discord',
    targetLabel: label.slice(0, 255),
    destinationUrl: url.toString(),
  });

  console.log(`\n✓ ${label}`);
  console.log(`  ${BASE}/l/${code}`);
  console.log(`  → ${url.toString()}\n`);
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * 🚀 Pandora's — Verificador / aplicador de esquema de PRODUCCIÓN
 * apps/dashboard/scripts/migrate-production.mjs
 *
 * Reglas de este script (a diferencia del anterior):
 *   1. SOLO lee `.env.production` (o DATABASE_URL_PRODUCTION). Nunca `.env`,
 *      `.env.staging` ni `.env.local`: esos son otros entornos.
 *   2. Verifica que la base sea realmente la de Pandora's antes de tocar nada.
 *   3. Por defecto NO escribe: reporta qué falta (`--apply` para lo aditivo).
 *   4. No aplica migraciones de otros módulos (CRM, reporting, ad budgets,
 *      demo links, artifact delivery): solo el dominio de reuniones/decks.
 *
 * Uso:
 *   node scripts/migrate-production.mjs            # verificar (read-only)
 *   node scripts/migrate-production.mjs --apply    # aplicar DDL aditivo faltante
 *
 * Salida: exit 0 = al día; exit 1 = faltan cosas o error.
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

const apply = process.argv.includes('--apply');

// ── 1. URL: una sola fuente, la de producción ────────────────────────────────
const parsed = dotenv.config({ path: '.env.production' }).parsed ?? {};
const databaseUrl =
  process.env.DATABASE_URL_PRODUCTION ||
  parsed.DATABASE_URL ||
  process.env.DATABASE_URL_OVERRIDE ||
  '';

if (!databaseUrl) {
  console.error('❌ Falta DATABASE_URL de producción (.env.production o DATABASE_URL_PRODUCTION).');
  process.exit(1);
}

let host;
try {
  host = new URL(databaseUrl).host;
} catch {
  console.error('❌ DATABASE_URL no es una URL válida.');
  process.exit(1);
}

if (/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(host)) {
  console.error(`❌ ${host} es local. Este script es solo para producción.`);
  process.exit(1);
}

// ── 2. Qué debe existir para el dominio de reuniones/decks ───────────────────
const REQUIRED_COLUMNS = {
  meetings: [
    'id',
    'canonical_org_id',
    'host_collaborator_id',
    'status',
    'starts_at',
    'ends_at',
    'jitsi_room_id',
    'presentation_id',
    'deal_room_id',
    'presenter_notes',
    'ai_summary',
    'title',
    'follow_up_enabled',
  ],
  meeting_participants: [
    'id',
    'meeting_id',
    'identity_id',
    'email',
    'join_token',
    'follow_up_status',
    'reminder_24h_sent_at',
    'reminder_1h_sent_at',
    'summary_sent_at',
  ],
  nexus_deal_rooms: ['presentation_id'],
  nexus_presentations: ['slug', 'title', 'slides', 'guardrails', 'target_minutes'],
  meeting_action_items: ['source'],
};

const REQUIRED_TABLES = ['meeting_presence_sessions', 'meeting_presentation_state', 'nexus_presentations'];

// Migraciones 0095–0100: otros módulos. Se reportan, no se aplican aquí.
const LATER_FEATURE_TABLES = [
  'hermes_artifact_versions',
  'hermes_artifact_storage',
  'tenant_authorization_grants',
  'nexus_team_memberships',
  'crm_pipelines',
  'crm_stages',
  'crm_opportunities',
  'ad_spend_entries',
  'report_snapshots',
  'ad_budget_commitments',
  'demo_links',
];

const HOST_FK = 'meetings_host_collaborator_id_nexus_collaborators_id_fk';

async function tableExists(client, table) {
  const { rows } = await client.query('select to_regclass($1) is not null as exists', [`public.${table}`]);
  return Boolean(rows[0]?.exists);
}

async function columnType(client, table, column) {
  const { rows } = await client.query(
    `select data_type from information_schema.columns
     where table_schema = 'public' and table_name = $1 and column_name = $2`,
    [table, column]
  );
  return rows[0]?.data_type ?? null;
}

async function constraintExists(client, name) {
  const { rows } = await client.query(
    `select 1 from pg_constraint where conname = $1 and conrelid = 'meetings'::regclass`,
    [name]
  );
  return rows.length > 0;
}

const DDL = {
  joinToken: [
    `ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "join_token" varchar(64)`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "meeting_participants_join_token_idx"
       ON "meeting_participants" ("join_token") WHERE "join_token" IS NOT NULL`,
  ],
  presenterNotes: [`ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "presenter_notes" text`],
  email: [`ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "email" varchar(255)`],
  followUp: [
    `DO $$ BEGIN
       CREATE TYPE "public"."meeting_follow_up_status" AS ENUM('pending', 'sent', 'no_action');
     EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "follow_up_status"
       "public"."meeting_follow_up_status" DEFAULT 'pending' NOT NULL`,
  ],
  reminders: [
    `ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "reminder_24h_sent_at" timestamptz`,
    `ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "reminder_1h_sent_at" timestamptz`,
  ],
  dealRoomId: [`ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "deal_room_id" text`],
  title: [`ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "title" text`],
  followUpControls: [
    `ALTER TABLE "meetings" ADD COLUMN IF NOT EXISTS "follow_up_enabled" boolean NOT NULL DEFAULT true`,
    `ALTER TABLE "meeting_participants" ADD COLUMN IF NOT EXISTS "summary_sent_at" timestamptz`,
  ],
  actionItemSource: [
    `ALTER TABLE "meeting_action_items" ADD COLUMN IF NOT EXISTS "source" varchar(16) NOT NULL DEFAULT 'manual'`,
    `DO $$ BEGIN
       ALTER TABLE "meeting_action_items"
         ADD CONSTRAINT "meeting_action_items_source_chk" CHECK ("source" IN ('manual', 'ai'));
     EXCEPTION WHEN duplicate_object THEN null; END $$`,
  ],
  dealRoomPresentation: [
    `ALTER TABLE "nexus_deal_rooms" ADD COLUMN IF NOT EXISTS "presentation_id" varchar(64)`,
  ],
  presentationState: [
    `CREATE TABLE IF NOT EXISTS "meeting_presentation_state" (
       "meeting_id" text PRIMARY KEY,
       "presentation_id" text NOT NULL,
       "slide_index" integer NOT NULL DEFAULT 0,
       "presentation_open" boolean NOT NULL DEFAULT false,
       "updated_by" text,
       "updated_at" timestamptz NOT NULL DEFAULT now()
     )`,
    `ALTER TABLE "meeting_presentation_state" ADD COLUMN IF NOT EXISTS "presentation_open" boolean NOT NULL DEFAULT false`,
  ],
  presenceSessions: [
    `CREATE TABLE IF NOT EXISTS "meeting_presence_sessions" (
       "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
       "meeting_id" text NOT NULL REFERENCES "meetings"("id") ON DELETE CASCADE,
       "participant_id" text,
       "identity" text NOT NULL,
       "joined_at" timestamptz NOT NULL DEFAULT now(),
       "last_seen_at" timestamptz NOT NULL DEFAULT now(),
       "left_at" timestamptz,
       "source" varchar(32) NOT NULL DEFAULT 'client'
     )`,
    `CREATE INDEX IF NOT EXISTS "meeting_presence_sessions_meeting_idx"
       ON "meeting_presence_sessions" ("meeting_id", "joined_at" DESC)`,
  ],
  presentations: [
    `CREATE TABLE IF NOT EXISTS "nexus_presentations" (
       "slug" varchar(64) PRIMARY KEY,
       "title" text NOT NULL,
       "subtitle" text,
       "category" varchar(128),
       "status" varchar(32) NOT NULL DEFAULT 'DRAFT',
       "target_minutes" integer NOT NULL DEFAULT 30,
       "proposal_key" varchar(64),
       "guardrails" jsonb NOT NULL DEFAULT '[]'::jsonb,
       "slides" jsonb NOT NULL DEFAULT '[]'::jsonb,
       "updated_at" timestamptz NOT NULL DEFAULT now()
     )`,
  ],
};


async function missingRequirements(client) {
  const missing = [];
  for (const [table, columns] of Object.entries(REQUIRED_COLUMNS)) {
    if (!(await tableExists(client, table))) {
      missing.push(`${table} (tabla)`);
      continue;
    }
    for (const column of columns) {
      if (!(await columnType(client, table, column))) missing.push(`${table}.${column}`);
    }
  }
  for (const table of REQUIRED_TABLES) {
    if (!(await tableExists(client, table))) missing.push(`${table} (tabla)`);
  }
  return missing;
}

async function main() {
  console.log(`\n🔎 Destino: ${host}`);
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    // ── Guarda de identidad de la base ───────────────────────────────────────
    const canonical = ['meetings', 'nexus_collaborators', 'meeting_participants'];
    const missingCanonical = [];
    for (const table of canonical) {
      if (!(await tableExists(client, table))) missingCanonical.push(table);
    }
    if (missingCanonical.length > 0) {
      console.error(
        `❌ Esta no parece la base de Pandora's: faltan ${missingCanonical.join(', ')}.\n` +
          '   Abortado sin tocar nada. Revisa .env.production.'
      );
      process.exitCode = 1;
      return;
    }

    // ── Columnas requeridas ──────────────────────────────────────────────────
    let missing = await missingRequirements(client);
    let hostType = await columnType(client, 'meetings', 'host_collaborator_id');
    let hostIsInteger = hostType === 'integer';
    let hasHostFk = await constraintExists(client, HOST_FK);

    // ── Reporte ──────────────────────────────────────────────────────────────
    console.log('\n📋 Esquema de reuniones / decks:');
    if (missing.length === 0 && hostIsInteger && hasHostFk) {
      console.log('  ✅ Al día.');
    } else {
      for (const item of missing) console.log(`  ❌ Falta: ${item}`);
      if (!hostIsInteger) console.log(`  ❌ meetings.host_collaborator_id es "${hostType}" (debe ser integer)`);
      if (!hasHostFk) console.log(`  ❌ Falta la FK ${HOST_FK}`);
    }

    // ── Aplicar solo lo aditivo del dominio reuniones ────────────────────────
    if (apply && (missing.length > 0 || !hostIsInteger || !hasHostFk)) {
      console.log('\n🛠️  Aplicando DDL aditivo de reuniones…');
      await client.query('BEGIN');
      try {
        for (const statement of DDL.joinToken) await client.query(statement);
        for (const statement of DDL.presenterNotes) await client.query(statement);
        for (const statement of DDL.email) await client.query(statement);
        for (const statement of DDL.followUp) await client.query(statement);
        for (const statement of DDL.reminders) await client.query(statement);
        for (const statement of DDL.dealRoomId) await client.query(statement);
        for (const statement of DDL.title) await client.query(statement);
        for (const statement of DDL.followUpControls) await client.query(statement);
        for (const statement of DDL.actionItemSource) await client.query(statement);
        for (const statement of DDL.dealRoomPresentation) await client.query(statement);
        for (const statement of DDL.presentationState) await client.query(statement);
        for (const statement of DDL.presenceSessions) await client.query(statement);
        for (const statement of DDL.presentations) await client.query(statement);

        // 0093/0101: la FK solo se corrige con la tabla vacía. Si hay datos,
        // se aborta para que un humano decida (nunca convertir a ciegas).
        if (!hostIsInteger) {
          const { rows } = await client.query('select count(*)::int as n from meetings');
          if (rows[0].n > 0) {
            throw new Error(
              'meetings.host_collaborator_id no es integer y la tabla tiene filas. ' +
                'Requiere migración manual (0093/0101).'
            );
          }
          await client.query('ALTER TABLE "meetings" DROP CONSTRAINT IF EXISTS "meetings_host_collaborator_id_users_id_fk"');
          await client.query('ALTER TABLE "meetings" ALTER COLUMN "host_collaborator_id" DROP NOT NULL');
          await client.query(
            `ALTER TABLE "meetings" ALTER COLUMN "host_collaborator_id" TYPE integer USING NULLIF(btrim("host_collaborator_id"), '')::integer`
          );
        }
        if (!hasHostFk) {
          await client.query(
            `ALTER TABLE "meetings" ADD CONSTRAINT "${HOST_FK}"
               FOREIGN KEY ("host_collaborator_id") REFERENCES "nexus_collaborators"("id")`
          );
        }

        await client.query('COMMIT');

        // Re-verificar de verdad: no basta con asumir que el DDL funcionó.
        missing = await missingRequirements(client);
        hostType = await columnType(client, 'meetings', 'host_collaborator_id');
        hostIsInteger = hostType === 'integer';
        hasHostFk = await constraintExists(client, HOST_FK);
        console.log(
          missing.length === 0 && hostIsInteger && hasHostFk
            ? '  ✅ DDL aplicado y re-verificado: al día.'
            : '  ⚠️ DDL aplicado parcialmente; vuelve a correr sin --apply para ver qué falta.'
        );
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    // ── Otros módulos: informar, nunca aplicar aquí ──────────────────────────
    const pendingLater = [];
    for (const table of LATER_FEATURE_TABLES) {
      if (!(await tableExists(client, table))) pendingLater.push(table);
    }
    if (pendingLater.length > 0) {
      console.log('\nℹ️  Migraciones de otros módulos NO aplicadas (0095–0100):');
      console.log(`   ${pendingLater.join(', ')}`);
      console.log('   Este script no las toca. Si esos módulos se van a desplegar, correr su migración.');
    }

    const stillMissing = (missing.length > 0 || !hostIsInteger || !hasHostFk) && !apply;
    if (stillMissing) {
      console.log('\n👉 Ejecuta con --apply para crear lo aditivo del dominio de reuniones.');
      process.exitCode = 1;
    } else {
      console.log('\n✅ Dominio de reuniones verificado.');
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});

/**
 * Re-provisiona el trabajo de Celeste en una base rotada (snapshot viejo).
 *
 * Uso:
 *   DATABASE_URL=... bun scripts/reprovision-celeste.ts            # dry run
 *   DATABASE_URL=... bun scripts/reprovision-celeste.ts --apply    # escribe
 *
 * Recrea: cliente (Eduardo), Deal Room PDR-63C2E9 con sus 5 secciones, la reunión
 * del 20 nov (resumen, notas, participantes y 3 tareas) y deja el seguimiento en
 * etapa SENT (2 de 3 ya lo recibieron).
 *
 * Idempotente por claves naturales (email, public_id, room+code, meeting title+fecha).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

const MEETING_TITLE = "Celeste Beach Residences & Spa";
const MEETING_START = "2026-11-20T17:00:00.000Z";
const MEETING_END = "2026-11-20T17:45:00.000Z";
const MEETING_ENDED = "2026-11-20T17:47:02.000Z";
const PRESENTER_NOTES = "un funnel existe, y no hay leads buenos, con ganas de comprar.";
const PARTICIPANTS = [
  { email: "eduardo.garza.castillon@gmail.com", sentAt: null },
  { email: "marco.munoz9@gmail.com", sentAt: new Date().toISOString() },
  { email: "residenceclub@celesteresidences.com", sentAt: new Date().toISOString() },
] as const;
const TASKS = [
  ["Revisar la propuesta con su socia en Brasil y confirmar la decisión", "Eduardo · Celeste"],
  ["Agendar la segunda reunión de seguimiento y confirmar asistentes", "Pandora's"],
  ["Definir anticipo, reglas de la visita Discovery y presupuesto de pauta", "Celeste + Pandora's"],
] as const;

// Se ejecuta desde apps/dashboard → la raíz del repo queda dos niveles arriba.
const ROOT = join(process.cwd(), "..", "..");
const PROPOSAL_DOC = join(ROOT, "docs", "CELESTE-PROPUESTA-EXACTA.md");
const SUMMARY_DOC = join(ROOT, "docs", "CELESTE-RESUMEN-REUNION-2026-11-20.md");

function sectionsFromDoc(): Array<{ code: string; title: string; content: string }> {
  const raw = readFileSync(PROPOSAL_DOC, "utf8");
  const chunks = raw.split(/\n---\n/).map((chunk) => chunk.trim()).filter(Boolean);
  const titles = [
    "Resumen Ejecutivo",
    "Servicio Propuesto",
    "Fases y Entregables — 90 días",
    "Lineamientos y exclusiones",
    "Documento de Aceptación — Piloto Comercial 90 días",
  ];
  return chunks.slice(0, 5).map((content, index) => ({
    code: String(index + 1).padStart(2, "0"),
    title: titles[index] ?? `Sección ${index + 1}`,
    content,
  }));
}

async function main() {
  const apply = process.argv.includes("--apply");
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL.");
    process.exit(1);
  }

  const sections = sectionsFromDoc();
  const summary = readFileSync(SUMMARY_DOC, "utf8").trim();
  console.log(`secciones: ${sections.length} · resumen: ${summary.length} chars`);
  if (!apply) {
    console.log("DRY RUN: añade --apply.");
    return;
  }

  const db = new Client({ connectionString: url });
  await db.connect();
  try {
    await db.query("begin");

    // 1) Cliente
    const existingClient = await db.query("select id from clients where email = $1 limit 1", [
      "eduardo.garza.castillon@gmail.com",
    ]);
    let clientId: string;
    if (existingClient.rowCount) {
      clientId = existingClient.rows[0].id;
      await db.query(
        `update clients set name=$1, status='negotiating', notes=$2, metadata=$3, updated_at=now() where id=$4`,
        [
          "Celeste Beach Residences & Spa",
          "Contacto: Eduardo — Dirección Comercial / Propietario. Implementación USD 4,500 + operación USD 2,500/mes = USD 12,000 en 90 días.",
          JSON.stringify({ dealPublicId: "PDR-63C2E9", presentationId: "celeste" }),
          clientId,
        ]
      );
    } else {
      const created = await db.query(
        `insert into clients (id, email, name, status, source, notes, metadata)
         values (gen_random_uuid()::text,$1,$2,'negotiating','manual',$3,$4) returning id`,
        [
          "eduardo.garza.castillon@gmail.com",
          "Celeste Beach Residences & Spa",
          "Contacto: Eduardo — Dirección Comercial / Propietario. Implementación USD 4,500 + operación USD 2,500/mes = USD 12,000 en 90 días.",
          JSON.stringify({ dealPublicId: "PDR-63C2E9", presentationId: "celeste" }),
        ]
      );
      clientId = created.rows[0].id;
    }

    // 2) Deal Room
    const room = await db.query(
      `insert into nexus_deal_rooms
        (public_id, title, kind, counterparty, relation, company, status, summary, presentation_id,
         client_id, created_by, nda_enabled, nda_phase, nda_version, open_sign, auto_share, pod_id)
       values ('PDR-63C2E9','Celeste · Sistema Comercial','PROPOSAL','Eduardo (Dir. Comercial / Propietario)',
               'Strategic Partner','Celeste Beach Residences & Spa','PROPOSAL_SENT',$1,'celeste',$2,'marco.munoz9@gmail.com',
               true,'after_proposal','v2.2',false,true,
               (select id from nexus_deal_pods where code='village'))
       on conflict (public_id) do update set
         title=excluded.title, status='PROPOSAL_SENT', summary=excluded.summary,
         presentation_id='celeste', client_id=excluded.client_id,
         nda_enabled=true, nda_phase='after_proposal', updated_at=now()
       returning id`,
      [
        "Infraestructura comercial (implementación + operación 90 días). Implementación USD 4,500 + operación USD 2,500/mes = USD 12,000.",
        clientId,
      ]
    );
    const roomId: string = room.rows[0].id;

    // 3) Secciones
    for (const section of sections) {
      const found = await db.query(
        "select id from nexus_deal_sections where room_id=$1 and code=$2",
        [roomId, section.code]
      );
      if (found.rowCount) {
        await db.query("update nexus_deal_sections set title=$1, content=$2 where id=$3", [
          section.title,
          section.content,
          found.rows[0].id,
        ]);
      } else {
        await db.query(
          "insert into nexus_deal_sections (room_id, code, title, subtitle, content) values ($1,$2,$3,'',$4)",
          [roomId, section.code, section.title, section.content]
        );
      }
    }

    // 4) Reunión
    const existingMeeting = await db.query(
      "select id from meetings where title=$1 and starts_at=$2 limit 1",
      [MEETING_TITLE, MEETING_START]
    );
    let meetingId: string;
    if (existingMeeting.rowCount) {
      meetingId = existingMeeting.rows[0].id;
      await db.query(
        `update meetings set status='ended', ended_at=$1, presentation_id='celeste', deal_room_id=$2,
           presenter_notes=$3, ai_summary=$4, follow_up_enabled=false, follow_up_stage='SENT', updated_at=now()
         where id=$5`,
        [MEETING_ENDED, roomId, PRESENTER_NOTES, summary, meetingId]
      );
    } else {
      const created = await db.query(
        `insert into meetings
          (id, canonical_org_id, status, starts_at, ends_at, ended_at, title, presentation_id,
           deal_room_id, presenter_notes, ai_summary, follow_up_enabled, follow_up_stage,
           host_collaborator_id, jitsi_room_id, created_at, updated_at)
         values (gen_random_uuid(), 'pandoras', 'ended', $1, $2, $3, $4, 'celeste', $5, $6, $7, false, 'SENT', 140, $8, now(), now())
         returning id`,
        [
          MEETING_START,
          MEETING_END,
          MEETING_ENDED,
          MEETING_TITLE,
          roomId,
          PRESENTER_NOTES,
          summary,
          `nexus-pandoras-celeste`,
        ]
      );
      meetingId = created.rows[0].id;
    }

    // 5) Participantes
    for (const participant of PARTICIPANTS) {
      const found = await db.query(
        "select id from meeting_participants where meeting_id=$1 and identity_id=$2 limit 1",
        [meetingId, participant.email]
      );
      if (found.rowCount) {
        await db.query(
          "update meeting_participants set email=$1, summary_sent_at=$2, follow_up_status=$3 where id=$4",
          [participant.email, participant.sentAt, participant.sentAt ? "sent" : "pending", found.rows[0].id]
        );
      } else {
        await db.query(
          `insert into meeting_participants
            (id, meeting_id, identity_id, email, participant_type, role, follow_up_status, summary_sent_at, invited_at)
           values (gen_random_uuid()::text,$1,$2,$3,'anonymous_guest','guest',$4,$5,now())`,
          [meetingId, participant.email, participant.email, participant.sentAt ? "sent" : "pending", participant.sentAt]
        );
      }
    }

    // 6) Tareas
    const tasks = await db.query("select count(*)::int as n from meeting_action_items where meeting_id=$1", [
      meetingId,
    ]);
    if (Number(tasks.rows[0].n) === 0) {
      for (const [task, assignee] of TASKS) {
        await db.query(
          `insert into meeting_action_items (id, meeting_id, canonical_org_id, task, assignee_name, status, source)
           values (gen_random_uuid()::text,$1,'pandoras',$2,$3,'pending','manual')`,
          [meetingId, task, assignee]
        );
      }
    }

    // 7) Auditoría
    await db.query(
      `insert into nexus_deal_audit_events (room_id, actor, action, detail)
       values ($1,'marco.munoz9@gmail.com','Re-provisionado en base rotada','Contenido restaurado desde artefactos del repo')`,
      [roomId]
    );

    await db.query("commit");
    console.log(`OK client=${clientId} room=PDR-63C2E9 meeting=${meetingId} secciones=${sections.length}`);
  } catch (error) {
    await db.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await db.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

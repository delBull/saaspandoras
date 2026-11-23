/**
 * Aprovisiona un Deal Pod (mini-tenant de oportunidad).
 *
 * Uso:
 *   DATABASE_URL=... bun scripts/provision-deal-pod.ts --code village          # dry run
 *   DATABASE_URL=... bun scripts/provision-deal-pod.ts --code village --apply  # escribe
 *
 * Idempotente: si el pod ya existe, actualiza su configuración; si la sala ya
 * existe, no duplica secciones.
 *
 * NO toca tenants ni auth: el pod vive en `canonical_org_id = pandoras`.
 */

import { Client } from "pg";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type PodConfig = {
  code: string;
  displayName: string;
  confidentiality: "OFF_MARKET" | "CONFIDENTIAL" | "PUBLIC";
  /** null para pod de servicios (no hay comisión de mandato). */
  feeEntity: string | null;
  feePct: number | null;
  createdBy: string;
  /** Relación comercial de la sala (texto que se muestra junto al título). */
  relation: string;
  /** Landing pública del pod (null si el pod no tiene landing). */
  landing: string | null;
  room: {
    publicId: string;
    title: string;
    kind: "PROPOSAL" | "CONTRACT";
    counterparty: string;
    company: string;
    summary: string;
    ndaEnabled: boolean;
    ndaVersion: string | null;
    pofEnabled: boolean;
    /** Secciones explícitas o, si se omite, se leen del documento markdown. */
    sections?: Array<{ code: string; title: string; subtitle: string; content: string }>;
    sectionsFile?: string;
  };
};

const PODS: Record<string, PodConfig> = {
  village: {
    code: "village",
    displayName: "Proyecto Village",
    confidentiality: "OFF_MARKET",
    feeEntity: "AZTECAZ HUB S.A.P.I. de C.V.",
    feePct: 3,
    createdBy: "marco.munoz9@gmail.com",
    relation: "Off-market acquisition",
    landing: "/pitch/village",
    room: {
      publicId: "PDR-VILLAGE",
      title: "Proyecto Village — Oportunidad de adquisición",
      kind: "PROPOSAL",
      counterparty: "Proyecto Village (activo hotelero en el Pacífico mexicano)",
      company: "AZTECAZ HUB S.A.P.I. de C.V.",
      summary:
        "Oportunidad off-market para adquirir un activo hotelero en operación en el Pacífico mexicano. Información sujeta a confidencialidad y a la firma del Acuerdo correspondiente.",
      ndaEnabled: true,
      ndaVersion: "v1.0-village",
      pofEnabled: true,
      sections: [
        {
          code: "01",
          title: "La oportunidad",
          subtitle: "Activo hotelero en operación · off-market",
          content: `Activo hotelero en operación, ubicado en el Pacífico mexicano, con ingresos recurrentes y estructura operativa existente.

La operación se presenta fuera de mercado: no hay nombre comercial, ubicación exacta ni precio en canales abiertos. El acceso a la información completa requiere la firma del Acuerdo de Confidencialidad, No Uso y No Circunvención.

**Qué se comparte en esta etapa**
- Naturaleza del activo y etapa de operación.
- Tesis de inversión y lógica de la transacción.
- Proceso, calendario y criterios de elegibilidad.

**Qué se comparte después**
- Memorándum de inversión (OM), estados financieros y anexos.
- Visitas y llamadas de gestión con el equipo operativo.
- Términos y estructura de la transacción.`,
        },
        {
          code: "02",
          title: "Tesis de inversión",
          subtitle: "Por qué este activo",
          content: `- **Activo en operación:** ingresos y costos observables, sin riesgo de construcción.
- **Ubicación consolidada:** destino con demanda nacional e internacional.
- **Estructura existente:** equipo, licencias y contratos ya instalados.
- **Escala:** el tamaño permite estrategia de consolidación o reposicionamiento.
- **Flexibilidad:** la transacción admite adquisición total o participación mayoritaria.

Los supuestos se validan con la información que se entrega tras el NDA; no se presentan como hechos auditados.`,
        },
        {
          code: "03",
          title: "Proceso",
          subtitle: "Cómo se avanza",
          content: `1. **Confidencialidad.** Firma del Acuerdo (NDA) en esta sala.
2. **Elegibilidad.** Manifestación de fondos (POF) o carta del fondo.
3. **Información.** Entrega del OM y anexos por correo, con registro de envío.
4. **Interacción.** Llamada de gestión y, si hay interés, visita al activo.
5. **Oferta.** Carta de intención (LOI) con estructura y calendario.
6. **Cierre.** Debida diligencia, fideicomiso y documentación definitiva.

**Regla de contacto:** toda comunicación ocurre por conducto de AZTECAZ. No se contacta al vendedor, operador ni acreedores por fuera de este proceso.`,
        },
        {
          code: "04",
          title: "Criterios de elegibilidad",
          subtitle: "A quién está dirigida",
          content: `- Capacidad de inversión demostrable para una operación de esta escala.
- Experiencia en hospitality, real estate o activos operativos.
- Horizonte de inversión de largo plazo.
- Disposición a firmar el Acuerdo y a presentar manifestación de fondos.
- Un solo punto de contacto por institución.

No se cobra por acceder a la información. La remuneración de AZTECAZ corresponde al mandato de venta y se documenta por separado.`,
        },
      ],
    },
  },

  /**
   * Servicios de Marco (persona física) a un cliente editorial. Independiente
   * de Village: no hay activo en venta, no hay comisión, no hay NDA (el propio
   * contrato contiene confidencialidad) y no aplica POF.
   */
  editorial: {
    code: "editorial",
    displayName: "Plataforma Editorial Multi-Marca",
    confidentiality: "CONFIDENTIAL",
    feeEntity: null,
    feePct: null,
    createdBy: "marco.munoz9@gmail.com",
    relation: "Prestación de servicios tecnológicos",
    landing: null,
    room: {
      publicId: "PDR-EDITORIAL",
      title: "Contrato de servicios tecnológicos · Plataforma editorial multi-marca",
      kind: "CONTRACT",
      counterparty: "Cliente editorial (razón social por definir)",
      company: "Marco Arturo Muñoz Del Toro",
      summary:
        "Toma de control y continuidad operativa (Fase 0) e implementación inicial de la plataforma editorial multi-marca con dos sitios piloto (Fase 1). Servicios independientes, con entregables y aceptación propios.",
      ndaEnabled: false,
      // La columna es NOT NULL: se conserva la versión por defecto aunque el NDA
      // esté desactivado (no se usa mientras `nda_enabled` sea false).
      ndaVersion: "v1.0",
      pofEnabled: false,
      sectionsFile: "../../../docs/CONTRATO-CMS-EDITORIAL.md",
    },
  },
};

/** Convierte tablas markdown a líneas legibles y limpia énfasis simple. */
function transformForRoom(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  let table: string[] = [];

  const flushTable = () => {
    if (table.length === 0) return;
    for (const row of table) {
      const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length === 0) continue;
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      out.push(cells.join(" · "));
    }
    out.push("");
    table = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("|")) {
      table.push(line.trim());
      continue;
    }
    flushTable();
    // El render de la sala entiende `**negritas**`, `##` y `###`, pero no `#`.
    if (/^#\s+/.test(line.trim())) {
      out.push(`**${line.trim().replace(/^#\s+/, "")}**`);
      continue;
    }
    out.push(line.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1$2"));
  }
  flushTable();
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** Lee el contrato markdown y lo divide en secciones 01..07 + anexo. */
function sectionsFromMarkdown(filePath: string) {
  const raw = readFileSync(filePath, "utf8");
  const chunks = raw.split(/^## /m);
  const preamble = (chunks.shift() ?? "").trim();
  const sections: Array<{ code: string; title: string; subtitle: string; content: string }> = [];

  for (const chunk of chunks) {
    const [headingLine, ...rest] = chunk.split("\n");
    const heading = (headingLine ?? "").trim();
    if (!heading) continue;

    const numbered = /^(\d{2})\s*·\s*(.+)$/.exec(heading);
    const isAnnex = /^anexo/i.test(heading);
    const annexCount = sections.filter((section) => section.code.startsWith("A")).length;
    const code = numbered?.[1] ?? (isAnnex ? `A${annexCount + 1}` : String(sections.length + 1).padStart(2, "0"));
    const title = (numbered?.[2] ?? heading).trim();

    let content = rest.join("\n").trim();
    if (sections.length === 0 && preamble) content = `${preamble}\n\n${content}`;

    sections.push({ code, title, subtitle: "", content: transformForRoom(content) });
  }

  return sections;
}

function arg(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const code = arg("--code");
  if (!code) {
    console.error("Falta --code. Disponibles:", Object.keys(PODS).join(", "));
    process.exit(1);
  }
  const config = PODS[code];
  if (!config) {
    console.error(`Pod "${code}" no está definido en el script.`);
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("Falta DATABASE_URL.");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    const existing = await client.query("select id from nexus_deal_pods where code = $1", [code]);
    console.log(existing.rowCount ? `Pod existente: ${existing.rows[0].id}` : "Pod nuevo");
    console.log(
      JSON.stringify(
        {
          ...config,
          room: {
            ...config.room,
            sections: config.room.sectionsFile
              ? sectionsFromMarkdown(resolve(dirname(fileURLToPath(import.meta.url)), config.room.sectionsFile)).length
              : config.room.sections?.length ?? 0,
          },
        },
        null,
        2,
      ),
    );

    if (!apply) {
      console.log("\nDRY RUN: no se escribió nada. Añade --apply.");
      return;
    }

    await client.query("begin");

    const pod = await client.query(
      `insert into nexus_deal_pods (code, display_name, status, confidentiality, fee_entity, fee_pct, currency, canonical_org_id, created_by, config)
       values ($1,$2,'ACTIVE',$3,$4,$5,'USD','pandoras',$6,$7)
       on conflict (code) do update set
         display_name = excluded.display_name,
         confidentiality = excluded.confidentiality,
         fee_entity = excluded.fee_entity,
         fee_pct = excluded.fee_pct,
         created_by = excluded.created_by,
         updated_at = now()
       returning id`,
      [
        config.code,
        config.displayName,
        config.confidentiality,
        config.feeEntity,
        config.feePct,
        config.createdBy,
        JSON.stringify({
          landing: config.landing,
          doors: config.landing
            ? ["consolidators", "brokers", "patient_capital", "sovereign", "mx_family"]
            : [],
          kind: config.room.kind,
        }),
      ]
    );
    const podId = pod.rows[0].id as string;

    const room = await client.query(
      `insert into nexus_deal_rooms (public_id, title, kind, counterparty, relation, company, status, summary, pod_id, created_by, nda_enabled, nda_phase, nda_version, open_sign, auto_share, pof_enabled)
       values ($1,$2,$3,$4,$5,$6,'DRAFT',$7,$8,$9,$10,'before_proposal',$11,false,false,$12)
       on conflict (public_id) do update set
         title = excluded.title,
         kind = excluded.kind,
         counterparty = excluded.counterparty,
         relation = excluded.relation,
         company = excluded.company,
         summary = excluded.summary,
         pod_id = excluded.pod_id,
         nda_enabled = excluded.nda_enabled,
         nda_phase = excluded.nda_phase,
         nda_version = excluded.nda_version,
         pof_enabled = excluded.pof_enabled,
         updated_at = now()
       returning id`,
      [
        config.room.publicId,
        config.room.title,
        config.room.kind,
        config.room.counterparty,
        config.relation,
        config.room.company,
        config.room.summary,
        podId,
        config.createdBy,
        config.room.ndaEnabled,
        config.room.ndaVersion ?? "v1.0",
        config.room.pofEnabled,
      ]
    );
    const roomId = room.rows[0].id as string;

    const sections = config.room.sectionsFile
      ? sectionsFromMarkdown(resolve(dirname(fileURLToPath(import.meta.url)), config.room.sectionsFile))
      : config.room.sections ?? [];

    for (const section of sections) {
      const found = await client.query(
        "select id from nexus_deal_sections where room_id = $1 and code = $2",
        [roomId, section.code]
      );
      if (found.rowCount) {
        await client.query(
          "update nexus_deal_sections set title = $1, subtitle = $2, content = $3 where id = $4",
          [section.title, section.subtitle, section.content, found.rows[0].id]
        );
      } else {
        await client.query(
          "insert into nexus_deal_sections (room_id, code, title, subtitle, content) values ($1,$2,$3,$4,$5)",
          [roomId, section.code, section.title, section.subtitle, section.content]
        );
      }
    }

    await client.query(
      `insert into nexus_deal_audit_events (room_id, actor, action, detail)
       values ($1, $2, 'Deal Pod aprovisionado', $3)`,
      [
        roomId,
        config.createdBy,
        `Pod ${config.code} · ${config.room.ndaEnabled ? `NDA ${config.room.ndaVersion}` : "sin NDA"}${
          config.room.pofEnabled ? " · POF" : ""
        }`,
      ]
    );

    await client.query("commit");
    console.log(`\nOK  pod=${podId}  room=${config.room.publicId}`);
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

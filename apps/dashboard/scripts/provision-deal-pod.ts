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

type PodConfig = {
  code: string;
  displayName: string;
  confidentiality: "OFF_MARKET" | "CONFIDENTIAL" | "PUBLIC";
  feeEntity: string;
  feePct: number;
  createdBy: string;
  room: {
    publicId: string;
    title: string;
    kind: "PROPOSAL" | "CONTRACT";
    counterparty: string;
    company: string;
    summary: string;
    ndaVersion: string;
    sections: Array<{ code: string; title: string; subtitle: string; content: string }>;
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
    room: {
      publicId: "PDR-VILLAGE",
      title: "Proyecto Village — Oportunidad de adquisición",
      kind: "PROPOSAL",
      counterparty: "Proyecto Village (activo hotelero en el Pacífico mexicano)",
      company: "AZTECAZ HUB S.A.P.I. de C.V.",
      summary:
        "Oportunidad off-market para adquirir un activo hotelero en operación en el Pacífico mexicano. Información sujeta a confidencialidad y a la firma del Acuerdo correspondiente.",
      ndaVersion: "v1.0-village",
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
};

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
    console.log(JSON.stringify({ ...config, room: { ...config.room, sections: config.room.sections.length } }, null, 2));

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
        JSON.stringify({ landing: `/pitch/${config.code}`, doors: ["consolidators", "brokers", "patient_capital", "sovereign", "mx_family"] }),
      ]
    );
    const podId = pod.rows[0].id as string;

    const room = await client.query(
      `insert into nexus_deal_rooms (public_id, title, kind, counterparty, relation, company, status, summary, pod_id, created_by, nda_enabled, nda_phase, nda_version, open_sign, auto_share)
       values ($1,$2,$3,$4,'Off-market acquisition',$5,'DRAFT',$6,$7,$8,true,'before_proposal',$9,false,false)
       on conflict (public_id) do update set
         title = excluded.title,
         pod_id = excluded.pod_id,
         nda_enabled = excluded.nda_enabled,
         nda_phase = excluded.nda_phase,
         nda_version = excluded.nda_version,
         updated_at = now()
       returning id`,
      [
        config.room.publicId,
        config.room.title,
        config.room.kind,
        config.room.counterparty,
        config.room.company,
        config.room.summary,
        podId,
        config.createdBy,
        config.room.ndaVersion,
      ]
    );
    const roomId = room.rows[0].id as string;

    for (const section of config.room.sections) {
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
      [roomId, config.createdBy, `Pod ${config.code} · NDA ${config.room.ndaVersion}`]
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

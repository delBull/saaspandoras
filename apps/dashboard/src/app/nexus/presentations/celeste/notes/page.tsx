import React from 'react';
import { getNexusAuthContext } from '@saasfly/shared';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * /nexus/presentations/celeste/notes
 *
 * DOCUMENTO INTERNO (no se presenta). Guía de apoyo para exponer el deck
 * `/pitch/celeste`: datos confirmados, qué falta, guion por slide, objeciones,
 * defensa del precio y gate técnico.
 *
 * Protegido por sesión de Nexus (nunca se comparte con el cliente).
 */
export default async function CelesteNotesPage() {
  const headers = await import('next/headers').then((m) => m.headers());
  const auth = await getNexusAuthContext(await headers);
  if (!auth.isAuthenticated) redirect('/auth?return=/nexus/presentations/celeste/notes');

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-10 text-zinc-200">
      <header className="space-y-2 border-b border-white/10 pb-6">
        <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Documento interno · no presentar</p>
        <h1 className="text-3xl font-bold text-white">Celeste — Guía de presentación</h1>
        <p className="text-sm text-zinc-400">
          Deck: <code className="text-zinc-300">/pitch/celeste</code> · Deal Room: <code className="text-zinc-300">PDR-63C2E9</code> ·
          Reunión: Sovereign Meet (botón «Presentar» abre el deck)
        </p>
      </header>

      <Section title="1. Datos confirmados (usar tal cual)">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>104 fracciones disponibles.</li>
          <li>2 recámaras ≈ <strong>USD 138,000</strong> · 3 recámaras ≈ <strong>USD 181,000</strong>.</li>
          <li>Ticket promedio informado: <strong>USD 155,000</strong>.</li>
          <li>Mercados: CDMX, Oaxaca y compradores extranjeros.</li>
          <li>Motivación dominante: uso vacacional.</li>
          <li>Cuello de botella declarado: generación de interesados.</li>
          <li>Estancia Discovery: <strong>USD 250/noche</strong>, descontable del anticipo (condiciones por confirmar).</li>
          <li>Equipo: 1 asesora en Huatulco + 2 vendedores en CDMX.</li>
          <li>Posadas/Curamoria comercializa inventario no vendido y cobra <strong>8%</strong>.</li>
        </ul>
        <p className="mt-3 text-xs text-amber-200/80">
          NO usar: subdivisiones 1/8 ni 1/16, ticket de USD 80,000, tasas de conversión ni metas de visitas.
          No están confirmados por el cliente.
        </p>
      </Section>

      <Section title="2. Datos que faltan (preguntar en la llamada)">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Confirmación escrita de las 104 fracciones y precios por tipología.</li>
          <li>Anticipo (%) y condiciones de pago. Definición de “venta cerrada”.</li>
          <li>Reglas Discovery: noches incluidas, disponibilidad, reembolso/descuento contra anticipo.</li>
          <li>Proceso de cierre actual, quién firma y qué CRM usan (si alguno).</li>
          <li>Presupuesto de pauta aprobado y accesos a cuentas publicitarias.</li>
          <li>Activos de marca (fotos/video) y derechos de uso.</li>
          <li>Entidad legal, moneda, facturación y condiciones de cancelación.</li>
          <li>Gate WhatsApp: número, verificación Meta, plantillas, horario y escalamiento.</li>
        </ol>
      </Section>

      <Section title="3. Guion por slide (qué decir y qué no)">
        <Table
          headers={['Slide', 'Qué decir / hacer', 'Qué NO']}
          rows={[
            ['01 Portada', 'Agradecer y encuadrar: “venimos a resolver captación, no a vender tecnología”.', 'No hablar de plataforma ni módulos.'],
            ['02 Oportunidad', 'Repetir sus números y validarlos con él: “¿siguen siendo 104 y este rango?”.', 'No corregirlo en público si algún dato cambió: anotar.'],
            ['03 Diagnóstico', 'Nombrar el cuello de botella con sus palabras: interesados, no precio.', 'No culpar a Posadas/Curamoria; es contexto, no enemigo.'],
            ['04 Solución', 'Enfatizar el modelo: nosotros operamos 1-2-3, ustedes cierran.', 'No prometer ventas automáticas.'],
            ['05 Cómo', 'Recorrer el embudo con un ejemplo concreto de prospecto.', 'No entrar en detalle técnico del asistente.'],
            ['06 Plan', 'Comprometer fechas y responsables; pedir acceso a activos ya.', 'No prometer 20 visitas ni resultados.'],
            ['07 Entregables', 'Leer la lista y marcar los 2 que más le importan.', 'No ampliar alcance “de cortesía” en la llamada.'],
            ['08 Inversión', 'Decir el total primero ($7,900) y luego desglosar.', 'No ofrecer descuento sin contraprestación.'],
            ['09 Indicadores', 'Explicar CPL y visitas; aclarar que no se garantizan.', 'No comprometer metas numéricas.'],
            ['10 Siguientes', 'Cerrar con los 4 datos y la firma del documento.', 'No firmar ni enviar el documento en la reunión sin revisar.'],
          ]}
        />
      </Section>

      <Section title="4. Objeciones y respuestas">
        <Table
          headers={['Objeción', 'Respuesta']}
          rows={[
            ['“Es caro”', 'El total son $7,900 por 90 días ≈ $87/día. Una sola fracción vendida atribuible son $155k de ticket.'],
            ['“¿Garantizan ventas?”', 'No. Garantizamos proceso, operación y medición. El cierre lo hace su equipo.'],
            ['“Ya trabajamos con Posadas”', 'Perfecto: Posadas trae demanda que no controlas y cobra 8%. Nosotros construimos demanda propia y medible.'],
            ['“¿Y si no funciona?”', 'El piloto termina a los 90 días con reporte y entrega de activos. Sin penalización por no renovar.'],
            ['“Quiero pagar por resultado”', 'Posible, pero se negocia aparte: base = importe cobrado, ventana de 90 días, excluye prospectos preexistentes.'],
          ]}
        />
      </Section>

      <Section title="5. Defensa del precio (uso interno)">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Setup $2,500: estrategia, landing/catálogo, CRM, guiones y estructura de campañas.</li>
          <li>$1,800/mes × 3: operación de campañas, 8 piezas/mes, seguimiento y reporte semanal.</li>
          <li>Antes de enviar: validar horas internas por entregable y margen; si no cierra, ajustar alcance, no el precio.</li>
          <li>Pauta es pass-through: nunca absorberla en honorarios.</li>
        </ul>
      </Section>

      <Section title="6. Gate técnico (no prometer) — decirlo tal cual">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>Asistente WhatsApp automatizado: requiere número, verificación Meta y plantillas. Hasta entonces, <strong>atención manual asistida</strong>.</li>
          <li>Campañas: operación manual en Meta/Google (no hay automatización de anuncios).</li>
          <li>CRM: configuración y operación; no migramos sistemas de Celeste.</li>
          <li>Reporte semanal: elaborado por el equipo, no un dashboard en vivo para el cliente.</li>
          <li>No prometer 24/7 ni precalificación financiera.</li>
        </ul>
      </Section>

      <Section title="7. Cierre de la reunión">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Confirmar los 4 datos críticos (anticipos, Discovery, pauta, accesos).</li>
          <li>Acordar fecha de kickoff.</li>
          <li>Explicar que el documento de aceptación se firma en el Deal Room.</li>
          <li>Al terminar, registrar en Nexus: resultado, acuerdos y siguiente fecha.</li>
        </ol>
      </Section>

      <p className="border-t border-white/10 pt-4 text-[11px] text-zinc-500">
        Este documento no se comparte con el cliente ni se incluye en el deck. Es apoyo de exposición.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">{children}</div>
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: Array<Array<string>> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="text-zinc-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="py-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((cell, j) => (
                <td key={j} className={`py-2 pr-4 ${j === 0 ? 'font-medium text-zinc-200' : j === 1 ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

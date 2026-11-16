import type { Metadata } from 'next';
import { PrintButton } from './PrintButton';

export const metadata: Metadata = {
  title: "Propuesta comercial — Celeste × Pandora's",
  description:
    'Propuesta de operación gestionada para Celeste: captación medible, precalificación, CRM y reporting semanal. 12 semanas, alcance y condiciones cerradas.',
  robots: { index: false, follow: false },
  openGraph: {
    title: "Propuesta comercial — Celeste × Pandora's",
    description:
      'Captación medible, CRM y reporting semanal. Alcance, calendario e inversión en USD.',
    type: 'article',
  },
};

const scope = [
  {
    n: '01',
    title: 'Diagnóstico y estrategia',
    items: [
      'Revisión de oferta, audiencias y activos existentes',
      'Definición de propuesta de valor y mensajes por segmento',
      'Mapa de canales y presupuesto de pauta propuesto',
      'Definición de métricas y línea base (qué se mide y con qué fuente)',
    ],
  },
  {
    n: '02',
    title: 'Construcción',
    items: [
      'Landing de captación orientada a compradores de fracción',
      'Catálogo de activos con fichas y material visual',
      'Guiones de atención y criterios de calificación',
      'CRM con pipeline, responsables y próximas acciones',
      'Campañas creadas en Meta y Google (en borrador, listas para activar)',
    ],
  },
  {
    n: '03',
    title: 'Activación y operación',
    items: [
      'Activación de campañas (meta: semana 4, sujeta a accesos y aprobaciones)',
      'Atención humana asistida con bandeja compartida y guiones',
      'Precalificación de prospectos y agenda de la experiencia Discovery',
      'Coordinación con el equipo de Celeste para disponibilidad y condiciones',
    ],
  },
  {
    n: '04',
    title: 'Medición y mejora',
    items: [
      'Reporte semanal: leads, calificados, discovery, visitas y cierre',
      'Reunión de revisión semanal con decisiones concretas',
      'Ajustes de audiencia, mensaje y creativo',
      'Reporte final de la semana 12 con decisión de continuidad',
    ],
  },
] as const;

const phases = [
  { week: 'Semana 1', title: 'Diagnóstico', detail: 'Oferta, audiencias, activos, CRM y proceso' },
  { week: 'Semanas 2–3', title: 'Construcción', detail: 'Landing, catálogo, guiones y campañas en borrador' },
  { week: 'Semana 4', title: 'Activación (meta)', detail: 'Depende de accesos, materiales y aprobaciones' },
  { week: 'Semanas 5–11', title: 'Optimización', detail: 'Ajustes semanales de audiencia, mensaje y creativo' },
  { week: 'Semana 12', title: 'Cierre', detail: 'Reporte final y decisión de continuidad' },
] as const;

const included = [
  'Diagnóstico, estrategia y plan de medios',
  'Landing de captación y catálogo de activos',
  'Configuración de CRM y pipeline de ventas',
  'Asistente de atención y precalificación (sujeto a validación técnica)',
  'Diseño, lanzamiento y optimización de campañas',
  '4 piezas de contenido al mes incluidas (8 como ampliación, con material y aprobaciones a tiempo)',
  'Seguimiento de prospectos y coordinación de visitas',
  'Reporte semanal y reunión de revisión',
] as const;

const notIncluded = [
  'Pauta publicitaria: la paga Celeste directamente a Meta y Google',
  'Impuestos: el IVA se agrega si se factura en México',
  'Viajes y gastos de traslado',
  'Producción audiovisual especial (estudio, locación, equipo profesional)',
  'Servicios externos extraordinarios (desarrollo a medida, integraciones fuera de alcance)',
  'Comisión por ventas',
] as const;

const assumptions = [
  'El diagnóstico de la sección 1 parte de hipótesis preliminares que se validan con datos en la semana 1.',
  'El porcentaje atribuido a Posadas/Curamoria se tomará como dato informado y se confirmará su base de cálculo.',
  'La atención arranca de forma humana asistida. La automatización por WhatsApp se habilita solo tras validación técnica y aprobación de Meta.',
  'La semana 4 es una meta de activación, no una garantía: depende de accesos, materiales y aprobaciones.',
] as const;

export default function CelesteProposalPage() {
  return (
    <main id="proposal-print" className="mx-auto max-w-4xl px-6 py-12 print:max-w-none print:px-0 print:py-0">
      {/* ======================================================= */}
      {/* ESTILOS DE IMPRESIÓN — patrón probado en admin/report    */}
      {/* ======================================================= */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              /* Margen 0 en @page: los márgenes los pone el CONTENEDOR, así se
                 respetan aunque el diálogo de impresión esté en "Márgenes: Ninguno". */
              /* Vertical: @page es el ÚNICO mecanismo que se repite en cada página.
                 Horizontal: lo aporta el padding del contenedor (se repite solo). */
              @page { size: letter; margin: 0.55in 0; }
              html, body {
                background: #ffffff !important;
                color: #111111 !important;
                font-family: Arial, Helvetica, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body * { visibility: hidden; }
              #proposal-print, #proposal-print * { visibility: visible; }
              #proposal-print {
                position: absolute; left: 0; top: 0;
                width: 100%;
                box-sizing: border-box;
                /* Solo lateral: el vertical lo pone @page en cada página */
                padding: 0 0.65in !important;
                max-width: none !important;
                background: #ffffff !important;
              }
              #proposal-print * {
                color: #111111 !important; background: transparent !important;
                border-color: #d4d4d8 !important; box-shadow: none !important;
              }
              #proposal-print h1, #proposal-print h2, #proposal-print h3 { color: #000000 !important; }
              #proposal-print .brand-mark { background: #7c3aed !important; color: #ffffff !important; }
              #proposal-print .brand-rule { background: #7c3aed !important; }
              #proposal-print thead { background: #f4f4f5 !important; }
              #proposal-print section { break-inside: avoid; page-break-inside: avoid; }
              #proposal-print h2, #proposal-print h3 { break-after: avoid; page-break-after: avoid; }
              #proposal-print a { text-decoration: none !important; }
            }
          `,
        }}
      />

      {/* Barra de acciones — oculta al imprimir */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-xs uppercase tracking-[0.2em] text-purple-400">Documento confidencial</p>
        <div className="flex items-center gap-3">
          <a
            href="https://dash.pandoras.finance/deal/PDR-63C2E9"
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-zinc-300 hover:border-white/30 hover:text-white"
          >
            Ver acuerdo y condiciones
          </a>
          <PrintButton />
        </div>
      </div>

      <header className="mb-12 border-b border-white/10 pb-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="brand-mark flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500 text-sm font-black text-white" aria-hidden="true">P</span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-white">Pandora&apos;s</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Growth OS · Hermes · Media Co</p>
            </div>
          </div>
          <div className="text-right text-[10px] uppercase tracking-[0.15em] text-zinc-500">
            <p>Propuesta</p>
            <p className="text-zinc-400">v2.1</p>
          </div>
        </div>
        <div className="brand-rule mb-6 h-px w-full bg-purple-500/40" />
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-400">
          Propuesta comercial
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">
          Operación gestionada de captación para Celeste
        </h1>
        <p className="mt-3 text-base text-zinc-400">
          Pandora&apos;s opera el sistema y coordina la captación. Celeste conserva el cierre.
        </p>
        <dl className="mt-6 grid gap-2 text-sm text-zinc-400 sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">Preparado para</dt>
            <dd className="text-zinc-200">Celeste</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">Duración</dt>
            <dd className="text-zinc-200">12 semanas</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-zinc-500">Moneda</dt>
            <dd className="text-zinc-200">USD (dólares estadounidenses)</dd>
          </div>
        </dl>
      </header>

      <section className="mb-12">
        <h2 className="mb-3 text-xl font-bold text-white">1. El punto de partida</h2>
        <p className="text-sm leading-relaxed text-zinc-300">
          El reto identificado no es el precio: es llegar a más interesados calificados y saber qué
          canal los trae. Hoy la demanda depende en parte de terceros y no existe un proceso único
          de atención ni medición por canal.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">
          El trabajo parte de <strong className="text-white">hipótesis de diagnóstico preliminar</strong>{' '}
          que se validan con datos durante la semana 1. No se asume ninguna conclusión como hecho
          antes de ver la información real.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-white">2. Alcance</h2>
        <div className="space-y-5">
          {scope.map((block) => (
            <article key={block.n} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="mb-2 flex items-baseline gap-3 text-base font-semibold text-white">
                <span className="font-mono text-xs text-purple-400">{block.n}</span>
                {block.title}
              </h3>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                {block.items.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-white">3. Calendario</h2>
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Semana</th>
                <th className="px-4 py-3">Fase</th>
                <th className="px-4 py-3">Qué ocurre</th>
              </tr>
            </thead>
            <tbody>
              {phases.map((phase) => (
                <tr key={phase.week} className="border-t border-white/5">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">{phase.week}</td>
                  <td className="px-4 py-3 font-medium text-white">{phase.title}</td>
                  <td className="px-4 py-3 text-zinc-300">{phase.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-white">4. Inversión</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Configuración inicial</p>
            <p className="mt-2 text-2xl font-bold text-white">USD 2,500</p>
            <p className="mt-1 text-xs text-zinc-500">Pago único</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">Operación mensual</p>
            <p className="mt-2 text-2xl font-bold text-white">USD 1,800</p>
            <p className="mt-1 text-xs text-zinc-500">Por mes · 3 meses</p>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/[0.06] p-5">
            <p className="text-xs uppercase tracking-wider text-purple-300">Total del programa</p>
            <p className="mt-2 text-2xl font-bold text-white">USD 7,900</p>
            <p className="mt-1 text-xs text-purple-200/70">12 semanas</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 p-5 text-sm text-zinc-300">
          <p>
            <strong className="text-white">Publicidad aparte:</strong> la paga Celeste directamente a
            las plataformas. Escenario de trabajo: <strong className="text-white">USD 1,500–3,000 / mes</strong>{' '}
            (a validar según alcance y mercado).
          </p>
          <p className="mt-2 text-zinc-400">
            Un incentivo por ventas atribuibles, si se desea, se negocia por separado con reglas de
            atribución definidas.
          </p>
        </div>
      </section>

      <section className="mb-12 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xl font-bold text-white">5. Qué incluye</h2>
          <ul className="space-y-1.5 text-sm text-zinc-300">
            {included.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-xl font-bold text-white">6. Qué no incluye</h2>
          <ul className="space-y-1.5 text-sm text-zinc-300">
            {notIncluded.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-xl font-bold text-white">7. Supuestos y límites</h2>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-5">
          <ul className="space-y-2 text-sm text-amber-100/90">
            {assumptions.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          <strong className="text-white">Lo que no se promete:</strong> ventas garantizadas, número de
          leads o visitas garantizadas, atención 24/7, automatización de pauta ni un asistente de
          WhatsApp operativo antes de su validación técnica y aprobación de Meta.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-xl font-bold text-white">8. Cómo trabajamos</h2>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li>· <strong className="text-white">Una sola fuente de verdad:</strong> cada prospecto, etapa y resultado vive en el CRM.</li>
          <li>· <strong className="text-white">Decisiones con dato:</strong> el reporte semanal declara fuente, periodo y qué falta medir.</li>
          <li>· <strong className="text-white">Aprobaciones explícitas:</strong> ninguna pieza se publica sin aprobación de Celeste.</li>
          <li>· <strong className="text-white">Datos separados por organización:</strong> la información de Celeste no se mezcla con otros clientes.</li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-xl font-bold text-white">9. Siguientes pasos</h2>
        <ol className="space-y-2 text-sm text-zinc-300">
          <li>1. Revisión de esta propuesta y ajustes de alcance.</li>
          <li>2. Firma del acuerdo de servicio y del acuerdo de tratamiento de datos.</li>
          <li>3. Diagnóstico en la semana 1 con accesos y materiales.</li>
          <li>4. Arranque de construcción al cerrar el diagnóstico.</li>
        </ol>
        <p className="mt-4 text-xs text-zinc-500">
          La formalización (razón social, RFC, domicilio, representante y contacto ARCO de Celeste) es
          requisito para la firma. Hasta entonces, este documento es una propuesta y no un contrato.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="mb-3 text-xl font-bold text-white">10. Acuerdo</h2>
        <p className="text-sm leading-relaxed text-zinc-300">
          El acuerdo de servicio y sus anexos están en la sala de acuerdos, junto con el detalle de
          entregables y las condiciones de aceptación.
        </p>
        <a
          href="https://dash.pandoras.finance/deal/PDR-63C2E9"
          className="mt-4 inline-block rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-zinc-200 hover:border-white/30 hover:text-white"
        >
          Abrir sala de acuerdos
        </a>
      </section>

      <footer className="mt-16 border-t border-white/10 pt-6 text-xs text-zinc-500">
        <div className="brand-rule mb-4 h-px w-full bg-purple-500/40" />
        <div className="flex flex-wrap items-start justify-between gap-4 text-xs text-zinc-500">
          <div>
            <p className="font-semibold uppercase tracking-[0.2em] text-zinc-300">Pandora&apos;s</p>
            <p className="mt-1">Operación gestionada de captación</p>
            <p>Documento confidencial · Uso exclusivo de Celeste</p>
          </div>
          <div className="text-right">
            <p>Importes en USD</p>
            <p>Vigencia: 30 días desde su envío</p>
            <p className="mt-1 text-zinc-600">dash.pandoras.finance/propuesta/celeste</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

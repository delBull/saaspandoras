import type { Slide } from "@/components/presentation/PresentationEngine";
import { PresentationEngine } from "@/components/presentation/PresentationEngine";
import { Building2, Target, Workflow, CalendarRange, Wallet, LineChart, ArrowRight, ShieldCheck } from "lucide-react";

/**
 * Deck comercial — Celeste Beach Residences & Spa
 *
 * DATOS CONFIRMADOS POR EDUARDO (no inventar otros):
 *  · 104 fracciones disponibles
 *  · 2 recámaras ≈ USD 138,000 · 3 recámaras ≈ USD 181,000 · promedio USD 155,000
 *  · Mercados: CDMX, Oaxaca y compradores extranjeros
 *  · Motivación: uso vacacional
 *  · Cuello de botella: generación de interesados
 *  · Estancia Discovery USD 250/noche, descontable del anticipo (condiciones por confirmar)
 *  · Equipo: 1 asesora Huatulco + 2 vendedores CDMX
 *  · Posadas/Curamoria comercializa inventario no vendido y cobra 8%
 *
 * NO se mencionan subdivisiones 1/8 ni 1/16 (no confirmadas), ni success fee en la base,
 * ni metas de visitas garantizadas.
 */

const slides: Slide[] = [
  {
    id: "s1-portada",
    content: (
      <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-purple-500/20 bg-purple-500/10 backdrop-blur-md">
          <Building2 className="w-4 h-4 text-purple-400" />
          <span className="text-xs uppercase tracking-widest text-purple-300 font-semibold">
            Propuesta de colaboración comercial
          </span>
        </div>
        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-zinc-400">
          PANDORA&apos;S
        </h1>
        <p className="text-2xl md:text-3xl font-light text-zinc-300 max-w-2xl leading-relaxed">
          Sistema de captación y conversión comercial para
          <strong className="text-white"> Celeste Beach Residences &amp; Spa</strong>.
        </p>
        <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Eduardo · Dirección Comercial
          </span>
          <span>•</span>
          <span>Piloto de 90 días</span>
        </div>
      </div>
    ),
  },

  {
    id: "s2-oportunidad",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl mx-auto w-full">
        <SectionTag n="02" label="La oportunidad" />
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
          El producto ya existe. Falta <span className="text-purple-400">demanda calificada</span>.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
          <Metric value="104" label="fracciones disponibles" />
          <Metric value="$138k" label="2 recámaras (aprox.)" />
          <Metric value="$181k" label="3 recámaras (aprox.)" />
          <Metric value="$155k" label="ticket promedio" />
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
          <InfoBox title="Mercados" text="Ciudad de México, Oaxaca y compradores extranjeros." />
          <InfoBox title="Motivación principal" text="Uso vacacional (segunda residencia y renta)." />
          <InfoBox title="Activo comercial" text="Estancia Discovery: USD 250/noche, descontable del anticipo (condiciones a confirmar)." />
          <InfoBox title="Equipo actual" text="1 asesora en Huatulco y 2 vendedores en CDMX." />
        </div>
      </div>
    ),
  },

  {
    id: "s3-diagnostico",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl mx-auto w-full">
        <SectionTag n="03" label="Diagnóstico" />
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          El cuello de botella no es el precio: es <span className="text-purple-400">llegar a más interesados</span>.
        </h2>
        <p className="text-xl text-zinc-400 mb-8 max-w-3xl">
          Es el reto que identificó el equipo. Estas son las tres causas típicas que lo explican:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <Cause n="01" title="Dependencia de terceros" text="Parte del inventario se mueve por Posadas/Curamoria con 8% de comisión: llega demanda, pero no es tuya ni medible." />
          <Cause n="02" title="Sin un proceso único" text="Cada asesor opera a su manera: no hay un embudo común ni criterios de calificación." />
          <Cause n="03" title="Sin medición" text="No se sabe qué canal trae prospectos que visitan y compran. Sin dato, no hay optimización." />
        </div>
      </div>
    ),
  },

  {
    id: "s4-solucion",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl mx-auto w-full">
        <SectionTag n="04" label="La solución" />
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          Un solo servicio: <span className="text-purple-400">captar, atender y llevar a la visita</span>.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
          <Pillar icon={<Target className="w-4 h-4" />} title="1. Captación" text="Audiencias, campañas y landing orientadas a compradores de fracción." />
          <Pillar icon={<Workflow className="w-4 h-4" />} title="2. Atención y precalificación" text="Respuesta, recopilación de datos y agenda de la experiencia Discovery." />
          <Pillar icon={<CalendarRange className="w-4 h-4" />} title="3. Conversión a visita" text="Coordinación con el equipo de Celeste para confirmar disponibilidad y condiciones." />
          <Pillar icon={<LineChart className="w-4 h-4" />} title="4. Seguimiento y medición" text="Origen, etapa, responsable, visita y resultado en un solo lugar." />
        </div>
        <div className="w-full rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-6">
          <p className="text-sm text-emerald-200 leading-relaxed">
            <strong className="text-white">Modelo:</strong> Pandora&apos;s opera el sistema y coordina la captación.
            <strong className="text-white"> Celeste conserva el cierre de la venta</strong> y la relación con el comprador.
          </p>
        </div>
      </div>
    ),
  },

  {
    id: "s5-como",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl mx-auto w-full">
        <SectionTag n="05" label="Cómo trabajamos" />
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">El recorrido del prospecto</h2>
        <div className="flex flex-col md:flex-row items-stretch gap-3 w-full">
          <Step n="1" title="Campaña" text="Anuncio o contenido que genera interés" />
          <Arrow />
          <Step n="2" title="Atención" text="Responde, califica y pide datos" />
          <Arrow />
          <Step n="3" title="Discovery" text="Solicitud y coordinación de visita" />
          <Arrow />
          <Step n="4" title="Cierre" text="El equipo de Celeste vende" />
        </div>
        <p className="mt-8 text-sm text-zinc-500">
          Nosotros operamos 1-2-3 y medimos; ustedes ejecutan 4 y nos devuelven el resultado para optimizar.
        </p>
      </div>
    ),
  },

  {
    id: "s6-plan",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl mx-auto w-full">
        <SectionTag n="06" label="Plan de 90 días" />
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">Qué pasa y cuándo</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full">
          <Phase week="Semana 1" title="Diagnóstico" text="Oferta, audiencias, activos, CRM y proceso" />
          <Phase week="Semanas 2-3" title="Construcción" text="Landing, catálogo, guiones y campañas en borrador" />
          <Phase week="Semana 4" title="Activación" text="Campañas en vivo y atención operando" />
          <Phase week="Semanas 5-11" title="Optimización" text="Ajustes semanales de audiencia, mensaje y creativo" />
          <Phase week="Semana 12" title="Cierre" text="Reporte final y decisión de continuidad" />
        </div>
      </div>
    ),
  },

  {
    id: "s7-entregables",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl mx-auto w-full">
        <SectionTag n="07" label="Entregables" />
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">Qué incluye el servicio</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-sm">
          {[
            "Diagnóstico comercial y definición de oferta",
            "Landing page y catálogo digital comercial",
            "Configuración de CRM y pipeline de ventas",
            "Asistente de atención y precalificación (sujeto a validación técnica)",
            "Diseño, lanzamiento y optimización de campañas",
            "Hasta 8 piezas de contenido al mes (con material y aprobaciones a tiempo)",
            "Seguimiento de prospectos y coordinación de visitas",
            "Reporte semanal y reunión de revisión",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  {
    id: "s8-inversion",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl mx-auto w-full">
        <SectionTag n="08" label="Inversión" />
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">Propuesta económica</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-6">
          <PriceCard label="Configuración inicial" value="$2,500" note="Pago único" />
          <PriceCard label="Operación mensual" value="$1,800" note="Por mes · 3 meses" />
          <PriceCard label="Total 90 días" value="$7,900" note="Honorarios de servicio" accent />
        </div>
        <div className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-zinc-300 space-y-2">
          <p><Wallet className="inline w-4 h-4 text-purple-400 mr-2" /><strong className="text-white">Publicidad aparte:</strong> la paga Celeste directamente a las plataformas. Escenario de trabajo: USD 1,500–3,000 / mes (a validar).</p>
          <p><strong className="text-white">No incluye:</strong> impuestos, viajes, producción audiovisual especial, servicios externos extraordinarios ni comisión por ventas.</p>
          <p className="text-zinc-500">Un incentivo por ventas atribuibles, si se desea, se negocia por separado con reglas de atribución definidas.</p>
        </div>
      </div>
    ),
  },

  {
    id: "s9-indicadores",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl mx-auto w-full">
        <SectionTag n="09" label="Indicadores" />
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">Qué medimos cada semana</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          <Metric value="CPL" label="costo por prospecto" />
          <Metric value="%" label="prospectos calificados" />
          <Metric value="Discovery" label="solicitudes y visitas" />
          <Metric value="Ventas" label="atribuibles (si se acuerda)" />
        </div>
        <p className="mt-8 text-sm text-zinc-500 max-w-3xl">
          Reportamos con transparencia. <strong className="text-zinc-300">No garantizamos</strong> prospectos, visitas ni ventas:
          el resultado depende también de la oferta, la disponibilidad y la velocidad de cierre del equipo de Celeste.
        </p>
      </div>
    ),
  },

  {
    id: "s10-siguientes",
    content: (
      <div className="flex flex-col items-center gap-6 max-w-4xl mx-auto text-center">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs uppercase tracking-widest text-emerald-300 font-semibold">Siguientes pasos</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">Arrancamos con lo que ya sabemos</h2>
        <div className="w-full text-left grid grid-cols-1 md:grid-cols-3 gap-3">
          <Phase week="Paso 1" title="Validar 4 datos" text="Anticipo, reglas Discovery, presupuesto de pauta y accesos" />
          <Phase week="Paso 2" title="Aceptar la propuesta" text="Documento de aceptación y condiciones" />
          <Phase week="Paso 3" title="Kickoff" text="Semana 1 de diagnóstico" />
        </div>
        <p className="text-sm text-zinc-400 mt-4">
          El documento de aceptación se firma en el Deal Room de Celeste.
        </p>
      </div>
    ),
  },
];

/* ── Componentes internos del deck ─────────────────────────────────────────── */

function SectionTag({ n, label }: { n: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold tracking-wider uppercase mb-4">
      <span>{n}</span>
      <span>•</span>
      <span>{label}</span>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-left w-full">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-1 leading-snug">{label}</p>
    </div>
  );
}

function InfoBox({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">{title}</p>
      <p className="text-sm text-zinc-300 leading-relaxed">{text}</p>
    </div>
  );
}

function Cause({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <p className="text-purple-400 text-xs font-mono mb-2">{n}</p>
      <p className="text-white font-semibold mb-2">{title}</p>
      <p className="text-sm text-zinc-400 leading-relaxed">{text}</p>
    </div>
  );
}

function Pillar({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left">
      <div className="flex items-center gap-2 text-purple-300 mb-2">
        {icon}
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">{text}</p>
    </div>
  );
}

function Step({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-purple-400 text-xs font-mono mb-1">{n}</p>
      <p className="text-white text-sm font-semibold">{title}</p>
      <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{text}</p>
    </div>
  );
}

function Arrow() {
  return <div className="hidden md:flex items-center text-zinc-600"><ArrowRight className="w-4 h-4" /></div>;
}

function Phase({ week, title, text }: { week: string; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[10px] uppercase tracking-wider text-purple-300 mb-1">{week}</p>
      <p className="text-white text-sm font-semibold">{title}</p>
      <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{text}</p>
    </div>
  );
}

function PriceCard({ label, value, note, accent }: { label: string; value: string; note: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 text-left ${accent ? "border-purple-500/40 bg-purple-500/[0.08]" : "border-white/10 bg-white/[0.02]"}`}>
      <p className="text-[11px] uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ? "text-purple-200" : "text-white"}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{note}</p>
    </div>
  );
}

export default async function CelestePitchPage({
  searchParams,
}: {
  searchParams: Promise<{ meet?: string; host?: string; presentation?: string }>;
}) {
  const { meet, host, presentation } = await searchParams;
  return (
    <PresentationEngine
      slides={slides}
      meetId={meet}
      host={host === '1'}
      presentationId={presentation || 'celeste'}
    />
  );
}

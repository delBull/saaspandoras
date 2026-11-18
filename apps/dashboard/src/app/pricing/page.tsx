import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Pandora's | Productos y diagnóstico",
  description:
    'Tres productos para crecer con datos: Growth OS, Hermes y Media Co. Y un diagnóstico pagado de 100 USD que se descuenta si contratas.',
};

const products = [
  {
    name: 'Growth OS',
    tagline: 'Demanda medible, no intuición',
    description:
      'Captación, CRM y reporting sobre un solo embudo. Cada lead con origen, cada etapa con dueño y cada cifra con fuente.',
    href: 'https://nexus.pandoras.finance/growth-os',
    cta: 'Ver Growth OS',
    bullets: ['CRM con pipeline y aprobaciones', 'Reporting semanal reproducible', 'Atribución por canal'],
  },
  {
    name: 'Hermes',
    tagline: 'Operación asistida por agentes',
    description:
      'Agentes que proponen y ejecutan bajo gobierno: identidad, capability y aprobación explícita antes de cada acción sensible.',
    href: 'https://nexus.pandoras.finance/growth-os/hermes',
    cta: 'Ver Hermes',
    bullets: ['Atención y precalificación', 'Aprobaciones auditables', 'Canales conectados'],
  },
  {
    name: 'Media Co',
    tagline: 'Contenido con entrega controlada',
    description:
      'Producción de piezas con aprobación humana obligatoria y entrega por enlace firmado: nunca una URL pública permanente.',
    href: 'https://nexus.pandoras.finance/media',
    cta: 'Ver Media Co',
    bullets: ['Versiones y aprobación por otra identidad', 'Entrega con token revocable', 'Trazabilidad por pieza'],
  },
] as const;

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-16">
      <header className="mb-14 max-w-3xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-purple-400">
          Pandora&apos;s
        </p>
        <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
          Elige cómo trabajamos
        </h1>
        <p className="mt-4 text-lg text-zinc-400">
          Tres productos para operar con datos. Y si aún no lo tienes claro, empezamos por un
          diagnóstico pagado: <strong className="text-zinc-200">100 USD</strong> que se descuentan
          si decides contratar.
        </p>
      </header>

      <section aria-labelledby="diagnostico" className="mb-16">
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/[0.06] p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <h2 id="diagnostico" className="text-2xl font-bold text-white">
                Diagnóstico y plan de 30 días
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Una sesión de trabajo donde revisamos tu operación real —oferta, canales, CRM y
                proceso— y sales con un plan concreto: qué medir, qué cambiar y en qué orden. No es
                una llamada de ventas.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">100 USD</p>
              <p className="text-xs text-zinc-400">pago único</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Qué recibes
              </h3>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                <li>· Revisión de tu embudo actual y puntos de fuga</li>
                <li>· Plan de 30 días priorizado, con responsables</li>
                <li>· Qué métricas instrumentar y con qué fuente</li>
                <li>· Recomendación explícita: qué producto necesitas (o si no necesitas ninguno)</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Condiciones claras
              </h3>
              <ul className="space-y-1.5 text-sm text-zinc-300">
                <li>· Si contratas un plan, los 100 USD se descuentan del primer pago</li>
                <li>· Si no puedes asistir, devolvemos el 50%</li>
                <li>· Duración: 60 minutos, en línea</li>
                <li>· Recibes el plan por escrito, aunque no contrates</li>
              </ul>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/asesoria"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Reservar diagnóstico
            </Link>
            <span className="text-xs text-zinc-500">
              Pago seguro · agenda confirmada al recibir el pago
            </span>
          </div>
        </div>
      </section>

      <section aria-labelledby="productos" className="mb-14">
        <h2 id="productos" className="mb-6 text-2xl font-bold text-white">
          Productos
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.name}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6"
            >
              <h3 className="text-lg font-bold text-white">{product.name}</h3>
              <p className="mt-1 text-sm text-purple-300">{product.tagline}</p>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">
                {product.description}
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-zinc-400">
                {product.bullets.map((bullet) => (
                  <li key={bullet}>· {bullet}</li>
                ))}
              </ul>
              <a
                href={product.href}
                className="mt-5 block rounded-lg border border-white/15 px-4 py-2 text-center text-sm font-medium text-zinc-200 transition hover:border-white/30 hover:text-white"
              >
                {product.cta}
              </a>
            </article>
          ))}
        </div>
        <p className="mt-5 text-xs text-zinc-500">
          Los productos se cotizan según alcance y volumen. El diagnóstico es la forma de saber
          cuál te corresponde antes de comprometer un presupuesto.
        </p>
      </section>

      <footer className="rounded-2xl border border-white/10 p-6">
        <h2 className="text-lg font-bold text-white">¿No sabes cuál elegir?</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Empieza por el diagnóstico. Sales con un plan y con una recomendación honesta, incluso si
          la respuesta es que no necesitas contratarnos todavía.
        </p>
        <Link
          href="/asesoria"
          className="mt-4 inline-block rounded-xl bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400"
        >
          Reservar diagnóstico — 100 USD
        </Link>
      </footer>
    </main>
  );
}

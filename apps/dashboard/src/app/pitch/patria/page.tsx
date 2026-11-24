import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Lock, MapPin, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Off-market development land · Western Mexico",
  description: "Urban land for mixed-use development. Information under NDA.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: { title: "Confidential opportunity", description: "Information under NDA." },
};

/**
 * Landing anónima del Deal Pod "patria" (EN/ES).
 *
 * Mismas reglas que la de Village (no romper):
 *  · Sin nombre del predio, sin ubicación exacta, sin precio.
 *  · Sin enlaces a mapas, sin fotos identificables, sin metadatos.
 *  · `noindex`: no aparece en buscadores.
 *  · La información sustantiva vive detrás del NDA en el Deal Room.
 */
const COPY = {
  en: {
    eyebrow: "Urban land · Western Mexico",
    title: "A mixed-use development site, available off-market.",
    lede:
      "Land zoned for mixed use. The identity, exact location and the technical file are shared only after signing a confidentiality agreement.",
    cta: "Sign NDA and request access",
    contact: "Contact",
    note: "No price or identifying details are published. Access is individual and logged.",
    cards: [
      ["Classified land", "Zoning allows housing, retail, hospitality and offices. The classification is detailed in the OM."],
      ["Scale", "A site large enough for a mixed-use scheme. Location is disclosed under NDA."],
      ["Build potential", "Documented coefficients, subject to permits. A scenario, not an acquired right."],
      ["Controlled process", "Single point of contact, documented outreach and eligibility check before the technical file."],
    ],
    processTitle: "Process",
    steps: [
      ["01", "Confidentiality", "Sign the NDA in the deal room."],
      ["02", "Eligibility", "Proof of funds or fund letter."],
      ["03", "Information", "OM and annexes delivered by email."],
      ["04", "Interaction", "Management call, site visit and LOI."],
    ],
    footer: "No offer, solicitation or price is published. Subject to NDA and eligibility.",
    langHref: "/pitch/patria?lang=es",
    langLabel: "ES",
  },
  es: {
    eyebrow: "Suelo urbano · Occidente de México",
    title: "Un polígono urbano para desarrollo mixto, fuera de mercado.",
    lede:
      "Terreno con clasificación que habilita usos mixtos. La identidad, la ubicación exacta y la ficha técnica se comparten únicamente tras firmar el acuerdo de confidencialidad.",
    cta: "Firmar NDA y solicitar acceso",
    contact: "Contacto",
    note: "No se publica precio ni datos que identifiquen el predio. El acceso es individual y queda registrado.",
    cards: [
      ["Suelo clasificado", "La zona permite vivienda, comercio, hospedaje y oficinas. La clasificación se detalla en el OM."],
      ["Escala", "Superficie suficiente para un conjunto de usos mixtos. La ubicación se revela con el NDA."],
      ["Potencial de construcción", "Coeficientes documentados, sujetos a autorizaciones. Es un escenario, no un derecho adquirido."],
      ["Proceso controlado", "Un solo punto de contacto, seguimiento documentado y verificación de elegibilidad antes de la ficha técnica."],
    ],
    processTitle: "Proceso",
    steps: [
      ["01", "Confidencialidad", "Firma del NDA en la sala."],
      ["02", "Elegibilidad", "Manifestación de fondos o carta del fondo."],
      ["03", "Información", "Entrega del OM y anexos por correo."],
      ["04", "Interacción", "Llamada de gestión, visita al predio y carta de intención."],
    ],
    footer: "No se publica oferta, solicitud ni precio. Sujeto a NDA y elegibilidad.",
    langHref: "/pitch/patria?lang=en",
    langLabel: "EN",
  },
} as const;

export default async function PatriaLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; src?: string; utm_source?: string; utm_campaign?: string }>;
}) {
  const { lang, src, utm_source: utmSource, utm_campaign: utmCampaign } = await searchParams;
  const t = lang === "es" ? COPY.es : COPY.en;

  // Atribución: la semilla del radar (`/l/<code>` → `?src=`) viaja hasta la sala
  // para poder decir de dónde vino cada solicitud de acceso.
  const params = new URLSearchParams();
  if (typeof src === "string" && src.trim()) params.set("src", src.trim().slice(0, 64));
  if (typeof utmSource === "string" && utmSource.trim()) params.set("utm_source", utmSource.trim().slice(0, 64));
  if (typeof utmCampaign === "string" && utmCampaign.trim()) params.set("utm_campaign", utmCampaign.trim().slice(0, 64));
  const dealHref = params.size > 0 ? `/deal/PDR-PATRIA?${params.toString()}` : "/deal/PDR-PATRIA";

  return (
    <main className="h-full overflow-y-auto overscroll-contain bg-[#07070B] text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-sm font-black text-black">
              A
            </span>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-400">AZTECAZ</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">
                {t.eyebrow}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={t.langHref}
              className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white"
            >
              {t.langLabel}
            </Link>
            <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-300 sm:block">
              Off-market
            </span>
          </div>
        </header>

        <section className="mt-16 max-w-3xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-emerald-400">
            {t.eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">{t.lede}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={dealHref}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
            >
              <Lock className="h-4 w-4" />
              {t.cta}
            </Link>
            <a
              href="mailto:aztecaz@pandoras.finance?subject=Proyecto%20Patria%20%E2%80%94%20Acceso"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
              {t.contact}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-3 text-[11px] text-zinc-600">{t.note}</p>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          {t.cards.map(([title, text], index) => {
            const Icon = [Building2, MapPin, ShieldCheck, Lock][index] ?? Lock;
            return (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <Icon className="h-5 w-5 text-emerald-400" />
                <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{text}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-16">
          <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-500">
            {t.processTitle}
          </h2>
          <ol className="mt-5 grid gap-3 md:grid-cols-4">
            {t.steps.map(([n, title, text]) => (
              <li key={n} className="rounded-xl border border-white/10 p-4">
                <p className="font-mono text-[10px] text-emerald-400">{n}</p>
                <p className="mt-2 text-[13px] font-semibold text-white">{title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-20 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">
              AZTECAZ HUB S.A.P.I. de C.V. · Confidential
            </p>
            <p className="text-[10px] text-zinc-700">{t.footer}</p>
          </div>
        </footer>
      </div>
    </main>
  );
}

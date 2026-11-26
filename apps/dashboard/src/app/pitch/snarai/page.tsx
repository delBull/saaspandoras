import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, FileText, Lock, MapPin, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "S'Narai Riviera Nayarit — Participación patrimonial",
  description:
    "Proyecto residencial boutique en Bucerías, Nayarit. Título de Propiedad, estancias anuales y participación en la operación de renta vacacional.",
};

/**
 * Landing del Deal Pod "snarai".
 *
 * A diferencia de Village/Patria (off-market), S'Narai es un proyecto público:
 * aquí se explica el modelo y se ofrecen dos puertas:
 *
 *   · documentación institucional → `/deal/PDR-SNARAI` (NDA)
 *   · conversación con el equipo → `/join/snarai`
 *
 * La atribución (`?src=`) viaja a ambas para saber de qué publicación vino.
 */
const COPY = {
  es: {
    eyebrow: "Bucerías · Riviera Nayarit",
    title: "Un Título de Propiedad en el Pacífico mexicano.",
    lede:
      "S'Narai es un residencial boutique a pasos del mar. El acceso no es la compra de una unidad: es un Título de Propiedad con estancias anuales, participación en las utilidades de la renta vacacional y exposición al valor del inmueble.",
    ctaDeal: "Solicitar acceso a la documentación",
    ctaTalk: "Hablar con el equipo",
    note: "La documentación sustantiva se comparte tras firmar el acuerdo de confidencialidad.",
    cards: [
      ["El activo", "Torre residencial boutique con amenidades, rooftop y locales en planta baja."],
      ["El modelo", "Título de Propiedad: derecho de uso, participación en la operación y valor del inmueble."],
      ["Los niveles", "Explorador, Residente, Embajador y Riviera Owner. Cada uno define estancias y participación."],
      ["La operación", "La renta vacacional corre por cuenta del equipo, no del titular."],
    ],
    processTitle: "Proceso",
    steps: [
      ["01", "Conversación", "Escríbenos y entendemos qué buscas."],
      ["02", "Confidencialidad", "Firma del acuerdo en la sala."],
      ["03", "Documentación", "Planos, renders y estructura, según tu perfil."],
      ["04", "Sesión", "Revisión con el equipo y siguientes pasos."],
    ],
    footer: "Información informativa. No constituye oferta pública de valores.",
    langHref: "/pitch/snarai?lang=en",
    langLabel: "EN",
  },
  en: {
    eyebrow: "Bucerías · Riviera Nayarit",
    title: "A Property Title on Mexico's Pacific coast.",
    lede:
      "S'Narai is a boutique residential project steps from the ocean. Access is not the purchase of a unit: it is a Property Title with annual stays, a share of the vacation-rental operation and exposure to the asset's value.",
    ctaDeal: "Request access to documentation",
    ctaTalk: "Talk to the team",
    note: "Substantive documentation is shared after signing the confidentiality agreement.",
    cards: [
      ["The asset", "Boutique residential tower with amenities, rooftop and ground-floor retail."],
      ["The model", "Property Title: usage rights, participation in operations and asset value."],
      ["The tiers", "Explorer, Resident, Ambassador and Riviera Owner. Each defines stays and participation."],
      ["The operation", "Vacation rental is run by the team, not the holder."],
    ],
    processTitle: "Process",
    steps: [
      ["01", "Conversation", "Write to us and we learn what you are looking for."],
      ["02", "Confidentiality", "Agreement signed in the room."],
      ["03", "Documentation", "Plans, renders and structure, per your profile."],
      ["04", "Session", "Review with the team and next steps."],
    ],
    footer: "Informational only. Not a public offering of securities.",
    langHref: "/pitch/snarai?lang=es",
    langLabel: "ES",
  },
} as const;

export default async function SnaraiLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; src?: string; utm_source?: string; utm_campaign?: string }>;
}) {
  const { lang, src, utm_source: utmSource, utm_campaign: utmCampaign } = await searchParams;
  const t = lang === "en" ? COPY.en : COPY.es;

  // Atribución: la publicación (`/l/<code>` → `?src=`) viaja a la sala y a la captura.
  const params = new URLSearchParams();
  if (typeof src === "string" && src.trim()) params.set("src", src.trim().slice(0, 64));
  if (typeof utmSource === "string" && utmSource.trim()) params.set("utm_source", utmSource.trim().slice(0, 64));
  if (typeof utmCampaign === "string" && utmCampaign.trim()) params.set("utm_campaign", utmCampaign.trim().slice(0, 64));
  const query = params.toString();
  const dealHref = query ? `/deal/PDR-SNARAI?${query}` : "/deal/PDR-SNARAI";
  const joinHref = query ? `/join/snarai?${query}` : "/join/snarai";

  return (
    <main className="h-full overflow-y-auto overscroll-contain bg-[#0A151F] text-[#F5F2EA]">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C99960]/60 text-sm font-black text-[#C99960]">
              N
            </span>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#C99960]">S'NARAI</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#8FA3B5]">{t.eyebrow}</p>
            </div>
          </div>
          <Link
            href={t.langHref}
            className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8FA3B5] hover:text-white"
          >
            {t.langLabel}
          </Link>
        </header>

        <section className="mt-16 max-w-3xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-[#C99960]">{t.eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-6xl">{t.title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#B9C6D2]">{t.lede}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={dealHref}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C99960] px-5 py-3 text-sm font-semibold text-[#0A151F] transition-colors hover:bg-[#D8AC78]"
            >
              <Lock className="h-4 w-4" />
              {t.ctaDeal}
            </Link>
            <Link
              href={joinHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-200 transition-colors hover:border-white/30 hover:text-white"
            >
              {t.ctaTalk}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-[#7E8FA0]">{t.note}</p>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          {t.cards.map(([title, text], index) => {
            const Icon = [Building2, MapPin, ShieldCheck, FileText][index] ?? Lock;
            return (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <Icon className="h-5 w-5 text-[#C99960]" />
                <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-[#A9B8C6]">{text}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-16">
          <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-[#8FA3B5]">{t.processTitle}</h2>
          <ol className="mt-5 grid gap-3 md:grid-cols-4">
            {t.steps.map(([n, title, text]) => (
              <li key={n} className="rounded-xl border border-white/10 p-4">
                <p className="font-mono text-[10px] text-[#C99960]">{n}</p>
                <p className="mt-2 text-[13px] font-semibold text-white">{title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#8FA3B5]">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-20 border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#7E8FA0]">
              S'NARAI · AZTECAS HUB S.A.P.I. DE C.V.
            </p>
            <p className="text-[10px] text-[#6B7C8C]">{t.footer}</p>
          </div>
        </footer>
      </div>
    </main>
  );
}

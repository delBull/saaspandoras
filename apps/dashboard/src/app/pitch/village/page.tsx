import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Lock, MapPin, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Off-market opportunity · Pacific Mexico",
  description: "Operating hospitality asset. Information under NDA.",
  robots: { index: false, follow: false, nocache: true },
  openGraph: { title: "Confidential opportunity", description: "Information under NDA." },
};

/**
 * Landing anónima del Deal Pod "village".
 *
 * REGLAS (no romper):
 *  · Sin nombre del complejo, sin ubicación exacta, sin precio.
 *  · Sin enlaces a mapas, sin fotos identificables, sin metadatos.
 *  · `noindex`: esta página no aparece en buscadores ni se comparte por slug.
 *  · La información sustantiva vive detrás del NDA en el Deal Room.
 */
export default function VillageLandingPage() {
  return (
    <main className="min-h-screen bg-[#07070B] text-white">
      <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-sm font-black text-black">
              A
            </span>
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-zinc-400">AZTECAZ</p>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-600">Confidential opportunity</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-300 sm:block">
            Off-market
          </span>
        </header>

        <section className="mt-16 max-w-3xl">
          <p className="text-[11px] font-mono uppercase tracking-[0.3em] text-emerald-400">
            Hospitality · Pacific Mexico
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            An operating resort, available off-market.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
            A hospitality asset in operation, with existing team, licenses and contracts. The
            identity, exact location and financials are shared only after signing a confidentiality
            agreement.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/deal/PDR-VILLAGE"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
            >
              <Lock className="h-4 w-4" />
              Sign NDA and request access
            </Link>
            <a
              href="mailto:marco.munoz9@gmail.com?subject=Proyecto%20Village%20%E2%80%94%20Acceso"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
            >
              Contact
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <p className="mt-3 text-[11px] text-zinc-600">
            No price or identifying details are published. Access is individual and logged.
          </p>
        </section>

        <section className="mt-16 grid gap-4 md:grid-cols-2">
          {[
            {
              icon: Building2,
              title: "Operating asset",
              text: "Revenue and costs observable. No construction risk; the property is already running.",
            },
            {
              icon: MapPin,
              title: "Consolidated destination",
              text: "A destination with national and international demand. Location disclosed under NDA.",
            },
            {
              icon: ShieldCheck,
              title: "Structure in place",
              text: "Team, licenses and operating contracts already installed; diligence can start immediately.",
            },
            {
              icon: Lock,
              title: "Controlled process",
              text: "Single point of contact, documented outreach and eligibility check before financials.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <item.icon className="h-5 w-5 text-emerald-400" />
              <h2 className="mt-4 text-sm font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-500">Process</h2>
          <ol className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              ["01", "Confidentiality", "Sign the NDA in the deal room."],
              ["02", "Eligibility", "Proof of funds or fund letter."],
              ["03", "Information", "OM and annexes delivered by email."],
              ["04", "Interaction", "Management call, site visit and LOI."],
            ].map(([n, title, text]) => (
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
            <p className="text-[10px] text-zinc-700">
              No offer, solicitation or price is published. Subject to NDA and eligibility.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

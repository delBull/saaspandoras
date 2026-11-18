import Link from "next/link";
import { ArrowRight, BookOpen, Building2, Calendar, Cpu, Presentation } from "lucide-react";
import { NEXUS_PRESENTATIONS } from "@/lib/nexus/presentations-catalog";

/**
 * Catálogo de presentaciones soberanas.
 * La lista NO se duplica aquí: es `lib/nexus/presentations-catalog.ts`, la misma
 * fuente que usan el Deal Room (deck por deal) y la Sovereign Meet (deck inyectado).
 */

const ICONS: Record<string, typeof Building2> = {
  "real-estate-growth": Building2,
  "institutional-os": Cpu,
};

const ACCENTS: Record<string, { accent: string; border: string }> = {
  "real-estate-growth": { accent: "from-purple-500/20 to-purple-900/10", border: "border-purple-500/30" },
  "institutional-os": { accent: "from-zinc-500/20 to-zinc-900/10", border: "border-white/10" },
};

export default function NexusPresentationsPage() {
  return (
    <div className="min-h-screen bg-[#07070B] text-white p-6 md:p-12 font-sans selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-widest mb-2">
              <Presentation className="w-4 h-4" />
              <span>Nexus Knowledge & Presenter Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Catálogo de Presentaciones Soberanas
            </h1>
            <p className="text-zinc-400 text-sm md:text-base mt-1 max-w-2xl">
              Cada deck se puede vincular a un Deal Room (deck del deal) y a una Sovereign Meet, donde se
              proyecta controlado por el host y con el guión del presentador a la vista.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/nexus/agenda"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 transition-colors"
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Ir a Sovereign Agenda</span>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {NEXUS_PRESENTATIONS.map((deck) => {
            const Icon = ICONS[deck.slug] ?? Presentation;
            const style = ACCENTS[deck.slug] ?? { accent: "from-white/10 to-white/5", border: "border-white/10" };
            const totalMinutes = deck.script.reduce((acc, block) => acc + block.minutes, 0);

            return (
              <div
                key={deck.slug}
                className={`flex flex-col justify-between p-8 rounded-2xl bg-gradient-to-b ${style.accent} bg-zinc-950/80 border ${style.border} backdrop-blur-md relative overflow-hidden group hover:border-purple-400/50 transition-all duration-300 shadow-xl`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-purple-300 uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20">
                      {deck.category}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {deck.status}
                    </span>
                  </div>

                  <div className="flex items-start gap-4 pt-2">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-purple-300 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white group-hover:text-purple-200 transition-colors">
                        {deck.title}
                      </h2>
                      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{deck.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {deck.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/5 text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-[11px] font-mono text-zinc-500">
                    {deck.script.length} slides con guión · {totalMinutes} min objetivo
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={`/nexus/presentations/${deck.slug}`}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-purple-300" />
                    <span>Ver guión</span>
                  </Link>
                  <Link
                    href={deck.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wider uppercase hover:bg-zinc-200 transition-all shadow-md group-hover:gap-3"
                  >
                    <span>Lanzar Presentador</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200 block mb-1">Cómo se usa en una reunión</strong>
          Vincula el deck al Deal Room (consola de deals). Al agendar, la reunión hereda ese deck.
          Dentro de la sala el host presiona <span className="text-zinc-200">Presentar deck</span>: el
          deck se inyecta para todos los participantes y el host controla el slide. El panel
          <span className="text-zinc-200"> Guión</span> muestra los puntos de conducción del slide actual.
          Al finalizar, el cierre de la reunión dispara el seguimiento por email a los invitados.
        </div>
      </div>
    </div>
  );
}

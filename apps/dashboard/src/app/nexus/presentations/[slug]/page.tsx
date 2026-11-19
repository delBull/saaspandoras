import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, ExternalLink, ShieldAlert } from "lucide-react";
import { NEXUS_PRESENTATIONS, findPresentation } from "@/lib/nexus/presentations-catalog";

export function generateStaticParams() {
  return NEXUS_PRESENTATIONS.map((presentation) => ({ slug: presentation.slug }));
}

/**
 * Guión del presentador (una sola fuente: el catálogo).
 * Se usa para preparar la sesión; dentro de la sala el mismo guión aparece por slide.
 */
export default async function PresentationScriptPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const presentation = findPresentation(slug);
  if (!presentation) notFound();

  const totalMinutes = presentation.script.reduce((acc, block) => acc + block.minutes, 0);

  return (
    <div className="min-h-screen bg-[#07070B] text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-4 pb-6 border-b border-white/[0.08]">
          <Link
            href="/nexus/presentations"
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-[11px] font-mono uppercase tracking-widest"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Catálogo
          </Link>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-purple-300">Guión del presentador</p>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2">{presentation.title}</h1>
            <p className="text-sm text-zinc-400 mt-2">{presentation.subtitle}</p>
            <p className="text-[11px] font-mono text-zinc-500 mt-3">
              {presentation.script.length} slides · {totalMinutes} min objetivo · deck: {presentation.href}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={presentation.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-xs font-semibold uppercase tracking-wider hover:bg-zinc-200"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir deck
            </Link>
            <Link
              href={`/nexus/agenda?deck=${presentation.slug}&schedule=1`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-300"
            >
              <Calendar className="w-3.5 h-3.5 text-purple-300" />
              Agendar con este deck
            </Link>
          </div>
        </header>

        <section className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] space-y-1">
          <p className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5" />
            Reglas de conducción
          </p>
          {presentation.guardrails.map((rule, index) => (
            <p key={index} className="text-xs text-zinc-300 leading-relaxed">— {rule}</p>
          ))}
        </section>

        <ol className="space-y-4">
          {presentation.script.map((block, index) => (
            <li key={block.slide} className="p-5 rounded-xl border border-white/[0.08] bg-zinc-950/60">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">
                  <span className="text-zinc-500 font-mono mr-2">{String(index + 1).padStart(2, "0")}</span>
                  {block.title}
                </h2>
                <span className="text-[10px] font-mono text-zinc-500 shrink-0">{block.minutes} min</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {block.beats.map((beat, beatIndex) => (
                  <li key={beatIndex} className="text-xs text-zinc-300 leading-relaxed flex gap-2">
                    <span className="text-purple-400">·</span>
                    <span>{beat}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] font-mono text-zinc-600">slide id: {block.slide}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

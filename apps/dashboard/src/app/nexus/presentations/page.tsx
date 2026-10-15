"use client";

import React from "react";
import Link from "next/link";
import { MonitorPlay, ArrowRight, Building2, Cpu, Calendar, Presentation } from "lucide-react";

const PRESENTATIONS = [
  {
    slug: "real-estate-growth",
    title: "Real Estate Growth Infrastructure",
    subtitle: "Infraestructura inteligente para adquisición, gestión y conversión comercial inmobiliaria.",
    category: "Hospitalidad & Copropiedad",
    tags: ["Celeste Huatulco", "Fraccional 1/8 & 1/16", "Deal Room", "Hermes 24/7"],
    href: "/pitch/real-estate-growth",
    status: "Activo / Master",
    accent: "from-purple-500/20 to-purple-900/10",
    border: "border-purple-500/30",
    icon: Building2
  },
  {
    slug: "institutional-os",
    title: "Institutional Agent OS",
    subtitle: "AI that can operate — without becoming the authority. Gobernanza y ejecución institucional.",
    category: "Plataforma & Core",
    tags: ["Hermes Cognitive", "Sovereign Vault", "Ecosistema B2B"],
    href: "/pitch/institutional-os",
    status: "Activo / Core",
    accent: "from-zinc-500/20 to-zinc-900/10",
    border: "border-white/10",
    icon: Cpu
  }
];

export default function NexusPresentationsPage() {
  return (
    <div className="min-h-screen bg-[#07070B] text-white p-6 md:p-12 font-sans selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-purple-400 text-xs font-mono uppercase tracking-widest mb-2">
              <Presentation className="w-4 h-4" />
              <span>Nexus Knowledge & Presenter Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Catálogo de Presentaciones Soberanas
            </h1>
            <p className="text-zinc-400 text-sm md:text-base mt-1 max-w-2xl">
              Proyecta decks interactivos directamente en tus reuniones virtuales de Sovereign Meet o compártelos con prospectos mediante enlaces soberanos.
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
        </div>

        {/* Presentation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PRESENTATIONS.map((deck) => {
            const Icon = deck.icon;
            return (
              <div
                key={deck.slug}
                className={`flex flex-col justify-between p-8 rounded-2xl bg-gradient-to-b ${deck.accent} bg-zinc-950/80 border ${deck.border} backdrop-blur-md relative overflow-hidden group hover:border-purple-400/50 transition-all duration-300 shadow-xl`}
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
                      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                        {deck.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
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
                </div>

                {/* Bottom Actions */}
                <div className="pt-8 mt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-500 truncate max-w-[200px]">
                    {deck.href}
                  </span>
                  <Link
                    href={deck.href}
                    target="_blank"
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

        {/* Integration Instructions */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            <strong className="text-zinc-200 block mb-1">¿Cómo usarlo en una videollamada con el cliente?</strong>
            Crea la sesión en <Link href="/nexus/agenda" className="text-purple-400 hover:underline">Sovereign Agenda</Link>. Al entrar a la sala virtual <code className="text-zinc-300 bg-black/50 px-1 py-0.5 rounded">/meet/[meetingId]</code>, presiona &ldquo;Compartir Pantalla&rdquo; seleccionando la pestaña del presentador. Al terminar la llamada, el motor procesa el audio con Gemini para extraer la minuta y tareas de seguimiento.
          </div>
        </div>

      </div>
    </div>
  );
}

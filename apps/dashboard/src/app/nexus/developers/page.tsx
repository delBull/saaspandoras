import React from "react";
import { redirect } from "next/navigation";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { Terminal, Code, BookOpen, Blocks, BrainCircuit, Database } from "lucide-react";
import { RequestDeveloperDocsButton } from "./RequestDeveloperDocsButton";

export default async function NexusDevelopersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const token = typeof resolvedSearchParams.token === 'string' ? resolvedSearchParams.token : undefined;
  
  // 1. Authenticate with Nexus Engine
  const auth = await getNexusAuthContext(null, token);

  if (!auth.isAuthenticated) {
    redirect("/portal/login?return=/nexus/developers");
  }

  // 2. Authorize capability: Only ADMIN and SUPER_ADMIN have full access
  const isAuthorized = auth.role === 'SUPER_ADMIN' || auth.role === 'ADMIN';

  if (!isAuthorized) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-700">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center justify-center mb-6">
          <Terminal className="w-8 h-8 text-zinc-400" />
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Developer Hub (Acceso Restringido)</h1>
        <p className="text-zinc-400 mb-8 text-lg">
          Este módulo está reservado para el equipo técnico e integraciones del ecosistema Pandoras.
        </p>
        <RequestDeveloperDocsButton userName={auth.name || auth.wallet || 'Usuario'} userRole={auth.role || 'VIEWER'} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
          Developer Hub
        </h1>
        <p className="text-zinc-400 text-lg">
          Recursos para desarrolladores, documentación de APIs y el estándar del Engineering Harness.
        </p>
      </div>

      {/* Blueprint: Engineering Harness Section */}
      <section className="p-6 md:p-8 rounded-2xl border border-pandoras-500/20 bg-gradient-to-br from-pandoras-500/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BrainCircuit className="w-48 h-48 text-pandoras-500" />
        </div>
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-1 rounded-lg border border-pandoras-500/30 bg-pandoras-500/10 text-pandoras-300 font-mono text-[10px] tracking-widest uppercase">Estándar Oficial</span>
            <h2 className="text-2xl font-bold text-white">Hermes Engineering Harness</h2>
          </div>
          <p className="text-zinc-300 mb-6 leading-relaxed">
            El estándar de interoperabilidad para integrar agentes locales y herramientas de equipo (Devs, Marketing, Ops) con <strong>Hermes Cognitive OS</strong>. Elimina silos operativos y unifica el ecosistema de IA bajo un mismo protocolo.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5">
              <Terminal className="w-6 h-6 text-pandoras-400 mb-3" />
              <h3 className="font-bold text-white mb-2">1. Protocolo A2A</h3>
              <p className="text-sm text-zinc-400">Todo agente local debe comunicarse usando el estándar A2A (JSON Payload) con firmas de seguridad EIP-191 y HMAC. No hay integraciones aisladas.</p>
            </div>
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5">
              <Database className="w-6 h-6 text-pandoras-400 mb-3" />
              <h3 className="font-bold text-white mb-2">2. Cognitive Hub</h3>
              <p className="text-sm text-zinc-400">Endpoint centralizado (A2A Ingress) en saaspandoras. Otorga a los agentes locales acceso inmediato a los vaults de memoria (Neon e IPFS).</p>
            </div>
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5">
              <Blocks className="w-6 h-6 text-pandoras-400 mb-3" />
              <h3 className="font-bold text-white mb-2">3. Shared Skills Sync</h3>
              <p className="text-sm text-zinc-400">Base de datos de prompts y automatizaciones. Permite que las herramientas creadas por un desarrollador se importen al instante por todo el equipo.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Hermes API",
            desc: "Documentación para integrar el AI Engine y el Knowledge Vault.",
            icon: Terminal,
            link: "#"
          },
          {
            title: "Growth OS SDK",
            desc: "Librerías para conectar frontends Web3 y gestionar claims.",
            icon: Code,
            link: "#"
          },
          {
            title: "Architecture & Specs",
            desc: "Protocolos, Smart Contracts y arquitectura de la plataforma.",
            icon: BookOpen,
            link: "#"
          }
        ].map((item, i) => (
          <a
            key={i}
            href={item.link}
            className="group relative bg-zinc-900/50 border border-white/5 rounded-2xl p-6 overflow-hidden hover:border-pandoras-500/50 transition-colors"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-pandoras-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-zinc-800/50 border border-white/5 flex items-center justify-center mb-4 text-zinc-400 group-hover:text-pandoras-400 transition-colors">
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

import React from "react";
import { redirect } from "next/navigation";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { Terminal, Code, BookOpen, Blocks, BrainCircuit, Database, ShieldCheck, CheckCircle2 } from "lucide-react";
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
          Developer Hub & A2A SDK
        </h1>
        <p className="text-zinc-400 text-lg">
          Instrucciones de integración, reglas de arquitectura y estándares del equipo técnico de Pandoras.
        </p>
      </div>

      <section className="p-6 md:p-8 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Terminal className="w-48 h-48 text-blue-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-1 rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-300 font-mono text-[10px] tracking-widest uppercase">Paso 1</span>
            <h2 className="text-2xl font-bold text-white">Instalación del SDK</h2>
          </div>
          <p className="text-zinc-300 mb-4 leading-relaxed">
            Para integrar tu aplicación con Hermes y el ecosistema Pandoras, instala el cliente oficial de A2A (Agent-to-Agent Protocol).
          </p>
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 mb-6 relative group">
            <pre><code>npm install @pandorasbox6/a2a-client</code></pre>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-3 mt-6">Configuración Mínima</h3>
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm text-emerald-300 overflow-x-auto">
<pre><code>{`import { A2AClient } from '@pandorasbox6/a2a-client';

const client = new A2AClient({
  agentId: process.env.AGENT_ID,          // Tu agentId registrado
  agentSecret: process.env.AGENT_SECRET,  // Secreto (solo para HMAC)
  privateKey: process.env.PRIVATE_KEY,    // Llave privada EVM (firma EIP-191)
  hubEndpoint: 'https://dash.pandoras.finance/api/v1/a2a/messages',
});`}</code></pre>
          </div>
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-200 text-sm">
            <ShieldCheck className="w-5 h-5 shrink-0 text-red-400" />
            <p><strong>Seguridad Crítica:</strong> Nunca expongas tu <code>AGENT_SECRET</code> o <code>PRIVATE_KEY</code> en el frontend. Toda interacción debe ser server-side.</p>
          </div>
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="p-6 md:p-8 rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Nuestra Base de Datos (NeonDB)</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Utilizamos <strong>PostgreSQL serverless a través de Neon</strong> junto con <strong>Drizzle ORM</strong>. Reglas estrictas:
          </p>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Todo cambio en BD requiere una migración DDL explícita a través de <code>drizzle-kit</code>.</li>
            <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Para componentes serverless (como Next.js API Routes en Edge/Vercel) debes usar el Endpoint Pooler de Neon.</li>
            <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> No simules infraestructura local; si IPFS o Neon fallan, usa <code>throw</code>. Fail-closed siempre.</li>
          </ul>
        </section>

        <section className="p-6 md:p-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Arquitectura y Estándares</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-4">
            Nuestro stack principal es <strong>Next.js 15 (App Router), React 19, TypeScript y TailwindCSS</strong>.
          </p>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> <strong>Sovereign Auth:</strong> No usamos sesiones tradicionales con contraseñas. Todo es Web3 Wallet, JWT Tokens o Magic Links en LocalStorage.</li>
            <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> <strong>Monorepo:</strong> Mantén el código atómico. Para features complejas, usa la metodología de Stacked PRs (L1: DB, L2: Domain, L3: API, L4: UI).</li>
            <li className="flex gap-2 items-start"><CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> <strong>Diseño:</strong> Usa los estilos base de Pandoras (UI dinámica, glassmorphism, sin clases Tailwind sueltas desordenadas).</li>
          </ul>
        </section>
      </div>
      
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
            El estándar de interoperabilidad para integrar agentes locales y herramientas de equipo (Devs, Marketing, Ops) con <strong>Hermes Cognitive OS</strong>. 
            El protocolo tiene 2 capas obligatorias manejadas por el SDK:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5">
              <Terminal className="w-6 h-6 text-pandoras-400 mb-3" />
              <h3 className="font-bold text-white mb-2">L1 — Transport Headers</h3>
              <p className="text-sm text-zinc-400">Timestamp y firma HMAC calculada con SHA256 sobre el cuerpo del mensaje en raw. Valida identidad antes de parsear JSON.</p>
            </div>
            <div className="p-5 rounded-xl bg-zinc-900/60 border border-white/5">
              <Blocks className="w-6 h-6 text-pandoras-400 mb-3" />
              <h3 className="font-bold text-white mb-2">L2 — Envelope Security</h3>
              <p className="text-sm text-zinc-400">Firma criptográfica EIP-191 incluida en el payload. Vincula la orden del agente a una Wallet soberana para dejar trazabilidad auditable on-chain.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

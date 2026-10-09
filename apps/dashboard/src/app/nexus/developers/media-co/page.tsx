import React from "react";
import { redirect } from "next/navigation";
import { getNexusAuthContext } from "@saasfly/shared";
import { Terminal, Code, BookOpen, ShieldCheck, Video, LayoutList } from "lucide-react";
import Link from "next/link";

export default async function MediaCoApiReferencePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const token = typeof resolvedSearchParams.token === 'string' ? resolvedSearchParams.token : undefined;
  
  // 1. Authenticate with Nexus Engine
  const auth = await getNexusAuthContext(null, token);

  if (!auth.isAuthenticated) {
    redirect("/portal/login?return=/nexus/developers/media-co");
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Link href="/nexus/developers" className="text-zinc-500 hover:text-zinc-300 transition-colors">
            Developer Hub
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-300">API Reference</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mt-2">
          Media Co & Forge API Reference
        </h1>
        <p className="text-zinc-400 text-lg max-w-3xl">
          Bienvenido a la documentación de integración de Hermes OS para Tenants de Media Co. Esta guía detalla cómo el agente de Forge puede aprovisionar tenants y comunicarse con la Content API mediante autenticación Server-to-Server.
        </p>
      </div>

      <section className="p-6 md:p-8 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-blue-500" />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-4">1. Autenticación</h2>
          <p className="text-zinc-300 mb-4 leading-relaxed">
            Todas las peticiones a la API deben estar autenticadas mediante un <strong>API Key</strong> válido (Sovereign Token). Este token se debe enviar en el header HTTP <code>Authorization</code>.
          </p>
          <div className="bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm text-emerald-300 overflow-x-auto mb-4">
            <pre><code>Authorization: Bearer sk_live_tu_api_key_aqui</code></pre>
          </div>
          <div className="mt-4 flex items-start gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-200 text-sm">
            <BookOpen className="w-5 h-5 shrink-0 text-amber-400" />
            <p><strong>Aviso:</strong> Cada API Key tiene permisos criptográficos acotados (ej. <code>content.asset.read</code>, <code>tenant.provision</code>). Asegúrate de que tu llave cuenta con los permisos necesarios para cada endpoint.</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Terminal className="w-6 h-6 text-pandoras-400" />
          2. Aprovisionamiento de Tenants
        </h2>
        
        <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Crear un Nuevo Tenant</h3>
              <p className="text-sm text-zinc-400 mt-1">Crea una nueva organización aislada dentro del sistema dinámicamente.</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">POST</span>
              <span className="text-zinc-300">/api/v1/integrations/tenants/provision</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Permiso Requerido</h4>
              <code className="text-xs text-pandoras-300 bg-pandoras-500/10 px-2 py-1 rounded">tenant.provision</code>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Payload (JSON)</h4>
              <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
<pre><code>{`{
  "name": "Nombre de la Organización / Creador",
  "slug": "nombre-unico-sin-espacios",
  "identity": {
    "tone": "profesional",
    "language": "es"
  }
}`}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Video className="w-6 h-6 text-pandoras-400" />
          3. Content API (Media Co)
        </h2>
        <p className="text-zinc-400">
          Esta API permite al agente leer el calendario de contenido, crear tareas de producción de assets y registrar aprobaciones criptográficas on-chain (Knowledge Vault).
        </p>

        {/* Assets Endpoint */}
        <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Obtener Assets Aprobados o Pendientes</h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-bold">GET</span>
              <span className="text-zinc-300">/api/v1/content/assets</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Permiso Requerido</h4>
              <code className="text-xs text-pandoras-300 bg-pandoras-500/10 px-2 py-1 rounded">content.asset.read</code>
            </div>
          </div>
        </div>

        {/* Create Job Endpoint */}
        <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Crear Solicitud de Producción (Job)</h3>
              <p className="text-sm text-zinc-400 mt-1">Solicita la creación de un nuevo asset (ej. renderizado de video, generación de copy).</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">POST</span>
              <span className="text-zinc-300">/api/v1/content/jobs</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Permiso Requerido</h4>
              <code className="text-xs text-pandoras-300 bg-pandoras-500/10 px-2 py-1 rounded">content.asset.create</code>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Payload (JSON)</h4>
              <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
<pre><code>{`{
  "title": "Video Pitch Q3",
  "type": "video_render",
  "parameters": {
    "duration": 60,
    "script": "Texto del guion..."
  }
}`}</code></pre>
              </div>
            </div>
          </div>
        </div>

        {/* Read Job Endpoint */}
        <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Consultar Estado de un Job</h3>
            </div>
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-bold">GET</span>
              <span className="text-zinc-300">/api/v1/content/jobs/:jobId</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Permiso Requerido</h4>
              <code className="text-xs text-pandoras-300 bg-pandoras-500/10 px-2 py-1 rounded">content.asset.read</code>
            </div>
          </div>
        </div>

        {/* Approve Asset Endpoint */}
        <div className="p-6 rounded-2xl border border-white/10 bg-zinc-900/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Aprobar un Asset Terminado</h3>
              <p className="text-sm text-zinc-400 mt-1">Emite una firma para aprobar un asset generado. Esta acción notifica al Sovereign Vault.</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">POST</span>
              <span className="text-zinc-300">/api/v1/content/assets/:assetId/approval</span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Permiso Requerido</h4>
              <code className="text-xs text-pandoras-300 bg-pandoras-500/10 px-2 py-1 rounded">content.render</code>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Payload (JSON)</h4>
              <div className="bg-black border border-white/10 rounded-xl p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
<pre><code>{`{
  "approved": true,
  "comments": "Excelente render, listo para distribución."
}`}</code></pre>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="p-6 md:p-8 rounded-2xl border border-zinc-800 bg-zinc-900/30">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">4. Webhooks y Sincronización</h2>
            <p className="text-sm text-zinc-400 max-w-2xl">
              La capacidad para recibir notificaciones (ej. <code>job.completed</code>, <code>asset.approved</code>) vía Server-to-Server callbacks (Webhooks) se encuentra en su fase beta. Puedes configurar los endpoints desde la sección <strong>Developers</strong> en el Portal Hermes. Las firmas criptográficas para validar la procedencia de los eventos se documentarán en la próxima versión.
            </p>
          </div>
          <div className="shrink-0 p-3 bg-zinc-800/50 rounded-xl border border-white/5">
            <LayoutList className="w-8 h-8 text-zinc-500" />
          </div>
        </div>
      </section>

    </div>
  );
}

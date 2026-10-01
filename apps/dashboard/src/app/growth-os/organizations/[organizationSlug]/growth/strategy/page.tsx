import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { tryResolvePortalContext } from '@/lib/portal/resolve-portal-context';
import { StrategyDomainService } from '@/lib/hermes/strategy.service';
import { GlassCard } from '@/components/ui/glass-card';
import { Compass, BookOpen, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default async function PortalStrategyPage({ params }: { params: Promise<{ organizationSlug: string }> }) {
  const { organizationSlug } = await params;
  
  // 1. Verify auth context
  const portalCtx = await tryResolvePortalContext(organizationSlug);
  if (!portalCtx) {
    notFound();
  }

  // 2. Capabilities check
  if (!portalCtx.tenant.permissions.includes('growth.strategy')) {
    redirect(`/portal/${organizationSlug}/overview?error=unauthorized`);
  }

  // 3. Fetch data via Domain Service
  const service = new StrategyDomainService(portalCtx.tenant);
  
  // Attempt to load the global strategy doc
  const docResult = await service.getGlobalPlatformKnowledge('ecosystem-architecture');

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Compass className="w-8 h-8 text-blue-400" />
            Estrategia de Crecimiento
          </h1>
          <p className="text-zinc-400 text-sm mt-2 max-w-2xl leading-relaxed">
            Arquitectura global del ecosistema, planes de monetización y documentación estratégica de {portalCtx.organization.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Navigation / TOC */}
         <div className="col-span-1 space-y-3">
           <button className="w-full flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-2xl text-sm font-bold shadow-[inset_0_0_0_1px_rgba(59,130,246,0.1)] transition-all">
             <BookOpen size={18} /> Arquitectura del Ecosistema
           </button>
           <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl text-sm font-medium transition-all opacity-70 cursor-not-allowed">
             <Compass size={18} /> Plan de Monetización (Bloqueado)
           </button>
           <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-2xl text-sm font-medium transition-all opacity-70 cursor-not-allowed">
             <AlertCircle size={18} /> Auditorías de Hermes
           </button>
         </div>

         {/* Document Viewer */}
         <div className="col-span-1 md:col-span-3">
            <div className="relative rounded-3xl border border-white/10 bg-[#09090D]/60 backdrop-blur-xl shadow-2xl overflow-hidden p-8 sm:p-10">
               {/* Ambient Glow */}
               <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
               <div className="relative z-10 prose prose-invert max-w-none prose-blue prose-headings:font-black prose-p:text-zinc-400 prose-p:leading-relaxed prose-a:text-blue-400">
                 {docResult.success && docResult.content ? (
                    <ReactMarkdown>{docResult.content}</ReactMarkdown>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                       <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                         <AlertCircle className="w-8 h-8 text-zinc-600" />
                       </div>
                       <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Documento No Disponible</h3>
                       <p className="text-zinc-500 max-w-md text-sm leading-relaxed">
                          La documentación estratégica no pudo ser encontrada o está encriptada en la bóveda soberana (K25). Verifica los permisos del tenant.
                       </p>
                    </div>
                 )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

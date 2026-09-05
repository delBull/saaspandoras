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
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-400" /> Growth Strategy
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Global ecosystem architecture and strategic documentation for {portalCtx.organization.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Navigation / TOC */}
         <div className="col-span-1 space-y-2">
           <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
             <BookOpen size={16} /> Ecosystem Architecture
           </button>
           <button className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl text-sm font-medium transition-colors opacity-50 cursor-not-allowed">
             <Compass size={16} /> Monetization Plan (Locked)
           </button>
         </div>

         {/* Document Viewer */}
         <div className="col-span-1 md:col-span-3">
            <GlassCard className="p-8 prose prose-invert max-w-none prose-emerald">
               {docResult.success && docResult.content ? (
                  <ReactMarkdown>{docResult.content}</ReactMarkdown>
               ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                     <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
                     <h3 className="text-lg font-medium text-white mb-2">Document Unavailable</h3>
                     <p className="text-zinc-400 max-w-md">
                        The strategy documentation could not be found. Please check your internal knowledge base directories.
                     </p>
                  </div>
               )}
            </GlassCard>
         </div>
      </div>
    </div>
  );
}

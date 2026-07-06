'use client';

import React from 'react';
import { MarketingDeckRenderer } from '@/components/marketing/MarketingDeckRenderer';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export function MaterialViewer({ deck, projectSlug }: { deck: any, projectSlug: string }) {
    return (
        <div className="w-full">
            <div className="fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center justify-between px-6 print:hidden">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => window.close()} 
                        className="text-zinc-400 hover:text-white transition-colors"
                        title="Cerrar pestaña"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <span className="text-white font-bold">{deck.title}</span>
                    <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] uppercase tracking-widest rounded border border-amber-500/30">
                        Pitch Deck Oficial
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-bold transition-colors"
                        onClick={() => window.print()}
                    >
                        Exportar a PDF
                    </button>
                    <a 
                        href={`https://${projectSlug}.aztecaz.xyz/portal`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded text-sm font-bold transition-colors"
                    >
                        Invertir Ahora
                    </a>
                </div>
            </div>

            {/* Main Renderer */}
            <div className="pt-16 print:pt-0">
                <MarketingDeckRenderer blocks={deck.blocks} projectSlug={projectSlug} />
            </div>
        </div>
    );
}

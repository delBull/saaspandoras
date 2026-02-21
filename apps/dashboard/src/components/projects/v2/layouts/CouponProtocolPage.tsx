'use client';

import React from 'react';
import type { ProjectData } from '@/app/()/projects/types';
import ProtocolPageShell from '../ProtocolPageShell';
import ProjectHeader from '../../ProjectHeader';
import ProjectVideoSection from '../../ProjectVideoSection';
import ProjectContentTabs from '../../ProjectContentTabs';
import ProjectDetails from '../../ProjectDetails';
import { Ticket, Flame, Zap, Clock } from 'lucide-react';

interface Props { project: ProjectData; currentSlug: string; }

export default function CouponProtocolPage({ project, currentSlug }: Props) {
    const primaryArtifact = project.artifacts?.find(a => a.isPrimary) ?? project.artifacts?.[0];
    const maxSupply = primaryArtifact?.maxSupply ?? 0;

    return (
        <ProtocolPageShell project={project} currentSlug={currentSlug}>
            {/* Coupon Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-900/30 to-orange-900/20 border border-yellow-700/40 flex items-center gap-4">
                <span className="text-3xl">🎟️</span>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                            COUPON PROTOCOL V2 · SINGLE USE
                        </span>
                        {primaryArtifact && (
                            <span className="text-xs text-gray-400 font-mono">{primaryArtifact.symbol}</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5">
                        Artefacto de un solo uso. Se quema al canjear. Ideal para eventos, descuentos únicos, o acceso puntual.
                    </p>
                </div>
                {maxSupply > 0 && (
                    <div className="text-center shrink-0 hidden sm:block">
                        <p className="text-lg font-bold text-yellow-400">{maxSupply.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">Disponibles</p>
                    </div>
                )}
            </div>

            {/* Coupon Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: Ticket, label: 'Tipo', value: 'Coupon', color: 'text-yellow-400' },
                    { icon: Flame, label: 'Al Canjear', value: 'Se Quema', color: 'text-orange-400' },
                    { icon: Zap, label: 'Usos', value: '1 Solo', color: 'text-white' },
                    { icon: Clock, label: 'Vigencia', value: 'Limitada', color: 'text-red-400' },
                ].map(stat => (
                    <div key={stat.label} className="p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/50 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                            <stat.icon className="w-3.5 h-3.5 text-gray-500" />
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</span>
                        </div>
                        <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Coupon Explainer */}
            <div className="mb-6 p-4 bg-yellow-900/10 border border-yellow-800/30 rounded-xl">
                <p className="text-xs font-semibold text-yellow-300 mb-2 flex items-center gap-2"><Flame className="w-3.5 h-3.5" /> ¿Cómo funciona el Coupon?</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Obtén tu Coupon NFT y preséntalo al canjear en el protocolo. Al momento del canje, el NFT es
                    <strong className="text-white"> destruido (burned)</strong> automáticamente — garantizando que cada código sea usado una sola vez.
                    Perfecto para tickets de evento, accesos de prueba, o descuentos únicos.
                </p>
            </div>

            <ProjectHeader project={project} onVideoClick={() => { }} />
            <ProjectVideoSection project={project} />
            <ProjectContentTabs project={project} />
            <ProjectDetails project={project} />
        </ProtocolPageShell>
    );
}

'use client';

import React from 'react';
import type { ProjectData } from '@/app/()/projects/types';
import ProtocolPageShell from '../ProtocolPageShell';
import ProjectHeader from '../../ProjectHeader';
import ProjectVideoSection from '../../ProjectVideoSection';
import ProjectContentTabs from '../../ProjectContentTabs';
import ProjectDetails from '../../ProjectDetails';
import { TrendingUp, DollarSign, Percent, Coins } from 'lucide-react';

interface Props { project: ProjectData; currentSlug: string; }

export default function YieldProtocolPage({ project, currentSlug }: Props) {
    const primaryArtifact = project.artifacts?.find(a => a.isPrimary) ?? project.artifacts?.[0];
    const priceETH = parseFloat(primaryArtifact?.price ?? '0');

    // Extract APY from w2eConfig economic schedule
    const apy1 = project.w2eConfig?.w2eConfig?.phase1APY ?? project.w2eConfig?.phase1APY;
    const displayAPY = apy1 ? `${(Number(apy1) / 100).toFixed(1)}%` : 'Variable';

    return (
        <ProtocolPageShell project={project} currentSlug={currentSlug}>
            {/* Yield Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-900/30 to-green-900/20 border border-emerald-700/40 flex items-center gap-4">
                <span className="text-3xl">💰</span>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            YIELD PROTOCOL V2 · REVENUE SHARING
                        </span>
                        {primaryArtifact && (
                            <span className="text-xs text-gray-400 font-mono">{primaryArtifact.symbol}</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5">
                        Inversión en el protocolo con participación de ingresos. Los holders de este artefacto reciben distribuciones proporcionales de las ganancias del ecosistema.
                    </p>
                </div>
                <div className="text-center shrink-0 hidden sm:block">
                    <p className="text-2xl font-bold text-emerald-400">{displayAPY}</p>
                    <p className="text-[10px] text-gray-500">APY Fase 1</p>
                </div>
            </div>

            {/* Yield Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: Percent, label: 'APY Est.', value: displayAPY, color: 'text-emerald-400' },
                    { icon: TrendingUp, label: 'Tipo', value: 'Revenue Share', color: 'text-green-400' },
                    { icon: Coins, label: 'Acceso', value: priceETH > 0 ? `${priceETH} ETH` : 'GRATIS', color: priceETH > 0 ? 'text-emerald-300' : 'text-white' },
                    { icon: DollarSign, label: 'Distribución', value: 'On-Chain', color: 'text-white' },
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

            {/* Yield Explainer */}
            <div className="mb-6 p-4 bg-emerald-900/10 border border-emerald-800/30 rounded-xl">
                <p className="text-xs font-semibold text-emerald-300 mb-2 flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> ¿Cómo funciona el Yield?</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Al obtener un artefacto Yield, te conviertes en <strong className="text-white">co-participante del protocolo</strong>.
                    Una porción de los ingresos del ecosistema (pagos, royalties, fees) se distribuye
                    <strong className="text-white"> on-chain y de forma automática</strong> a todos los holders proporcional a su tenencia.
                    Los APY son fijados al momento del deploy y son inmutables por diseño.
                </p>
            </div>

            <ProjectHeader project={project} onVideoClick={() => { }} />
            <ProjectVideoSection project={project} />
            <ProjectContentTabs project={project} />
            <ProjectDetails project={project} />
        </ProtocolPageShell>
    );
}

'use client';

import React from 'react';
import type { ProjectData } from '@/app/()/projects/types';
import ProtocolPageShell from '../ProtocolPageShell';
import ProjectHeader from '../../ProjectHeader';
import ProjectVideoSection from '../../ProjectVideoSection';
import ProjectContentTabs from '../../ProjectContentTabs';
import ProjectDetails from '../../ProjectDetails';
import { Calendar, RefreshCw, Clock, Tag } from 'lucide-react';

interface Props { project: ProjectData; currentSlug: string; }

export default function MembershipProtocolPage({ project, currentSlug }: Props) {
    const primaryArtifact = project.artifacts?.find(a => a.isPrimary) ?? project.artifacts?.[0];
    const priceETH = parseFloat(primaryArtifact?.price ?? '0');

    return (
        <ProtocolPageShell project={project} currentSlug={currentSlug}>
            {/* Membership Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-violet-900/20 border border-purple-700/40 flex items-center gap-4">
                <span className="text-3xl">🏷️</span>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            MEMBERSHIP PROTOCOL V2
                        </span>
                        {primaryArtifact && (
                            <span className="text-xs text-gray-400 font-mono">{primaryArtifact.symbol}</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5">
                        Membresía con renovación periódica. Tu acceso tiene duración limitada y debe renovarse para continuar participando.
                    </p>
                </div>
            </div>

            {/* Membership Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: Tag, label: 'Tipo', value: 'Membresía', color: 'text-purple-400' },
                    { icon: Clock, label: 'Duración', value: 'Periódica', color: 'text-white' },
                    { icon: Calendar, label: 'Renovación', value: 'Requerida', color: 'text-yellow-400' },
                    { icon: RefreshCw, label: 'Precio', value: priceETH > 0 ? `${priceETH} ETH` : 'GRATIS', color: priceETH > 0 ? 'text-purple-300' : 'text-emerald-400' },
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

            {/* Membership Explainer */}
            <div className="mb-6 p-4 bg-purple-900/10 border border-purple-800/30 rounded-xl">
                <p className="text-xs font-semibold text-purple-300 mb-2 flex items-center gap-2"><RefreshCw className="w-3.5 h-3.5" /> ¿Cómo funciona la Membresía?</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Al obtener tu artefacto de membresía, tendrás acceso al protocolo durante el período establecido.
                    Al vencer, deberás <strong className="text-white">renovar tu membresía</strong> para mantener tus beneficios.
                    Las renovaciones permiten sostener el ecosistema a largo plazo.
                </p>
            </div>

            <ProjectHeader project={project} onVideoClick={() => { /* noop */ }} />
            <ProjectVideoSection project={project} />
            <ProjectContentTabs project={project} />
            <ProjectDetails project={project} />
        </ProtocolPageShell>
    );
}

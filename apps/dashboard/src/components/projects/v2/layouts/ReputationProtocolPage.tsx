'use client';

import React from 'react';
import type { ProjectData } from '@/app/()/projects/types';
import ProtocolPageShell from '../ProtocolPageShell';
import ProjectHeader from '../../ProjectHeader';
import ProjectVideoSection from '../../ProjectVideoSection';
import ProjectContentTabs from '../../ProjectContentTabs';
import ProjectDetails from '../../ProjectDetails';
import { Award, Star, Trophy, Lock } from 'lucide-react';

interface Props { project: ProjectData; currentSlug: string; }

export default function ReputationProtocolPage({ project, currentSlug }: Props) {
    const primaryArtifact = project.artifacts?.find(a => a.isPrimary) ?? project.artifacts?.[0];

    return (
        <ProtocolPageShell project={project} currentSlug={currentSlug}>
            {/* Reputation Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-900/30 to-yellow-900/20 border border-amber-700/40 flex items-center gap-4">
                <span className="text-3xl">🏆</span>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            REPUTATION PROTOCOL V2 · ACHIEVEMENT
                        </span>
                        {primaryArtifact && (
                            <span className="text-xs text-gray-400 font-mono">{primaryArtifact.symbol}</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5">
                        Badge de logro permanente. Se gana al cumplir criterios específicos — no se compra, no se transfiere, no se pierde.
                    </p>
                </div>
            </div>

            {/* Reputation Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: Trophy, label: 'Tipo', value: 'Badge', color: 'text-amber-400' },
                    { icon: Star, label: 'Adquisición', value: 'Por Mérito', color: 'text-yellow-400' },
                    { icon: Lock, label: 'Transferible', value: 'NO (SBT)', color: 'text-red-400' },
                    { icon: Award, label: 'Quemable', value: 'NO', color: 'text-white' },
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

            {/* Reputation Explainer */}
            <div className="mb-6 p-4 bg-amber-900/10 border border-amber-800/30 rounded-xl">
                <p className="text-xs font-semibold text-amber-300 mb-2 flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> ¿Cómo se obtiene este Badge?</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Los Reputation Badges son emitidos por el protocolo al verificar que cumpliste ciertos <strong className="text-white">criterios de mérito</strong>
                    — participación, tareas completadas, tiempo activo, u otros. Una vez en tu wallet, el badge es
                    <strong className="text-white"> permanente e inajenable</strong>. Actúa como tu historial de reputación on-chain.
                </p>
            </div>

            <ProjectHeader project={project} onVideoClick={() => { /* noop */ }} />
            <ProjectVideoSection project={project} />
            <ProjectContentTabs project={project} />
            <ProjectDetails project={project} />
        </ProtocolPageShell>
    );
}

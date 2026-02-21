'use client';

import React from 'react';
import type { ProjectData } from '@/app/()/projects/types';
import ProtocolPageShell from '../ProtocolPageShell';
import ProjectHeader from '../../ProjectHeader';
import ProjectVideoSection from '../../ProjectVideoSection';
import ProjectContentTabs from '../../ProjectContentTabs';
import ProjectDetails from '../../ProjectDetails';
import { Shield, CheckCircle, Lock, Award } from 'lucide-react';

interface Props { project: ProjectData; currentSlug: string; }

export default function IdentityProtocolPage({ project, currentSlug }: Props) {
    const primaryArtifact = project.artifacts?.find(a => a.isPrimary) ?? project.artifacts?.[0];

    return (
        <ProtocolPageShell project={project} currentSlug={currentSlug}>
            {/* Identity Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-900/30 to-blue-900/20 border border-indigo-700/40 flex items-center gap-4">
                <span className="text-3xl">🪪</span>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            IDENTITY PROTOCOL V2 · SBT
                        </span>
                        {primaryArtifact && (
                            <span className="text-xs text-gray-400 font-mono">{primaryArtifact.symbol}</span>
                        )}
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5">
                        Credencial digital Soul-Bound Token. No transferible — ligada permanentemente a tu wallet como prueba de identidad verificada.
                    </p>
                </div>
            </div>

            {/* Identity Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { icon: Shield, label: 'Tipo', value: 'SBT Identity', color: 'text-indigo-400' },
                    { icon: Lock, label: 'Transferible', value: 'NO', color: 'text-red-400' },
                    { icon: CheckCircle, label: 'Verificado On-Chain', value: 'Sí', color: 'text-emerald-400' },
                    { icon: Award, label: 'Credencial', value: 'Permanente', color: 'text-white' },
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

            {/* What is a SBT? Explainer */}
            <div className="mb-6 p-4 bg-indigo-900/10 border border-indigo-800/30 rounded-xl">
                <p className="text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> ¿Qué es un Identity SBT?</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Un <strong className="text-white">Soul-Bound Token</strong> es un NFT permanentemente vinculado a tu wallet.
                    No puede venderse, transferirse ni duplicarse. Actúa como tu credencial oficial dentro del protocolo —
                    prueba irrefutable de membresía, verificación KYC, o logro.
                </p>
            </div>

            <ProjectHeader project={project} onVideoClick={() => { /* noop */ }} />
            <ProjectVideoSection project={project} />
            <ProjectContentTabs project={project} />
            <ProjectDetails project={project} />
        </ProtocolPageShell>
    );
}

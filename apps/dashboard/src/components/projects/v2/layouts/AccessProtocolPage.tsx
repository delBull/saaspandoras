'use client';

import React, { useState } from 'react';
import type { ProjectData } from '@/app/()/projects/types';
import ProtocolPageShell from '../ProtocolPageShell';
import ProjectHeader from '../../ProjectHeader';
import ProjectVideoSection from '../../ProjectVideoSection';
import ProjectContentTabs from '../../ProjectContentTabs';
import ProjectDetails from '../../ProjectDetails';
import { ExternalLink, Copy, CheckCircle, Users, Shield, Zap, Lock, ArrowRight } from 'lucide-react';
import { getContract, defineChain } from 'thirdweb';
import { useReadContract } from 'thirdweb/react';
import { client } from '@/lib/thirdweb-client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ── Access Protocol Page ─────────────────────────────────────────────────────
// Primary artifact type: 🔑 Access Pass
// CTA: "Obtener Acceso" (FREE — access card is always free in protocol)
// Color: Lime / Emerald
// Shows: holders count, supply remaining, protocol registry

interface Props { project: ProjectData; currentSlug: string; }

export default function AccessProtocolPage({ project, currentSlug }: Props) {
    const [copied, setCopied] = useState(false);

    const rawChainId = Number((project as any).chainId ?? project.chainId);
    const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;

    // Resolve contract address using same 4-field fallback chain as ProjectSidebar
    const resolvedLicenseAddress =
        project.licenseContractAddress ||
        project.w2eConfig?.licenseToken?.address ||
        (project as any).contractAddress ||
        project.utilityContractAddress ||
        undefined;

    const licenseContract = resolvedLicenseAddress ? getContract({
        client, chain: defineChain(safeChainId), address: resolvedLicenseAddress,
    }) : undefined;

    const dummyContract = getContract({ client, chain: defineChain(safeChainId), address: '0x0000000000000000000000000000000000000000' });

    const { data: maxSupplyERC721 } = useReadContract({
        contract: licenseContract || dummyContract,
        queryOptions: { enabled: !!licenseContract, retry: 0 },
        method: 'function maxSupply() view returns (uint256)',
        params: []
    });

    const { data: currentSupplyBN } = useReadContract({
        contract: licenseContract || dummyContract,
        queryOptions: { enabled: !!licenseContract, retry: 0 },
        method: 'function totalSupply() view returns (uint256)',
        params: []
    });

    const { data: decimalsBN } = useReadContract({
        contract: licenseContract || dummyContract,
        queryOptions: { enabled: !!licenseContract && project?.token_type === 'erc20', retry: 0 },
        method: 'function decimals() view returns (uint8)',
        params: []
    });

    const { data: metrics } = useSWR(project.id ? `/api/dao/metrics?projectId=${project.id}` : null, fetcher);

    // Holders count is unique wallets via DAO tracking as prioritized by user
    const memberWallets = Number(metrics?.memberWallets || metrics?.members || 0);
    const decimals = decimalsBN !== undefined ? Number(decimalsBN) : (project?.token_type === 'erc20' ? 18 : 0);
    const divisor = Math.pow(10, decimals);

    // Prioritize API member count over contract totalSupply to ensure unique wallet counting
    const currentSupply = memberWallets;
    const artifactHolders = Number(metrics?.uniqueArtifactHolders || metrics?.artifactHolders || 0);
    const maxSupplyRaw = maxSupplyERC721 ? Number(maxSupplyERC721) : (project.artifacts?.[0]?.maxSupply ?? 0);
    const maxSupply = maxSupplyRaw / divisor;
    const remaining = maxSupply > 0 ? maxSupply - currentSupply : null;

    const primaryArtifact = project.artifacts?.find(a => a.isPrimary) ?? project.artifacts?.[0];
    const registryAddress = project.registryContractAddress;

    const copyAddress = async (addr: string) => {
        await navigator.clipboard.writeText(addr);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Guard: no-artifacts fallback — prevents broken V2 layout for legacy projects
    // If this page was reached without artifacts, render a contained fallback instead
    // of a mostly-empty V2 layout that hides the access card.
    if (!project.artifacts || project.artifacts.length === 0) {
        return (
            <ProtocolPageShell project={project} currentSlug={currentSlug}>
                <div className="p-8 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 text-center">
                    <span className="text-4xl mb-4 block">🔒</span>
                    <h3 className="text-lg font-semibold text-white mb-2">Protocolo Legacy</h3>
                    <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                        Este protocolo aún no ha sido migrado a Protocol V2.
                        El acceso y los artefactos estarán disponibles tras la migración.
                    </p>
                </div>
                <ProjectHeader project={project} onVideoClick={() => { /* noop */ }} />
                <ProjectContentTabs project={project} />
                <ProjectDetails project={project} />
            </ProtocolPageShell>
        );
    }

    return (
        <ProtocolPageShell project={project} currentSlug={currentSlug}>
            {/* V2 Access Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-lime-900/30 to-emerald-900/20 border border-lime-700/40 flex items-center gap-4">
                <span className="text-3xl">🔑</span>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-300 border border-lime-500/30">
                            ACCESS PROTOCOL V2
                        </span>
                        {primaryArtifact && (
                            <span className="text-xs text-gray-400">
                                {primaryArtifact.name} · <span className="font-mono text-lime-400">{primaryArtifact.symbol}</span>
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-300 mt-0.5">
                        Artefacto de acceso libre al ecosistema del protocolo. Obtén tu pase gratuito para participar.
                    </p>
                </div>
                {/* Live Stats */}
                <div className="hidden sm:flex items-center gap-4 text-center shrink-0">
                    <div>
                        <p className="text-lg font-bold text-lime-400">{currentSupply.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">Miembros</p>
                    </div>
                </div>
            </div>

            {/* Protocol Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {[
                    { icon: Shield, label: 'Tipo', value: 'Access Pass', color: 'text-emerald-400' },
                    { icon: Zap, label: 'Precio de Acceso', value: 'GRATIS', color: 'text-white' },
                    { icon: Lock, label: 'Supply Máx', value: maxSupply > 0 ? maxSupply.toLocaleString() : '∞', color: 'text-gray-300' },
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

            {/* Additional Artifacts in ecosystem */}
            {project.artifacts && project.artifacts.length > 1 && (
                <div className="mb-6 p-4 bg-zinc-800/20 rounded-xl border border-zinc-700/50">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Ecosistema de Artefactos ({project.artifacts.length})</p>
                    <div className="flex flex-wrap gap-2">
                        {project.artifacts.map((art, i) => (
                            <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${art.isPrimary ? 'bg-lime-500/10 border-lime-500/30 text-lime-300' : 'bg-zinc-800 border-zinc-700 text-gray-300'}`}>
                                {art.type === 'Access' ? '🔑' : art.type === 'Identity' ? '🪪' : art.type === 'Membership' ? '🏷️' : art.type === 'Coupon' ? '🎟️' : art.type === 'Reputation' ? '🏆' : '💰'}
                                {art.name}
                                {art.isPrimary && <span className="text-[9px] text-lime-400">PRIMARY</span>}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Standard Components (existing, reused) */}
            <ProjectHeader project={project} onVideoClick={() => { /* noop */ }} />
            <ProjectVideoSection project={project} />
            <ProjectContentTabs project={project} />
            <ProjectDetails project={project} />
        </ProtocolPageShell>
    );
}

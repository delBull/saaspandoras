"use client";

import React, { useState, useEffect } from "react";
import { useApplicantsDataBasic, type Project } from "@/hooks/applicants/useApplicantsDataBasic";
import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract, defineChain } from "thirdweb";
import { config } from "@/config"; // Use global config
import { client } from "@/lib/thirdweb-client";
import { Loader2, FolderIcon, ArrowRightIcon, CoinsIcon, CreditCardIcon, VoteIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UserGovernanceList } from "./UserGovernanceList";

// Helper for timeout
const readContractWithTimeout = async (params: any, timeoutMs = 5000) => {
    return Promise.race([
        readContract(params),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
    ]);
};

interface ProjectWithStats extends Project {
    hasActiveProposals?: boolean;
}

export function MyProtocolsView() {
    const { approvedProjects, loading: loadingProjects } = useApplicantsDataBasic();
    const account = useActiveAccount();
    const [memberProjects, setMemberProjects] = useState<ProjectWithStats[]>([]);
    const [loadingMembership, setLoadingMembership] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkMembership = async () => {
            // If not connected or loading, wait
            if (!account || loadingProjects) {
                if (!loadingProjects && !account && isMounted) setLoadingMembership(false);
                return;
            }

            if (isMounted) setLoadingMembership(true);
            const myProjects: ProjectWithStats[] = [];
            // Use governance chain for assets/voting (Base Sepolia in testnet)
            const chain = config.governanceChain;

            console.log("🔍 Checking membership for wallet:", account.address);

            // Parallel checks
            await Promise.all(approvedProjects.map(async (project) => {
                let isMember = false;
                let hasActiveProposals = false;

                // 1. Check License Balance (Priority)
                // Use licenseContractAddress if available (new architecture), otherwise fallback to contractAddress (legacy)
                const licenseAddr = project.licenseContractAddress || project.contractAddress;

                if (licenseAddr) {
                    try {
                        const licenseContract = getContract({
                            client,
                            chain,
                            address: licenseAddr,
                        });
                        console.log(`[${project.slug}] Checking License at ${licenseAddr}`);
                        const balance = await readContractWithTimeout({
                            contract: licenseContract,
                            method: "function balanceOf(address) view returns (uint256)",
                            params: [account.address]
                        }) as bigint;
                        console.log(`[${project.slug}] License Balance:`, balance.toString());
                        if (balance > 0n) isMember = true;
                    } catch (e) {
                        console.error(`[${project.slug}] Failed to check license:`, e);
                    }
                } else {
                    console.warn(`[${project.slug}] No License Contract Address`);
                }

                // 2. Check Utility Balance (Secondary)
                const utilityAddr = project.utilityContractAddress;
                if (!isMember && utilityAddr) {
                    try {
                        const utilityContract = getContract({
                            client,
                            chain,
                            address: utilityAddr
                        });
                        console.log(`[${project.slug}] Checking Utility at ${utilityAddr}`);
                        const balance = await readContractWithTimeout({
                            contract: utilityContract,
                            method: "function balanceOf(address) view returns (uint256)",
                            params: [account.address]
                        }) as bigint;
                        console.log(`[${project.slug}] Utility Balance:`, balance.toString());
                        if (balance > 0n) isMember = true;
                    } catch (e) {
                        console.error(`[${project.slug}] Failed to check utility:`, e);
                    }
                }

                // 3. Check Active Proposals (If Member and Governor exists)
                const governorAddr = project.governorContractAddress;
                // Only check proposals if member, to save RPC calls
                if (isMember && governorAddr) {
                    try {
                        const governorContract = getContract({
                            client,
                            chain,
                            address: governorAddr
                        });

                        // Get proposal count
                        let proposalCount = 0n;
                        try {
                            proposalCount = await readContractWithTimeout({
                                contract: governorContract,
                                method: "function proposalCount() view returns (uint256)"
                            }) as bigint;
                        } catch {
                            // ignore
                        }

                        if (proposalCount > 0n) {
                            // Check the state of the last few proposals (e.g., last 3)
                            const numProposalsToCheck = Math.min(Number(proposalCount), 3);
                            for (let i = 0; i < numProposalsToCheck; i++) {
                                const proposalId = proposalCount - 1n - BigInt(i); // Get the latest proposal IDs
                                try {
                                    const proposalState = await readContractWithTimeout({
                                        contract: governorContract,
                                        method: "function state(uint256 proposalId) view returns (uint8)",
                                        params: [proposalId]
                                    });
                                    // OpenZeppelin Governor state enum: 1 is Active
                                    if (Number(proposalState) === 1) {
                                        hasActiveProposals = true;
                                        break;
                                    }
                                } catch {
                                    // ignore specific proposal error
                                }
                            }
                        }
                    } catch (e) {
                        // console.warn("Failed to check proposals");
                    }
                }

                if (isMember) {
                    myProjects.push({ ...project, hasActiveProposals });
                }
            }));

            if (isMounted) {
                setMemberProjects(myProjects);
                setLoadingMembership(false);
            }
        };

        checkMembership();

        return () => {
            isMounted = false;
        };
    }, [account, approvedProjects, loadingProjects]);


    // --- Empty State ---
    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6">
                <div className="bg-zinc-800/50 p-6 rounded-full border border-zinc-700">
                    <FolderIcon className="w-12 h-12 text-gray-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Conecta tu Wallet</h2>
                    <p className="text-gray-400 max-w-md mx-auto">Para ver tus protocolos y activos, necesitas conectar tu billetera.</p>
                </div>
            </div>
        );
    }

    if (loadingProjects || loadingMembership) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-lime-500" />
                <p className="text-gray-400 animate-pulse">Buscando tus activos en la blockchain...</p>
            </div>
        );
    }

    if (memberProjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] min-h-[500px] text-center p-8 space-y-8">
                <div className="bg-zinc-800/30 p-8 rounded-full border border-zinc-700/50 relative">
                    <FolderIcon className="w-16 h-16 text-gray-600" />
                    <div className="absolute top-0 right-0 p-2 bg-zinc-900 rounded-full border border-zinc-700">
                        <CoinsIcon className="w-6 h-6 text-lime-500/50" />
                    </div>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-white mb-3">No tienes protocolos activos</h2>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                        Aún no posees Access Cards ni Tokens de utilidad en ningún protocolo listado.
                        Explora las oportunidades disponibles para comenzar.
                    </p>
                    <Link href="/applicants">
                        <button className="px-8 py-4 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-all shadow-lg shadow-lime-500/20 flex items-center gap-2 mx-auto">
                            Explorar Protocolos
                            <ArrowRightIcon className="w-5 h-5" />
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    // --- Content State ---
    return (
        <div className="space-y-10 pt-32 px-4 md:px-8 max-w-7xl mx-auto pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic mb-2">
                        Mis <span className="text-lime-400">Protocolos</span>
                    </h1>
                    <p className="text-zinc-500 max-w-xl font-medium leading-relaxed">
                        Centro de comando para tus activos de gobernanza y accesos exclusivos en el ecosistema Pandoras.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-zinc-900/50 backdrop-blur-md border border-white/5 p-4 rounded-2xl min-w-[160px]">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Membresías</p>
                        <p className="text-3xl font-mono text-lime-400 font-bold">{memberProjects.length}</p>
                    </div>
                    {memberProjects.some(p => p.hasActiveProposals) && (
                        <div className="bg-red-500/5 backdrop-blur-md border border-red-500/20 p-4 rounded-2xl min-w-[160px]">
                            <p className="text-[10px] text-red-400/70 uppercase tracking-widest font-bold mb-1">Votaciones Activas</p>
                            <p className="text-3xl font-mono text-white font-bold">
                                {memberProjects.filter(p => p.hasActiveProposals).length}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Governance Activities */}
            <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-lime-500/20 to-purple-600/20 rounded-3xl blur opacity-25" />
                <div className="relative bg-zinc-950/40 backdrop-blur-xl border border-white/10 rounded-3xl p-1">
                    <UserGovernanceList projectIds={memberProjects.map(p => Number(p.id))} />
                </div>
            </div>

            {/* Protocols Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {memberProjects.map((project) => (
                    <motion.div
                        key={project.id}
                        whileHover={{ y: -8 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative"
                    >
                        {/* Shadow Glow Effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] blur-sm opacity-0 group-hover:opacity-100 transition duration-500" />
                        
                        <div className="relative bg-zinc-900/90 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-full backdrop-blur-sm shadow-2xl transition-colors group-hover:border-lime-500/20">
                            {/* Card Header (Image + Overlay) */}
                            <div className="h-44 relative overflow-hidden">
                                {project.coverPhotoUrl ? (
                                    <img 
                                        src={project.coverPhotoUrl} 
                                        alt={project.title} 
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60" 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                                
                                {/* Badges */}
                                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                                    <div className="px-3 py-1 bg-lime-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                                        Active Member
                                    </div>
                                    {project.hasActiveProposals && (
                                        <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg animate-pulse flex items-center gap-1">
                                            <VoteIcon className="w-3 h-3" />
                                            Active Vote
                                        </div>
                                    )}
                                </div>

                                {/* Logo Overlay */}
                                <div className="absolute -bottom-6 left-8 p-1 bg-zinc-900 rounded-2xl border border-white/10 shadow-xl z-10 transition-transform group-hover:scale-110">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/40">
                                        <img
                                            src={(project as any).logoUrl || '/placeholder-logo.png'}
                                            alt={project.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="p-8 pt-10 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-lime-400 transition-colors">
                                        {project.title}
                                    </h3>
                                    <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
                                        ID: #{project.id.toString().padStart(4, '0')} • {(project as any).ticker || 'PBOX'}
                                    </p>
                                </div>

                                <p className="text-sm text-zinc-400 line-clamp-2 mb-8 flex-1 leading-relaxed">
                                    {project.description}
                                </p>

                                {/* Action Matrix */}
                                <div className="grid grid-cols-2 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5 p-px">
                                    <div className="bg-zinc-900/50 p-4">
                                        <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">Status</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                                            <p className="text-xs font-bold text-white uppercase">Activa</p>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-900/50 p-4 border-l border-white/5">
                                        <p className="text-[9px] text-zinc-600 uppercase font-black tracking-widest mb-1">DAI/Rewards</p>
                                        <p className="text-xs font-bold text-lime-400 uppercase">Ver Dashboard</p>
                                    </div>
                                </div>

                                {/* Main Button */}
                                <Link href={`/projects/${project.slug}/dao`} className="block mt-6">
                                    <button className="w-full py-4 bg-white/5 hover:bg-white text-white hover:text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                                        Administrar Membresía
                                        <ArrowRightIcon className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

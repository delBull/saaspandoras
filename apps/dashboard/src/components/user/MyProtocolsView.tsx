"use client";

import React, { useState, useEffect } from "react";
import { useApplicantsDataBasic, type Project } from "@/hooks/applicants/useApplicantsDataBasic";
import { useActiveAccount } from "thirdweb/react";
import { getContract, readContract, defineChain } from "thirdweb";
import { DEFAULT_NETWORK } from "@/config/networks"; // Use global default network
import { sepolia } from "thirdweb/chains"; // Import Sepolia explicitly for dev/test
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
            // Force Sepolia for testing/dev if contracts are there, otherwise fallback to default
            const chain = sepolia;

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
        <div className="space-y-8 pt-32 px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2">Mis Accesos</h1>
                    <p className="text-zinc-400 max-w-2xl">
                        Gestiona tus activos, verifica tus Access Cards y participa en las decisiones de gobernanza de los protocolos donde eres miembro.
                    </p>
                </div>
                <div className="text-right bg-zinc-800/50 p-4 rounded-xl border border-zinc-700/50">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Participación Total</p>
                    <p className="text-2xl font-mono text-lime-400">{memberProjects.length} Protocolos</p>
                </div>
            </div>

            {/* Governance Calendar Widget */}
            <UserGovernanceList projectIds={memberProjects.map(p => Number(p.id))} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memberProjects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.slug}/dao`}>
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-lime-500/30 transition-colors group h-full flex flex-col"
                        >
                            {/* Header Image */}
                            <div className="h-32 bg-zinc-800 relative">
                                {project.coverPhotoUrl ? (
                                    <img src={project.coverPhotoUrl} alt={project.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
                                )}
                                <div className="absolute top-4 right-4 flex gap-2">
                                    <span className="px-3 py-1 bg-black/50 backdrop-blur text-white text-xs font-bold rounded-full border border-white/10">
                                        MEMBER
                                    </span>
                                    {project.governorContractAddress && (
                                        <span className="px-3 py-1 bg-purple-900/50 backdrop-blur text-white text-xs font-bold rounded-full border border-purple-500/30 flex items-center gap-1">
                                            <VoteIcon className="w-3 h-3 text-purple-400" />
                                            DAO
                                        </span>
                                    )}
                                    {project.hasActiveProposals && (
                                        <span className="px-3 py-1 bg-red-900/50 backdrop-blur text-white text-xs font-bold rounded-full border border-red-500/30 flex items-center gap-1">
                                            <VoteIcon className="w-3 h-3 text-red-400" />
                                            VOTE
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-lime-400 transition-colors">{project.title}</h3>
                                <p className="text-sm text-gray-400 line-clamp-2 mb-6 flex-1">{project.description}</p>

                                {/* Quick Stats (Placeholder until wired deeper) */}
                                <div className="grid grid-cols-2 gap-4 mt-auto pt-6 border-t border-zinc-800">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                            <CreditCardIcon className="w-3 h-3" /> Access Card
                                        </p>
                                        <p className="text-sm font-medium text-white">Activa</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 mb-1 flex items-center justify-end gap-1">
                                            <CoinsIcon className="w-3 h-3" /> Staking
                                        </p>
                                        <p className="text-sm font-medium text-lime-400">Ver Dashboard</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

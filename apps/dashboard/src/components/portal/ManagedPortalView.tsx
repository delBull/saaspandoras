'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  Users, 
  Coins, 
  Vote, 
  ChevronRight, 
  ArrowUpRight, 
  Lock, 
  Loader2,
  Wallet
} from 'lucide-react';
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { prepareContractCall, getContract, defineChain } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { toast } from "sonner";

interface ProjectState {
    id: number;
    title: string;
    slug: string;
    userBalance: number;
    userRewards: string;
    userRewardsValue: number;
    userVotingPower: number;
    holdersCount: string;
    treasuryDisplay: string;
    distributorAddress?: string;
    chainId?: number;
    metadata: {
        estimatedApy: string;
    };
    governance?: {
        activeProposalsCount: number;
        proposals: Array<{
            id: number;
            proposalId: string;
            title: string;
            status: string;
        }>;
    };
}

export default function ManagedPortalView({ slug }: { slug: string }) {
    const account = useActiveAccount();
    const [state, setState] = useState<ProjectState | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'inicio' | 'dao' | 'docs'>('inicio');

    const fetchState = async () => {
        if (!account?.address) return;
        try {
            const res = await fetch(`/api/public/project/${slug}/state?wallet=${account.address}`);
            if (res.ok) {
                const data = await res.json();
                setState(data);
            }
        } catch (error) {
            console.error("Failed to fetch portal state", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchState();
    }, [slug, account?.address]);

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
                    <Wallet size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white">Conecta tu Wallet</h2>
                    <p className="text-sm text-zinc-500">Inicia sesión con la wallet donde tienes tus activos para ver tu portal personalizado.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sincronizando con Pandoras OS...</p>
            </div>
        );
    }

    return (
        <div className="bg-black min-h-screen text-white font-sans selection:bg-yellow-500/30">
            {/* Header / Tabs */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800 p-4">
                <div className="flex items-center justify-around">
                    <TabButton active={activeTab === 'inicio'} onClick={() => setActiveTab('inicio')} label="Inicio" />
                    <TabButton active={activeTab === 'dao'} onClick={() => setActiveTab('dao')} label="DAO" />
                    <TabButton active={activeTab === 'docs'} onClick={() => setActiveTab('docs')} label="Docs" />
                </div>
            </header>

            <main className="p-4 space-y-4 pb-24">
                <AnimatePresence mode="wait">
                    {activeTab === 'inicio' && (
                        <motion.div key="inicio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            {/* Asset Card */}
                            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 shadow-2xl space-y-6">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Mi Posición</p>
                                    <h2 className="text-4xl font-bold tracking-tighter">
                                        {state?.userBalance || 0} <span className="text-xl text-zinc-500 font-medium italic">Títulos</span>
                                    </h2>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Acumulado</p>
                                        <p className="text-sm font-bold font-mono text-white">{state?.userRewards || '0.00'} USDC</p>
                                    </div>
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Voto</p>
                                        <p className="text-sm font-bold font-mono text-white">{state?.userVotingPower || 0} VP</p>
                                    </div>
                                </div>

                                {state && state.userRewardsValue > 0 && (
                                    <TransactionButton
                                        transaction={() => prepareContractCall({
                                            contract: getContract({
                                                client,
                                                chain: defineChain(state.chainId || 84532),
                                                address: state.distributorAddress || "0x0000000000000000000000000000000000000000"
                                            }),
                                            method: "function claim()",
                                            params: []
                                        })}
                                        onTransactionConfirmed={() => {
                                            toast.success("¡Utilidades reclamadas!");
                                            fetchState();
                                        }}
                                        className="!w-full !py-4 !bg-yellow-500 !text-black !rounded-2xl !font-black !uppercase !tracking-widest !text-xs !shadow-xl !shadow-yellow-900/20"
                                    >
                                        Reclamar Utilidades <Coins size={14} className="ml-2" />
                                    </TransactionButton>
                                )}
                            </div>

                            {/* Project Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
                                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-3">TVL Proyecto</p>
                                    <p className="text-lg font-bold font-mono text-white/90">{state?.treasuryDisplay || '0.00 USDC'}</p>
                                </div>
                                <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
                                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-3">APY Objetivo</p>
                                    <p className="text-lg font-bold font-mono text-emerald-400">{state?.metadata?.estimatedApy || '0.0%'}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'dao' && (
                        <motion.div key="dao" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <Vote size={18} className="text-yellow-500" />
                                    Gobernanza Activa
                                </h3>
                                
                                <div className="space-y-4">
                                    {state?.governance?.proposals.length ? (
                                        state.governance.proposals.map((p) => (
                                            <div key={p.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-center">
                                                <div>
                                                    <p className="text-[10px] text-zinc-500 font-mono">#{p.proposalId.slice(0, 8)}</p>
                                                    <p className="text-sm font-bold text-white">{p.title}</p>
                                                </div>
                                                <button onClick={() => window.open(`https://dash.pandoras.finance/projects/${slug}/dao`, '_blank')} className="p-2 bg-zinc-800 rounded-full">
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 space-y-3">
                                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                                                <Lock size={20} />
                                            </div>
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">No hay votaciones en curso</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button 
            onClick={onClick}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                active 
                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-900/20' 
                : 'text-zinc-500 hover:text-white'
            }`}
        >
            {label}
        </button>
    );
}

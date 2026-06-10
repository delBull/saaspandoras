'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BuildingLibraryIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    ClipboardDocumentIcon,
    ChevronDownIcon,
    FolderIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import {
    ClockIcon,
    CheckCircleIcon,
    UserIcon,
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useActiveAccount } from 'thirdweb/react';
import { getContract, prepareContractCall, sendTransaction, waitForReceipt } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { client } from '@/lib/thirdweb-client';
import DaoWizard from '@/components/admin/DaoWizard';
import { LegalTab } from '@/components/projects/LegalTab';
import { EventsTab } from '@/app/()/profile/projects/[slug]/manage/tabs/EventsTab';
import { ResourceHubTab } from '@/app/()/profile/projects/[slug]/manage/tabs/ResourceHubTab';
import type { Project } from '@/types/admin';

interface MissionControlProps {
    projects: Project[];
    initialProject?: Project;
}

export function MissionControlDashboard({ projects, initialProject }: MissionControlProps) {
    const router = useRouter();
    const account = useActiveAccount();
    
    const [selectedProjectId, setSelectedProjectId] = useState<number | string>(
        initialProject?.id || (projects.length > 0 ? projects[0]?.id ?? '' : '')
    );
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'treasury' | 'tokenomics' | 'governance' | 'legal' | 'ambassadors' | 'events' | 'hub'>('overview');
    const [pendingCount, setPendingCount] = useState(0);

    const project = projects.find(p => p.id === selectedProjectId) || projects[0];

    useEffect(() => {
        if (!project || !account?.address) return;
        const fetchPendingCount = async () => {
            try {
                const res = await fetch(`/api/v1/projects/${project.id}/admin/purchases`, {
                    headers: { 'x-wallet-address': account.address }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPendingCount(data.length);
                }
            } catch (error) {
                console.error("Error fetching pending purchases", error);
            }
        };
        fetchPendingCount();
    }, [project?.id, account?.address]);

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
                <FolderIcon className="w-16 h-16 mb-4 opacity-50" />
                <p>No tienes protocolos activos.</p>
            </div>
        );
    }

    let config: any = {};
    try {
        config = typeof (project as any).w2eConfig === 'string' ? JSON.parse((project as any).w2eConfig) : ((project as any).w2eConfig || {});
    } catch (e) {
        console.error("Error parsing w2eConfig", e);
    }
    const treasuryAddress = config.treasuryAddress || (project as any).treasury_address;
    const governorAddress = config.governorAddress || (project as any).governorContractAddress;

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 font-sans pb-24 relative overflow-hidden">
            {/* Background Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
                
                {/* Header & Switcher */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="relative">
                        <p className="text-xs font-black tracking-widest text-zinc-500 uppercase mb-2">Mission Control</p>
                        
                        {projects.length > 1 ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-3 group"
                                >
                                    <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 group-hover:to-zinc-200 transition-all">
                                        {project.title}
                                    </h1>
                                    <ChevronDownIcon className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors" />
                                </button>
                                
                                <AnimatePresence>
                                    {isDropdownOpen && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 mt-4 w-72 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl p-2 z-50 shadow-2xl"
                                        >
                                            {projects.map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => { setSelectedProjectId(p.id); setIsDropdownOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${p.id === project.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'}`}
                                                >
                                                    <span className="block font-bold">{p.title}</span>
                                                    <span className="text-xs opacity-70 capitalize">{p.status}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                                {project.title}
                            </h1>
                        )}
                        
                        <div className="flex items-center gap-3 mt-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                project.status === 'live' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                project.status === 'approved' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}>
                                {project.status}
                            </span>
                            
                            <Link href={`/projects/${project.slug || project.id}`} target="_blank" className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
                                <EyeIcon className="w-4 h-4" /> Ver Página Pública
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Glass Tabs */}
                <div className="flex flex-wrap items-center gap-2 mb-8 p-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl w-fit">
                    {[
                        { id: 'overview', label: 'Overview', icon: <BuildingLibraryIcon className="w-4 h-4" /> },
                        { id: 'purchases', label: 'Inversiones', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
                        { id: 'ambassadors', label: 'Gestores Patrimoniales', icon: <UserIcon className="w-4 h-4" /> },
                        { id: 'events', label: 'Eventos & Calendario', icon: <ClockIcon className="w-4 h-4" /> },
                        { id: 'hub', label: 'Centro de Archivos', icon: <FolderIcon className="w-4 h-4" /> },
                        { id: 'treasury', label: 'Tesorería', icon: <BuildingLibraryIcon className="w-4 h-4" /> },
                        { id: 'tokenomics', label: 'Tokenomics & Bots', icon: <Cog6ToothIcon className="w-4 h-4" /> },
                        { id: 'governance', label: 'DAO & Gobernanza', icon: <DocumentTextIcon className="w-4 h-4" /> },
                        { id: 'legal', label: 'Legal & Riesgos', icon: <DocumentTextIcon className="w-4 h-4" /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-zinc-800 text-white shadow-lg shadow-black/50 border border-zinc-700'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.id === 'purchases' && pendingCount > 0 && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${selectedProjectId}-${activeTab}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                            {activeTab === 'overview' && <OverviewTab project={project} config={config} />}
                            {activeTab === 'purchases' && <PurchasesTab project={project} onUpdatePending={(c) => setPendingCount(c)} />}
                            {activeTab === 'treasury' && <TreasuryTab project={project} address={treasuryAddress} />}
                            {activeTab === 'tokenomics' && <TokenomicsTab project={project} config={config} />}
                            {activeTab === 'governance' && <GovernanceTab address={governorAddress} project={project} />}
                            {activeTab === 'legal' && <LegalTab project={project} />}
                            {activeTab === 'ambassadors' && <AmbassadorsTab project={project} />}
                            {activeTab === 'events' && <EventsTab project={project} />}
                            {activeTab === 'hub' && <ResourceHubTab project={project} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// TAB COMPONENTS (Premium Restyle)
// ----------------------------------------------------------------------

function OverviewTab({ project, config }: { project: any, config: any }) {
    const raised = Number(project.raisedAmount || project.raised_amount || 0);
    const target = Number(project.targetAmount || project.target_amount || 1);
    const progress = Math.min((raised / target) * 100, 100);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                
                {/* Main KPI Card */}
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-6">Capitalización en Vivo</h3>
                    
                    <div className="flex items-end gap-4 mb-8">
                        <p className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                            ${raised.toLocaleString()}
                        </p>
                        <p className="text-xl font-bold text-zinc-500 pb-2">
                            / ${target.toLocaleString()}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-zinc-900 rounded-full overflow-hidden mb-4 border border-zinc-800">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                        />
                    </div>
                    <p className="text-right text-sm font-bold text-emerald-500">{progress.toFixed(1)}% Financiado</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Comunidad DAO</p>
                        <p className="text-3xl font-black text-white">{project.status === 'live' ? '12' : '0'}</p>
                        <p className="text-sm text-zinc-500 mt-1">Miembros Activos</p>
                    </div>
                    <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Utilidades Pagadas</p>
                        <p className="text-3xl font-black text-white">$0.00</p>
                        <p className="text-sm text-zinc-500 mt-1">Acumulado Histórico</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">Información Técnica</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-zinc-400">Red Base</span>
                            <span className="text-sm font-bold text-white bg-white/10 px-2 py-1 rounded">Base (Testnet)</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-zinc-400">Smart Contract</span>
                            <span className="text-sm font-mono text-zinc-300">{(project as any).contractAddress ? `${(project as any).contractAddress.slice(0,6)}...${(project as any).contractAddress.slice(-4)}` : 'Pendiente'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------

function PurchasesTab({ project, onUpdatePending }: { project: any, onUpdatePending: (count: number) => void }) {
    const account = useActiveAccount();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPurchases = async () => {
        if (!account?.address) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/projects/${project.id}/admin/purchases`, {
                headers: { 'x-wallet-address': account.address }
            });
            if (res.ok) {
                const data = await res.json();
                setPurchases(data);
                onUpdatePending(data.length);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPurchases(); }, [account?.address, project.id]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        if (!account?.address) return;
        let reason = "";
        if (action === 'reject') {
            reason = window.prompt("Ingresa la razón del rechazo:") || "";
            if (!reason) return;
        }

        setProcessingId(id);
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/admin/purchases/approve`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet-address": account.address
                },
                body: JSON.stringify({ purchaseId: id, action, reason })
            });

            if (res.ok) {
                const result = await res.json();
                
                // Blockchain Sync Logic (kept identical to previous robust implementation)
                if (action === 'approve' && result.targetWallet && (project as any).contractAddress) {
                    toast.loading("Sincronizando con Blockchain...", { id: "bc-sync" });
                    try {
                        const chain = defineChain(Number((project as any).chainId || 84532));
                        const contract = getContract({ client, chain, address: (project as any).contractAddress });
                        const mintMethod = (project as any).w2eConfig?.mintMethod || "function mintTo(address to, uint256 amount)";
                        const transaction = prepareContractCall({
                            contract, method: mintMethod,
                            params: [result.targetWallet as any, BigInt(result.units || 1)]
                        });
                        const tx = await sendTransaction({ account, transaction });
                        const receipt = await waitForReceipt({ client, chain, transactionHash: tx.transactionHash });
                        
                        await fetch(`/api/v1/projects/${project.id}/admin/purchases/sync-hash`, {
                            method: "POST", headers: { "Content-Type": "application/json", "x-wallet-address": account.address },
                            body: JSON.stringify({ purchaseId: id, txHash: receipt.transactionHash })
                        });
                        toast.success("¡Blockchain Sincronizada!", { id: "bc-sync" });
                    } catch (bcError) {
                        toast.error("Aprobado en BD, pero error en Blockchain.", { id: "bc-sync" });
                    }
                } else {
                    toast.success(action === 'approve' ? 'Inversión aprobada' : 'Inversión rechazada');
                }
                fetchPurchases();
            } else {
                const err = await res.json();
                toast.error(err.error || "Error al procesar la acción");
            }
        } catch (error) {
            toast.error("Error de red");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="py-20 text-center text-zinc-500 animate-pulse">Cargando fila de autorizaciones...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">Fila de Autorizaciones (Compliance)</h3>
                <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold border border-white/20">
                    {purchases.length} Pendientes
                </span>
            </div>

            {purchases.length === 0 ? (
                <div className="p-16 bg-white/[0.02] border border-white/5 rounded-3xl text-center text-zinc-500 backdrop-blur-md">
                    <CurrencyDollarIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No hay inversiones pendientes de validación.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {purchases.map((p) => (
                        <div key={p.id} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 backdrop-blur-md hover:bg-white/[0.04] transition-colors">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Inversionista</p>
                                        <p className="font-mono text-sm text-white">{p.userId}</p>
                                    </div>
                                </div>
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-black">Monto</p>
                                        <p className="text-xl font-bold text-green-400">${Number(p.amount).toLocaleString()} <span className="text-xs opacity-50">{p.currency}</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-black">Estado</p>
                                        <div className="mt-1">
                                            {p.status === 'processing' ? (
                                                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] uppercase font-black rounded flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
                                                    Notificado
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[10px] uppercase font-black rounded border border-zinc-700">
                                                    En Espera
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 min-w-[200px] w-full md:w-auto">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 self-end">
                                    <ClockIcon className="w-3 h-3" /> Expiración: {new Date(p.expiresAt).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        disabled={processingId === p.id}
                                        onClick={() => handleAction(p.id, 'reject')}
                                        className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-black tracking-wider transition-all disabled:opacity-50"
                                    >
                                        RECHAZAR
                                    </button>
                                    <button
                                        disabled={processingId === p.id}
                                        onClick={() => handleAction(p.id, 'approve')}
                                        className="flex-1 py-3 bg-green-500 hover:bg-green-400 text-black rounded-xl text-xs font-black tracking-wider transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 flex items-center justify-center"
                                    >
                                        {processingId === p.id ? '...' : 'APROBAR'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------

function TreasuryTab({ project, address }: { project: any, address?: string }) {
    const account = useActiveAccount();
    const [isDistributing, setIsDistributing] = useState(false);
    const [distAmount, setDistAmount] = useState("");
    const [distDesc, setDistDesc] = useState("");
    const [treasuryBalance, setTreasuryBalance] = useState<string | null>(null);

    useEffect(() => {
        if (!address) return;
        fetch(`/api/v1/projects/${project.id}/admin/treasury-balance`, {
            headers: { "x-wallet-address": account?.address || "" }
        }).then(r => r.ok ? r.json() : null).then(data => {
            if (data?.balance !== undefined) setTreasuryBalance(Number(data.balance).toFixed(2));
        }).catch(() => {});
    }, [project.id, address, account?.address]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute top-[-50%] right-[-10%] w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
                    
                    <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-2">Caja Fuerte (Tesorería)</h3>
                    
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-8 font-mono bg-black/40 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                        {address ? `${address.slice(0,8)}...${address.slice(-6)}` : 'Sin Contrato'}
                        {address && (
                            <button className="hover:text-white" onClick={() => navigator.clipboard.writeText(address)}>
                                <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    
                    <p className="text-5xl font-black text-white mb-2">
                        {treasuryBalance !== null ? `$${treasuryBalance}` : '$0.00'}
                    </p>
                    <p className="text-sm font-medium text-blue-400">USDC Disponible</p>
                </div>

                <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                    <h3 className="text-lg font-bold text-white mb-4">Historial de Salidas</h3>
                    <div className="text-center py-8 text-zinc-600 text-sm">
                        No hay retiros registrados.
                    </div>
                </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 border-t-4 border-t-yellow-500/50">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                    <CurrencyDollarIcon className="w-6 h-6 text-yellow-500" />
                    Distribución de Utilidades
                </h3>
                <p className="text-sm text-zinc-400 mb-8">
                    Envía rendimientos directamente a las cuentas virtuales de tus holders. El sistema dispersará el saldo proporcionalmente al poder de voto (Ownership) de cada DAO Member.
                </p>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Total a Distribuir (USDC)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                            <input 
                                type="number"
                                value={distAmount}
                                onChange={(e) => setDistAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white font-mono text-xl focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Concepto</label>
                        <input 
                            type="text"
                            value={distDesc}
                            onChange={(e) => setDistDesc(e.target.value)}
                            placeholder="Ej: Retornos Operativos Mensuales (Agosto)"
                            className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-yellow-500/50 outline-none transition-all"
                        />
                    </div>
                    <button 
                        disabled={isDistributing}
                        className="w-full py-4 mt-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-[0_0_30px_rgba(234,179,8,0.2)]"
                    >
                        {isDistributing ? "Ejecutando Dispersión..." : "Emitir Pagos a Inversionistas"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------

function TokenomicsTab({ project, config }: { project: any, config: any }) {
    const [botToken, setBotToken] = useState('');
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold text-white mb-6">Fases de Venta</h3>
                <div className="space-y-4">
                    {config.phases?.length > 0 ? config.phases.map((phase: any) => (
                        <div key={phase.id} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-white flex items-center gap-2">
                                    {phase.name}
                                    {phase.isSoftCap && <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Soft Cap</span>}
                                </p>
                                <p className="text-sm text-zinc-500 mt-1">{phase.type === 'time' ? `${phase.limit} días` : `$${phase.limit} USD`} límite • {phase.tokenPrice ? `$${phase.tokenPrice} por unidad` : 'N/A'}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${phase.isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                {phase.isActive ? 'Activa' : 'Detenida'}
                            </span>
                        </div>
                    )) : (
                        <p className="text-zinc-500">No hay fases configuradas.</p>
                    )}
                </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8 border-t-4 border-t-sky-500/50">
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
                    Integra un TMA de Telegram
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Vigila tus métricas, gamifica tu comunidad y permite que tus usuarios vean su balance desde un Mini-App en Telegram conectada a este protocolo.
                </p>
                <div className="space-y-4">
                    <input 
                      type="password"
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 focus:border-sky-500/50 focus:outline-none rounded-xl px-4 py-3 text-white text-sm transition-colors" 
                      placeholder="Token (Ej: 8639272150:AAEVRsfH...)"
                    />
                    <button className="w-full bg-sky-500 hover:bg-sky-400 text-black font-black uppercase tracking-widest px-6 py-3 rounded-xl text-xs transition-colors shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                      Vincular Bot
                    </button>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------

function GovernanceTab({ address, project }: { address?: string, project: any }) {
    if (!address) return (
        <div className="p-16 text-center bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 text-zinc-500">
            <DocumentTextIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg">No hay contrato de Gobernanza activo en este protocolo.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-8">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-white tracking-tighter">Asamblea & Gobernanza (DAO)</h3>
                        <p className="text-zinc-400 text-sm mt-2">
                            Gestionada por holders del token <strong>{(project as any).w2eConfig?.utilityToken?.symbol || 'TOKEN'}</strong>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 blur-[20px] rounded-full" />
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Propuestas Activas</p>
                        <p className="text-4xl font-black text-white">0</p>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/20 blur-[20px] rounded-full" />
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Aprobadas</p>
                        <p className="text-4xl font-black text-white">0</p>
                    </div>
                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/20 blur-[20px] rounded-full" />
                        <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-2">Ejecutadas</p>
                        <p className="text-4xl font-black text-white">1</p>
                    </div>
                </div>

                <div className="mt-8">
                    <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-4">Módulo Administrativo</h4>
                    <DaoWizard project={project} governorAddress={address} />
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------

function AmbassadorsTab({ project }: { project: any }) {
    const [ambassadors, setAmbassadors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchAmbassadors = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/projects/${project.slug}/ambassadors`);
            if (res.ok) {
                const data = await res.json();
                setAmbassadors(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAmbassadors(); }, [project.slug]);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/projects/${project.slug}/ambassadors/${id}/approve`, {
                method: "POST"
            });
            if (res.ok) {
                toast.success('Gestor Patrimonial Aprobado');
                fetchAmbassadors();
            } else {
                const err = await res.json();
                toast.error(err.error || "Error al aprobar");
            }
        } catch (error) {
            toast.error("Error de red");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="py-20 text-center text-zinc-500 animate-pulse">Cargando gestores patrimoniales...</div>;

    const pendingCount = ambassadors.filter(a => a.status === 'pending').length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">Red de Ventas Oficial (Gestores)</h3>
                <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold border border-white/20">
                    {pendingCount} Solicitudes Pendientes
                </span>
            </div>

            {ambassadors.length === 0 ? (
                <div className="p-16 bg-white/[0.02] border border-white/5 rounded-3xl text-center text-zinc-500 backdrop-blur-md">
                    <UserIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg">No hay gestores patrimoniales registrados en este proyecto.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ambassadors.map((a) => (
                        <div key={a.id} className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden flex flex-col justify-between h-full">
                            {/* Glow */}
                            <div className={`absolute -top-10 -right-10 w-32 h-32 blur-[40px] rounded-full pointer-events-none ${a.status === 'active' ? 'bg-emerald-500/10' : 'bg-yellow-500/10'}`} />
                            
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                        <UserIcon className="w-6 h-6 text-zinc-300" />
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] uppercase font-black rounded border ${
                                        a.status === 'active' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                            : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                    }`}>
                                        {a.status === 'active' ? 'Oficial' : 'Pendiente'}
                                    </span>
                                </div>
                                
                                <h4 className="text-lg font-black tracking-tight text-white mb-1">{a.fullName}</h4>
                                <p className="text-xs text-zinc-400 mb-4">{a.email}</p>

                                {a.walletAddress && (
                                    <p className="text-xs font-mono text-zinc-500 mb-4 bg-black/40 p-2 rounded-lg break-all">
                                        Wallet: {a.walletAddress}
                                    </p>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5">
                                {a.status === 'active' ? (
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-black text-zinc-500 mb-1">Código de Referido</span>
                                        <span className="font-mono text-emerald-400 text-lg">{a.referralCode}</span>
                                    </div>
                                ) : (
                                    <button 
                                        disabled={processingId === a.id}
                                        onClick={() => handleApprove(a.id)}
                                        className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] disabled:opacity-50"
                                    >
                                        {processingId === a.id ? 'Aprobando...' : 'Aprobar Ingreso'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

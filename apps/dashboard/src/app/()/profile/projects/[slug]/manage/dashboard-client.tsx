'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BuildingLibraryIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    ArrowLeftIcon,
    ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import DaoWizard from '@/components/admin/DaoWizard';

import { useActiveAccount } from 'thirdweb/react';
import { getContract, prepareContractCall, sendTransaction, waitForReceipt } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { client } from '@/lib/thirdweb-client';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    UserIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/solid';

interface ProjectFounderDashboardProps {
    project: any; // Type strictly later
}

export default function ProjectFounderDashboard({ project }: ProjectFounderDashboardProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'overview' | 'treasury' | 'governance' | 'settings' | 'purchases'>('overview');
    const [isLoadingPhase, setIsLoadingPhase] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState(0);

    const account = useActiveAccount();

    const fetchPendingCount = async () => {
        if (!account?.address) return;
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/admin/purchases`, {
                headers: { 'x-wallet-address': account.address }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingCount(data.length);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchPendingCount();
    }, [account?.address, project.id]);

    // Safe Config Access
    const config = project.w2eConfig || {};
    const treasuryAddress = config.treasuryAddress || project.treasury_address;
    const governorAddress = config.governorAddress || project.governorContractAddress;

    const handleTogglePhase = async (phaseId: string, currentStatus: boolean) => {
        try {
            setIsLoadingPhase(phaseId);
            const response = await fetch(`/api/projects/${project.id}/phases`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phaseId, isActive: !currentStatus }),
            });

            if (!response.ok) throw new Error('Failed to update phase');

            toast.success(currentStatus ? 'Fase pausada' : 'Fase activada');
            router.refresh();
        } catch (error) {
            toast.error('Error al actualizar la fase');
            console.error(error);
        } finally {
            setIsLoadingPhase(null);
        }
    };

    // ... (tabs config)

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 transition-colors">
                        <ArrowLeftIcon className="w-5 h-5 text-zinc-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">{project.title}</h1>
                        <p className="text-zinc-500 text-sm font-medium">Panel de Control del Fundador</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={`/projects/${project.slug}`} target="_blank" className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-800 transition-all text-sm font-bold">
                        VER PÁGINA PÚBLICA
                    </Link>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl w-fit">
                {[
                    { id: 'overview', label: 'Resumen', icon: <BuildingLibraryIcon className="w-4 h-4" /> },
                    { id: 'purchases', label: 'Inversiones', icon: <CurrencyDollarIcon className="w-4 h-4" /> },
                    { id: 'treasury', label: 'Tesorería', icon: <BuildingLibraryIcon className="w-4 h-4" /> },
                    { id: 'governance', label: 'Gobernanza', icon: <DocumentTextIcon className="w-4 h-4" /> },
                    { id: 'settings', label: 'Configuración', icon: <Cog6ToothIcon className="w-4 h-4" /> },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-zinc-800 text-white shadow-lg'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.id === 'purchases' && pendingCount > 0 && (
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && (
                            <OverviewTab
                                project={project}
                                config={config}
                                onTogglePhase={handleTogglePhase}
                                loadingPhase={isLoadingPhase}
                            />
                        )}
                        {activeTab === 'treasury' && <TreasuryTab project={project} address={treasuryAddress} />}
                        {activeTab === 'governance' && <GovernanceTab address={governorAddress} project={project} />}
                        {activeTab === 'settings' && <SettingsTab project={project} />}
                        {activeTab === 'purchases' && (
                            <PurchasesTab project={project} onUpdatePending={fetchPendingCount} />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// Sub-components
function OverviewTab({ project, config, onTogglePhase, loadingPhase }: {
    project: any,
    config: any,
    onTogglePhase: (id: string, status: boolean) => void,
    loadingPhase: string | null
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Estado del Protocolo</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-800 rounded-lg">
                            <p className="text-sm text-gray-400">Total Recaudado</p>
                            <p className="text-2xl font-mono text-green-400">${Number(project.raised_amount || 0).toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-zinc-800 rounded-lg">
                            <p className="text-sm text-gray-400">Objetivo</p>
                            <p className="text-2xl font-mono text-white">${Number(project.target_amount || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Fases de Venta Activas</h3>
                    <div className="space-y-3">
                        {config.phases?.length > 0 ? config.phases.map((phase: any) => (
                            <div key={phase.id} className="flex justify-between items-center p-3 bg-zinc-800/50 rounded border border-zinc-700">
                                <div>
                                    <p className="font-medium text-white flex items-center gap-2">
                                        {phase.name}
                                        {phase.isSoftCap && <span className="text-[10px] bg-blue-900/50 text-blue-400 px-1.5 rounded border border-blue-500/20">Soft Cap</span>}
                                    </p>
                                    <p className="text-xs text-gray-400">{phase.type === 'time' ? `${phase.limit} días` : `$${phase.limit} USD`} • {phase.tokenPrice ? `$${phase.tokenPrice}` : 'N/A'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 rounded text-xs ${phase.isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-gray-500'}`}>
                                        {phase.isActive ? 'Activa' : 'Inactiva'}
                                    </span>
                                    <button
                                        onClick={() => onTogglePhase(phase.id, phase.isActive)}
                                        disabled={loadingPhase === phase.id}
                                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${phase.isActive
                                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'
                                            }`}
                                    >
                                        {loadingPhase === phase.id ? '...' : (phase.isActive ? 'Detener' : 'Iniciar')}
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-gray-500 italic">No hay fases configuradas.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Quick Links / Status */}
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Despliegue</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Red</span>
                            <span className="text-white">Sepolia (Testnet)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Fecha</span>
                            <span className="text-white">{new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="pt-4 border-t border-zinc-800">
                            <Link href={`/projects/${project.slug}`} target="_blank">
                                <button className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-sm font-medium">
                                    Ver Página Pública
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TreasuryTab({ project, address }: { project: any, address?: string }) {
    const account = useActiveAccount();
    const [isDistributing, setIsDistributing] = useState(false);
    const [distAmount, setDistAmount] = useState("");
    const [distDesc, setDistDesc] = useState("");

    if (!address) return (
        <div className="p-12 text-center bg-zinc-900 rounded-xl border border-zinc-800 text-gray-500">
            No hay dirección de tesorería asignada. Despliega el protocolo primero.
        </div>
    );

    const handleDistribute = async () => {
        if (!distAmount || isNaN(Number(distAmount))) {
            toast.error("Ingresa un monto válido.");
            return;
        }

        if (!confirm(`¿Estás seguro de distribuir ${distAmount} USDC entre todos los holders? Esta acción es irreversible.`)) {
            return;
        }

        setIsDistributing(true);
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/admin/distribute`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-wallet-address": account?.address || ""
                },
                body: JSON.stringify({
                    amount: Number(distAmount),
                    description: distDesc
                })
            });

            if (res.ok) {
                toast.success("¡Distribución completada exitosamente!");
                setDistAmount("");
                setDistDesc("");
            } else {
                const err = await res.json();
                toast.error(err.error || "Error en la distribución");
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setIsDistributing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Tesorería del Protocolo</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                            <span className="font-mono bg-zinc-800 px-2 py-1 rounded">{address}</span>
                            <button className="hover:text-white" onClick={() => navigator.clipboard.writeText(address)}>
                                <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Balance Total Estimado</p>
                        <p className="text-3xl font-mono text-white">$0.00 <span className="text-lg text-gray-500">USD</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button className="py-3 bg-green-500/10 border border-green-500/20 text-green-400 font-bold rounded-lg transition-colors">
                        Sincronizar Balance On-Chain
                    </button>
                    <button className="py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors">
                        Solicitar Retiro (Propuesta)
                    </button>
                </div>
            </div>

            {/* Distribution Module */}
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-yellow-500" />
                    Distribución de Utilidades
                </h3>
                <p className="text-sm text-gray-400 mb-6">
                    Envía rendimientos directamente a las cuentas de tus holders. El sistema calculará automáticamente la parte proporcional basada en el Poder de Voto de cada inversor.
                </p>
                
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Monto Total a Distribuir (USDC)</label>
                        <input 
                            type="number"
                            value={distAmount}
                            onChange={(e) => setDistAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white font-mono focus:border-yellow-500 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Descripción / Concepto</label>
                        <input 
                            type="text"
                            value={distDesc}
                            onChange={(e) => setDistDesc(e.target.value)}
                            placeholder="Ej: Utilidades Q1 2026 - Fase Preventa"
                            className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm focus:border-yellow-500 outline-none transition-colors"
                        />
                    </div>
                    <button 
                        onClick={handleDistribute}
                        disabled={isDistributing}
                        className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-yellow-900/20"
                    >
                        {isDistributing ? "Procesando Distribución..." : "Ejecutar Distribución Pro-Rata"}
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Historial de Tesorería</h3>
                <div className="text-center py-8 text-gray-500 text-sm">
                    No hay transacciones registradas.
                </div>
            </div>
        </div>
    );
}

function GovernanceTab({ address, project }: { address?: string, project: any }) {
    const [showWizard, setShowWizard] = useState(false);

    if (!address) return (
        <div className="p-12 text-center bg-zinc-900 rounded-xl border border-zinc-800 text-gray-500">
            No hay contrato de Gobernanza activo.
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Gobernanza Descentralizada</h3>
                        <p className="text-gray-400 text-sm mt-1">
                            Gestionada por el token <strong>{project.w2eConfig?.utilityToken?.symbol || 'TOKEN'}</strong>
                        </p>
                    </div>
                    <button
                        onClick={() => setShowWizard(!showWizard)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${showWizard ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                    >
                        {showWizard ? 'Cancelar / Cerrar' : 'Administrar DAO'}
                    </button>
                </div>

                {/* DAO Wizard Expansion */}
                <AnimatePresence>
                    {showWizard && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <DaoWizard project={project} governorAddress={address} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <p className="text-2xl text-white font-bold">0</p>
                        <p className="text-xs text-gray-400 uppercase">Activas</p>
                    </div>
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <p className="text-2xl text-white font-bold">0</p>
                        <p className="text-xs text-gray-400 uppercase">Aprobadas</p>
                    </div>
                    <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <p className="text-2xl text-white font-bold">1</p>
                        <p className="text-xs text-gray-400 uppercase">Ejecutadas</p>
                    </div>
                </div>

                <div className="border-t border-zinc-800 pt-6">
                    <p className="text-sm font-medium text-gray-300 mb-3">Historial de Propuestas</p>
                    <div className="bg-zinc-800/30 rounded-lg p-4 border border-zinc-700/50 flex justify-between items-center">
                        <div>
                            <p className="text-sm font-medium text-white">#1 - Configuración Inicial del Protocolo</p>
                            <p className="text-xs text-gray-500">Ejecutada - Hace 2 días</p>
                        </div>
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/20 text-xs rounded">
                            Ejecutada
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SettingsTab({ project }: { project: any }) {
    return (
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-xl font-bold text-white mb-6">Configuración del Proyecto</h3>
            <p className="text-zinc-400 mb-4">
                Para editar los detalles públicos (Logo, Descripción), utiliza el editor de perfil.
            </p>
            <Link href={`/profile/projects/${project.id}/edit`}>
                <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors">
                    Ir al Editor de Perfil
                </button>
            </Link>
        </div>
    );
}
function PurchasesTab({ project, onUpdatePending }: { project: any, onUpdatePending?: () => void }) {
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
                if (onUpdatePending) onUpdatePending();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
    }, [account?.address, project.id]);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        if (!account?.address) return;

        let reason = "";
        if (action === 'reject') {
            reason = window.prompt("Ingresa la razón del rechazo (se enviará al usuario):") || "";
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

                // ⚠️ BLOCKCHAIN SYNC (One-Click)
                if (action === 'approve' && result.targetWallet && project.contractAddress) {
                    toast.loading("Sincronizando con Blockchain...", { id: "bc-sync" });
                    try {
                        const chain = defineChain(Number(project.chainId || 84532));
                        const contract = getContract({
                            client,
                            chain,
                            address: project.contractAddress
                        });

                        // Dynamic Method from config
                        const config = project.w2eConfig as any;
                        const mintMethod = config?.mintMethod || "function mintTo(address to, uint256 amount)";

                        const transaction = prepareContractCall({
                            contract,
                            method: mintMethod,
                            params: [result.targetWallet as any, BigInt(result.units || 1)]
                        });

                        const tx = await sendTransaction({
                            account,
                            transaction
                        });

                        // Wait for confirmation
                        const receipt = await waitForReceipt({
                            client,
                            chain,
                            transactionHash: tx.transactionHash
                        });

                        // Sync Hash with DB
                        await fetch(`/api/v1/projects/${project.id}/admin/purchases/sync-hash`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "x-wallet-address": account.address
                            },
                            body: JSON.stringify({ purchaseId: id, txHash: receipt.transactionHash })
                        });

                        toast.success("¡Blockchain Sincronizada!", { id: "bc-sync" });
                        console.log("Tx Hash:", receipt.transactionHash);
                    } catch (bcError) {
                        console.error("Blockchain Sync Error:", bcError);
                        toast.error("Aprobado en DB, pero error al firmar en Blockchain. Sincroniza manualmente.", { id: "bc-sync" });
                    }
                } else {
                    toast.success(action === 'approve' ? 'Inversión aprobada correctamente' : 'Inversión rechazada');
                }

                fetchPurchases();
            } else {
                const err = await res.json();
                toast.error(err.error || "Error al procesar la acción");
            }
        } catch (error) {
            toast.error("Error de conexión con el servidor");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="py-20 text-center text-zinc-500 animate-pulse">Cargando cola de autorizaciones...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Cola de Autorización de Inversiones</h3>
                <span className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full text-xs font-mono">
                    {purchases.length} Pendientes
                </span>
            </div>

            {purchases.length === 0 ? (
                <div className="p-12 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500">
                    No hay inversiones pendientes de validación en este momento.
                </div>
            ) : (
                <div className="grid gap-4">
                    {purchases.map((p) => (
                        <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="space-y-4 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-zinc-800 rounded-xl text-zinc-400">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase font-black tracking-widest">Inversionista (Wallet)</p>
                                        <p className="font-mono text-sm text-white">{p.userId}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-black">Monto</p>
                                        <p className="text-lg font-bold text-green-400">${Number(p.amount).toLocaleString()} <span className="text-xs opacity-50">{p.currency}</span></p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-zinc-500 uppercase font-black">Referencia</p>
                                        <div className="font-mono text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded inline-block">
                                            {p.purchaseId}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 min-w-[200px]">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500">
                                    <ClockIcon className="w-3 h-3" /> Expiración: {new Date(p.expiresAt).toLocaleDateString()}
                                </div>
                                <div className="flex gap-2 w-full">
                                    <button
                                        disabled={processingId === p.id}
                                        onClick={() => handleAction(p.id, 'reject')}
                                        className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        RECHAZAR
                                    </button>
                                    <button
                                        disabled={processingId === p.id}
                                        onClick={() => handleAction(p.id, 'approve')}
                                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {processingId === p.id ? '...' : <><CheckCircleIcon className="w-4 h-4" /> APROBAR</>}
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

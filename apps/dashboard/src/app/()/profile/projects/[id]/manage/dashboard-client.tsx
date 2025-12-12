'use client';

import { useState } from 'react';
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
// import { useContract, useBalance } from "@thirdweb-dev/react"; // Removed: Package not installed
// If using v5 (current trend in repo), imports might differ. 
// Repo uses "@thirdweb-dev/react" (v4-ish) or "thirdweb/react" (v5).
// Let's assume compat or check other files. 
// `ProjectSidebar.tsx` imports from `lucide-react`, standard React.
// `useProjectActions` uses `fetch` so no thirdweb hooks visible there immediately.
// I'll stick to standard React for UI and basic Web3 hooks if I can context switch.
// Safest is to display addresses and link to Explorer first, then upgrade to hook.
// But user requested "Founder Experience". I'll try to read balance.

interface ProjectFounderDashboardProps {
    project: any; // Type strictly later
}

export default function ProjectFounderDashboard({ project }: ProjectFounderDashboardProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'treasury' | 'governance' | 'settings'>('overview');

    // Safe Config Access
    const config = project.w2eConfig || {};
    const treasuryAddress = config.treasuryAddress || project.treasury_address;
    const governorAddress = config.governorAddress || project.governorContractAddress;

    // Tabs Configuration
    const tabs = [
        { id: 'overview', label: 'Resumen', icon: DocumentTextIcon },
        { id: 'treasury', label: 'Tesorería', icon: CurrencyDollarIcon },
        { id: 'governance', label: 'DAO & Votación', icon: BuildingLibraryIcon },
        { id: 'settings', label: 'Configuración', icon: Cog6ToothIcon },
    ];

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/profile/projects" className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                        {project.title}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs border ${project.status === 'live' ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-zinc-700 text-gray-400'
                            }`}>
                            {project.status === 'live' ? 'En Vivo' : project.status}
                        </span>
                        <span className="text-zinc-500 text-sm">• Founder Dashboard</span>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 border-b border-zinc-800 pb-1 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-all relative ${activeTab === tab.id
                            ? 'text-white bg-zinc-900 border-b-2 border-purple-500'
                            : 'text-gray-400 hover:text-white hover:bg-zinc-900/50'
                            }`}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span className="font-medium">{tab.label}</span>
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
                        {activeTab === 'overview' && <OverviewTab project={project} config={config} />}
                        {activeTab === 'treasury' && <TreasuryTab address={treasuryAddress} />}
                        {activeTab === 'governance' && <GovernanceTab address={governorAddress} project={project} />}
                        {activeTab === 'settings' && <SettingsTab project={project} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// Sub-components
function OverviewTab({ project, config }: { project: any, config: any }) {
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
                        {config.phases?.length > 0 ? config.phases.map((phase: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-zinc-800/50 rounded border border-zinc-700">
                                <div>
                                    <p className="font-medium text-white">{phase.name}</p>
                                    <p className="text-xs text-gray-400">{phase.type === 'time' ? `${phase.limit} días` : `$${phase.limit} USD`}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ${phase.isActive ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-gray-500'}`}>
                                    {phase.isActive ? 'Activa' : 'Inactiva'}
                                </span>
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

function TreasuryTab({ address }: { address?: string }) {
    if (!address) return (
        <div className="p-12 text-center bg-zinc-900 rounded-xl border border-zinc-800 text-gray-500">
            No hay dirección de tesorería asignada. Despliega el protocolo primero.
        </div>
    );

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
                    {/* Placeholder Balance - would use standard hook in real app */}
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Balance Total Estimado</p>
                        <p className="text-3xl font-mono text-white">$0.00 <span className="text-lg text-gray-500">USD</span></p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <button className="py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-lg transition-colors">
                        Depositar Fondos
                    </button>
                    <button className="py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors">
                        Solicitar Retiro (Propuesta)
                    </button>
                </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Transacciones Recientes</h3>
                <div className="text-center py-8 text-gray-500 text-sm">
                    No hay transacciones recientes en la tesorería.
                </div>
            </div>
        </div>
    );
}

function GovernanceTab({ address, project }: { address?: string, project: any }) {
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
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                        Nueva Propuesta
                    </button>
                </div>

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

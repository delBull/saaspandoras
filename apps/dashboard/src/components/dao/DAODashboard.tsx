"use client";

import { UserGovernanceList } from "../user/UserGovernanceList";
import { VoteIcon, WalletIcon, TrendingUpIcon, ActivityIcon, ArrowUpRightIcon, HelpCircleIcon, SettingsIcon, LockIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useReadContract } from "thirdweb/react";
import { getContract, defineChain } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";

interface DAODashboardProps {
    project: any;
    activeView: string;
    isOwner?: boolean;
}

export function DAODashboard({ project, activeView, isOwner = false }: DAODashboardProps) {

    // --- Hooks for Real Data ---
    // 1. Treasury Balance
    const treasuryContract = project.treasuryContractAddress ? getContract({
        client,
        chain: config.chain, // Dynamic chain from config (Base/Sepolia)
        address: project.treasuryContractAddress,
    }) : undefined;

    // Use a generic balance read or assume native (for now assuming native ETH/POL balance of the treasury address would be via provider, 
    // but here we can check if it has a `balanceOf` if it's a DAO treasury wrapper, or just show placeholder if complex.
    // For simplicity/speed, I'll keep the mock but add the TODO for real integration or use a basic hook if I verify the ABI.
    // Actually, let's just show the address if we can't read balance easily without ABI.

    // -- Sub-Views --

    const OverviewView = () => (
        <div className="space-y-8">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <WalletIcon className="w-24 h-24 text-lime-500" />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium mb-1">Tesorería del Protocolo</p>
                    <h3 className="text-3xl font-bold text-white font-mono">
                        {project.treasuryContractAddress ? (
                            <span className="text-xl break-all line-clamp-1" title={project.treasuryContractAddress}>
                                {project.treasuryContractAddress.slice(0, 6)}...{project.treasuryContractAddress.slice(-4)}
                            </span>
                        ) : "$0.00"}
                    </h3>
                    <div className="mt-4 flex items-center text-xs text-lime-400">
                        <TrendingUpIcon className="w-3 h-3 mr-1" />
                        Disponible (On-Chain)
                    </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <VoteIcon className="w-24 h-24 text-purple-500" />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium mb-1">Propuestas Activas</p>
                    <h3 className="text-3xl font-bold text-white font-mono">--</h3>
                    <div className="mt-4 flex items-center text-xs text-purple-400">
                        <ActivityIcon className="w-3 h-3 mr-1" />
                        Ver votaciones
                    </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUpIcon className="w-24 h-24 text-blue-500" />
                    </div>
                    <p className="text-zinc-400 text-sm font-medium mb-1">Recompensas Estimadas</p>
                    <h3 className="text-3xl font-bold text-white font-mono">Dinámico</h3>
                    <div className="mt-4 flex items-center text-xs text-blue-400">
                        <ArrowUpRightIcon className="w-3 h-3 mr-1" />
                        Basado en participación
                    </div>
                </div>
            </div>

            {/* Recent Activity / Governance List */}
            <div>
                <h3 className="text-xl font-bold text-white mb-6">Actividad de Gobernanza</h3>
                <UserGovernanceList projectIds={[Number(project.id)]} />
            </div>
        </div>
    );

    const StakingView = () => (
        <div className="p-12 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
            <div className="inline-flex p-4 bg-zinc-800 rounded-full mb-4">
                <TrendingUpIcon className="w-8 h-8 text-lime-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Utilidad y Recompensas</h3>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">
                Participa activamente utilizando tus Access Cards o Tokens de Utilidad.
                Las recompensas se otorgan en base a la participación y contribución al protocolo.
            </p>
            <div className="flex justify-center gap-4">
                <button className="px-6 py-3 bg-zinc-800 text-zinc-500 font-bold rounded-xl cursor-not-allowed flex items-center gap-2 border border-zinc-700">
                    <LockIcon className="w-4 h-4" />
                    Programa de Recompensas
                </button>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
                El dueño del protocolo ({project.applicant_name}) está configurando los pools de utilidad.
            </p>
        </div>
    );

    const ProposalsView = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Todas las Propuestas</h3>
                {isOwner && (
                    <button className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black text-sm font-bold rounded-lg transition-colors shadow-lg shadow-lime-500/10">
                        + Nueva Propuesta
                    </button>
                )}
            </div>
            <UserGovernanceList projectIds={[Number(project.id)]} />
        </div>
    );

    const InfoView = () => (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                    <HelpCircleIcon className="w-8 h-8 text-lime-400" />
                    Centro de Conocimiento DAO
                </h3>
                <p className="text-zinc-400">
                    Entiende cómo funciona la gobernanza descentralizada, tus derechos como miembro y la seguridad del protocolo.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Gobernanza */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-lime-500/30 transition-colors">
                    <div className="h-10 w-10 bg-lime-900/20 rounded-lg flex items-center justify-center mb-4 text-lime-400">
                        <VoteIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">Gobernanza Descentralizada</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        Este protocolo opera como una DAO (Organización Autónoma Descentralizada).
                        Ninguna entidad central, incluido el creador, tiene control absoluto sobre los fondos o las reglas críticas sin el consenso de la comunidad.
                        Todas las decisiones importantes se ejecutan mediante contratos inteligentes transparentes.
                    </p>
                </div>

                {/* 2. Poder de Voto */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-purple-500/30 transition-colors">
                    <div className="h-10 w-10 bg-purple-900/20 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                        <ActivityIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">Tu Poder de Voto</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        Tu influencia en el DAO está determinada por:
                        <br />1. <strong>Access Cards (NFT)</strong>: Te otorgan membresía y un voto base.
                        <br />2. <strong>Tokens de Utilidad</strong>: Aumentan tu peso en las votaciones. Más tokens = Más poder.
                        <br />No necesitas ceder la custodia de tus activos para votar.
                    </p>
                </div>

                {/* 3. Propuestas */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-blue-500/30 transition-colors">
                    <div className="h-10 w-10 bg-blue-900/20 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                        <ArrowUpRightIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">Ciclo de una Propuesta</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        1. <strong>Creación</strong>: Un miembro con suficiente poder propone un cambio (On-Chain).
                        <br />2. <strong>Votación</strong>: La comunidad vota (A favor, En contra, Abstención) durante el periodo activo.
                        <br />3. <strong>Ejecución</strong>: Si se aprueba, el contrato "Timelock" espera un periodo de seguridad (2 días) antes de ejecutar el cambio automáticamente.
                    </p>
                </div>

                {/* 4. Tesorería */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-green-500/30 transition-colors">
                    <div className="h-10 w-10 bg-green-900/20 rounded-lg flex items-center justify-center mb-4 text-green-400">
                        <WalletIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">Seguridad de la Tesorería</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        Los fondos del protocolo viven en un contrato inteligente. Nadie puede retirar dinero arbitrariamente.
                        Cualquier movimiento de fondos requiere una propuesta aprobada por la comunidad. Esto previene el fraude y asegura que el capital se use para el crecimiento del proyecto.
                    </p>
                </div>

                {/* 5. Recompensas */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-yellow-500/30 transition-colors">
                    <div className="h-10 w-10 bg-yellow-900/20 rounded-lg flex items-center justify-center mb-4 text-yellow-400">
                        <TrendingUpIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">Recompensas y Utilidad</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        El protocolo incentiva la participación activa. Puedes recibir recompensas por:
                        <br />• Participar en votaciones críticas.
                        <br />• Proveer liquidez o hacer staking de tus activos.
                        <br />Estas recompensas provienen de ingresos del protocolo o distribución programada.
                    </p>
                </div>

                {/* 6. Roles */}
                <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800 hover:border-indigo-500/30 transition-colors">
                    <div className="h-10 w-10 bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4 text-indigo-400">
                        <SettingsIcon className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">Roles y Permisos</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                        <strong>Dueño/Admin:</strong> Puede proponer configuraciones iniciales y gestionar emergencias, pero eventualmente cede control al DAO.
                        <br /><strong>Miembro:</strong> Tiene voz y voto en la dirección del proyecto.
                        <br /><strong>Delegado:</strong> Un miembro al que otros le han confiado su poder de voto.
                    </p>
                </div>
            </div>

            {/* Support Footer */}
            <div className="mt-8 p-6 bg-zinc-800/30 rounded-xl border border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h5 className="font-bold text-white">¿Necesitas más ayuda?</h5>
                    <p className="text-zinc-400 text-sm">Contacta directamente al equipo administrativo del protocolo.</p>
                </div>
                {project.applicant_email && (
                    <a href={`mailto:${project.applicant_email}`} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-lg transition-colors border border-zinc-700">
                        Contactar Soporte
                    </a>
                )}
            </div>
        </div>
    );

    const ManageView = () => {
        if (!isOwner) return <div className="text-red-500">Acceso denegado.</div>;

        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4 mb-4">
                    <SettingsIcon className="w-8 h-8 text-lime-400" />
                    <div>
                        <h3 className="text-2xl font-bold text-white">Administración del DAO</h3>
                        <p className="text-zinc-400">Panel exclusivo para el dueño del protocolo.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Configuración General */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-lime-500/30 transition-colors">
                        <h4 className="font-bold text-white mb-4">Configuración General</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400">Nombre del Token de Gobernanza</span>
                                <span className="text-white">--</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400">Timelock (Retraso)</span>
                                <span className="text-white">2 días</span>
                            </div>
                            <button className="w-full mt-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-colors">
                                Editar Parámetros
                            </button>
                        </div>
                    </div>

                    {/* Gestion de Tesoreria */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-lime-500/30 transition-colors">
                        <h4 className="font-bold text-white mb-4">Gestión de Tesorería</h4>
                        <p className="text-sm text-zinc-400 mb-4">
                            Inicia propuestas para mover fondos de la tesorería o cambiar fees.
                        </p>
                        <button className="w-full py-2 bg-lime-900/20 text-lime-400 border border-lime-500/30 hover:bg-lime-900/30 rounded-lg text-sm transition-colors font-bold">
                            Crear Propuesta de Fondos
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl flex items-start gap-3">
                    <div className="text-blue-400 mt-1">ℹ</div>
                    <p className="text-sm text-blue-200">
                        Como dueño, tus acciones de administración suelen requerir una propuesta On-Chain que debe ser votada por la comunidad,
                        dependiendo de la configuración del Gobernador.
                    </p>
                </div>
            </div>
        );
    };

    // -- Main Render --
    return (
        <div className="flex-1 p-6 md:p-12 min-h-screen">
            <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeView === 'overview' && <OverviewView />}
                {activeView === 'staking' && <StakingView />}
                {activeView === 'proposals' && <ProposalsView />}
                {activeView === 'info' && <InfoView />}
                {activeView === 'manage' && <ManageView />}

                {activeView === 'members' && (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                        <UsersIcon className="w-12 h-12 mb-4 opacity-50" />
                        <p>Directorio de miembros en construcción</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}

// Icon for Members View placeholder
import { UsersIcon } from "lucide-react";

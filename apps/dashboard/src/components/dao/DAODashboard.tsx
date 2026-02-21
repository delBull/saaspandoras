"use client";

import { UserGovernanceList } from "../user/UserGovernanceList";
import { ManageActivities } from "./ManageActivities";
import { ActivitiesList } from "./ActivitiesList";
import { LaboresList } from "./LaboresList";
import { CreateProposalModal } from "./CreateProposalModal";
import { DAOMetrics } from "./DAOMetrics";
import { DAOChat } from "./DAOChat";
import { DAODocs } from "./DAODocs";
import { VoteIcon, Wallet, WalletIcon, TrendingUpIcon, ActivityIcon, ArrowUpRightIcon, HelpCircleIcon, SettingsIcon, LockIcon, ListTodoIcon, TrophyIcon, UsersIcon, InfoIcon, ShieldCheckIcon, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useReadContract, useWalletBalance, useActiveAccount, TransactionButton } from "thirdweb/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getContract, defineChain, sendTransaction, prepareTransaction, prepareContractCall } from "thirdweb";
import { AdminPayouts } from "./AdminPayouts";
import { mintWithSignature } from "thirdweb/extensions/erc20";
import { usePBOXBalance } from "@/hooks/usePBOXBalance";
import { client } from "@/lib/thirdweb-client";
import { toast } from "sonner";
import { useState } from "react";
import { OnChainProposalsList } from "./OnChainProposalsList";

interface DAODashboardProps {
    project: any;
    activeView: string;
    isOwner?: boolean;
}

export function DAODashboard({ project, activeView, isOwner = false }: DAODashboardProps) {
    // Robust Chain ID handling
    const rawChainId = Number((project as any).chainId);
    const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;

    // --- Hooks for Real Data ---
    // --- Hooks for Real Data ---
    // 1. Treasury Balance
    // Base Mainnet USDC Address
    const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const isBaseMainnet = safeChainId === 8453;

    // Hook for Native Balance (Sepolia/ETH)
    const { data: nativeBalance } = useWalletBalance({
        client,
        chain: defineChain(safeChainId),
        address: !isBaseMainnet ? (project.treasuryAddress || project.treasuryContractAddress || "") : "",
    });

    // Hook for USDC Balance (Base)
    const dummyContract = getContract({
        client,
        chain: defineChain(safeChainId),
        address: "0x0000000000000000000000000000000000000000"
    });

    const usdcContract = isBaseMainnet ? getContract({
        client,
        chain: defineChain(safeChainId),
        address: USDC_BASE_ADDRESS
    }) : undefined;

    const { data: usdcBalance } = useReadContract({
        contract: usdcContract || dummyContract,
        method: "function balanceOf(address) view returns (uint256)",
        params: [project.treasuryAddress || project.treasuryContractAddress || "0x0000000000000000000000000000000000000000"],
        queryOptions: { enabled: isBaseMainnet }
    });

    // Determine Display Value
    let formattedBalance = "$0.00";
    console.log("DEBUG: DAO Dashboard Balance Check", { isBaseMainnet, usdcBalance: usdcBalance?.toString(), nativeBalance: nativeBalance?.displayValue, safeChainId });

    if (isBaseMainnet) {
        // USDC has 6 decimals
        const balanceVal = usdcBalance ? Number(usdcBalance) / 1000000 : 0;
        formattedBalance = balanceVal.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    } else {
        // Native ETH
        const balanceVal = nativeBalance ? Number(nativeBalance.displayValue) : 0;
        formattedBalance = `${balanceVal.toFixed(4)} ${safeChainId === 11155111 ? 'SepoliaETH' : 'ETH'}`;
    }

    const treasuryAddress = project.treasuryAddress || project.treasuryContractAddress;

    // 2. Real Data Hooks
    const licenseContract = project.licenseContractAddress ? getContract({
        client,
        chain: defineChain(safeChainId),
        address: project.licenseContractAddress,
    }) : undefined;

    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

    const loomContract = project.loom_contract_address ? getContract({
        client,
        chain: defineChain(safeChainId),
        address: project.loom_contract_address
    }) : undefined;

    // -- Sub-Views --


    const OverviewView = () => (
        <div className="space-y-8">
            {/* Admin Financial Controls (Owner Only) */}
            {isOwner && (
                <div className="bg-zinc-900 border border-yellow-500/20 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <LockIcon className="w-32 h-32 text-yellow-500" />
                    </div>
                    <h3 className="text-yellow-500 font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                        <ShieldCheckIcon className="w-5 h-5" /> Gestión Financiera (Admin)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        {/* Deposit Action */}
                        <div className="bg-black/40 p-4 rounded-lg border border-zinc-800">
                            <h4 className="text-zinc-300 font-medium mb-2 text-sm">Recargar Recompensas</h4>
                            <p className="text-xs text-zinc-500 mb-4">Envía fondos a la tesorería para cubrir recompensas futuras.</p>
                            <div className="space-y-3">
                                <div className="relative">
                                    <Input
                                        type="number"
                                        placeholder="0.0"
                                        className="bg-zinc-900 border-zinc-700 text-white pr-16"
                                        id="deposit-amount"
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-zinc-500 font-bold">
                                        {isBaseMainnet ? 'ETH' : 'ETH'}
                                    </span>
                                </div>
                                <TransactionButton
                                    transaction={() => {
                                        const amountInput = document.getElementById('deposit-amount') as HTMLInputElement;
                                        const amount = amountInput?.value || "0";
                                        if (Number(amount) <= 0) throw new Error("Monto inválido");

                                        return prepareTransaction({
                                            to: project.treasuryAddress || project.treasuryContractAddress,
                                            value: BigInt(Math.floor(Number(amount) * 1e18)),
                                            chain: defineChain(safeChainId),
                                            client: client
                                        });
                                    }}
                                    onTransactionConfirmed={() => {
                                        toast.success("Fondos depositados correctamente");
                                        const amountInput = document.getElementById('deposit-amount') as HTMLInputElement;
                                        if (amountInput) amountInput.value = "";
                                    }}
                                    onError={(e) => toast.error("Error al depositar: " + e.message)}
                                    className="!w-full !bg-zinc-800 hover:!bg-zinc-700 !text-white !text-xs !py-3"
                                >
                                    Depositar Fondos (Real)
                                </TransactionButton>
                            </div>
                        </div>

                        {/* Withdraw Action */}
                        <div className="bg-black/40 p-4 rounded-lg border border-zinc-800">
                            <h4 className="text-zinc-300 font-medium mb-2 text-sm">Retirar Capital Inicial</h4>
                            <p className="text-xs text-zinc-500 mb-4">Libera fondos iniciales si se han cumplido los hitos de venta.</p>
                            {loomContract ? (
                                <TransactionButton
                                    transaction={() => prepareContractCall({
                                        contract: loomContract,
                                        method: "function releaseInitialCapital()",
                                        params: []
                                    })}
                                    onTransactionConfirmed={() => toast.success("Capital liberado (si era elegible)")}
                                    onError={(e) => toast.error("Error: " + e.message)}
                                    className="!w-full !bg-yellow-500/10 hover:!bg-yellow-500/20 !text-yellow-500 !border !border-yellow-500/50 !text-xs !py-3"
                                >
                                    Liberar Capital
                                </TransactionButton>
                            ) : (
                                <button disabled className="w-full bg-zinc-800 text-zinc-500 text-xs py-3 rounded-lg cursor-not-allowed">
                                    Contrato no disponible
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Treasury Card */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-lime-500/10 rounded-lg">
                            <WalletIcon className="w-5 h-5 text-lime-400" />
                        </div>
                        <div>
                            <span className="text-zinc-400 text-sm font-medium">Tesorería DAO</span>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`https://${isBaseMainnet ? 'basescan.org' : 'sepolia.etherscan.io'}/address/${treasuryAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-zinc-500 hover:text-lime-400 transition-colors flex items-center gap-1"
                                >
                                    {treasuryAddress?.slice(0, 6)}...{treasuryAddress?.slice(-4)}
                                    <ArrowUpRightIcon className="w-3 h-3" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <span className="text-2xl font-bold text-white font-mono">{formattedBalance}</span>
                        <p className="text-xs text-zinc-500">
                            {isBaseMainnet ? 'Balance en USDC (Base)' : 'Balance Nativo (Sepolia)'}
                        </p>
                    </div>
                </div>

                {/* DAO Members Metric */}
                {licenseContract ? (
                    <DAOMetrics licenseContract={licenseContract} />
                ) : (
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <VoteIcon className="w-24 h-24 text-zinc-700" />
                        </div>
                        <p className="text-zinc-400 text-sm font-medium mb-1">Miembros del DAO</p>
                        <h3 className="text-3xl font-bold text-white font-mono">--</h3>
                        <div className="mt-4 flex items-center text-xs text-zinc-600">
                            <ActivityIcon className="w-3 h-3 mr-1" />
                            Holders de Access Cards
                        </div>

                        <div className="mt-4 relative z-10">
                            <AdminPayouts
                                projectId={project.id}
                                project={project}
                                safeChainId={safeChainId}
                            />
                        </div>
                    </div>
                )}

                {/* Rewards Metric */}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold text-white mb-6">Nuevas Tareas (Recompensas)</h3>
                    <ActivitiesList projectId={Number(project.id)} compact limit={3} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-6">Actividad de Gobernanza</h3>
                    <UserGovernanceList projectIds={[Number(project.id)]} />
                </div>
            </div>
        </div>
    );

    const StakingView = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TrendingUpIcon className="w-6 h-6 text-lime-400" />
                        Utilidad y Labores
                    </h3>
                    <p className="text-zinc-400 mt-1">Realiza staking de tus artefactos o cumple misiones para ganar recompensas.</p>
                </div>
            </div>

            <LaboresList project={project} />
        </div>
    );

    const ProposalsView = () => (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Gobernanza del DAO</h3>
                {isOwner && (
                    <button
                        onClick={() => setIsProposalModalOpen(true)}
                        className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black text-sm font-bold rounded-lg transition-colors shadow-lg shadow-lime-500/10"
                    >
                        + Nueva Propuesta
                    </button>
                )}
            </div>

            {/* 1. On-Chain Proposals (Formal) */}
            {project.governorContractAddress ? (
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4" /> Propuestas On-Chain (Vinculantes)
                    </h4>
                    <OnChainProposalsList
                        votingContractAddress={project.governorContractAddress}
                        chainId={safeChainId}
                    />
                </div>
            ) : (
                <div className="bg-yellow-900/20 border border-yellow-500/30 text-yellow-400 p-4 rounded-xl text-sm">
                    Este proyecto no tiene un contrato de votación configurado. Las propuestas serán off-chain.
                </div>
            )}

            {/* 2. Off-Chain / Signaling (Informal) */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Discusiones & Señalización
                </h4>
                <UserGovernanceList projectIds={[Number(project.id)]} />
            </div>
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

            {/* Support Footer REMOVED as per request */}
        </div>
    );

    const ActivitiesAdminView = () => {
        if (!isOwner) return <div className="text-red-500">Acceso denegado.</div>;
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ListTodoIcon className="w-6 h-6 text-lime-400" />
                        Gestor de Misiones
                    </h3>
                    <p className="text-zinc-400 mt-1">Crea, edita y administra las misiones disponibles para la comunidad.</p>
                </div>
                <ManageActivities projectId={Number(project.id)} />
            </div>
        );
    };

    const ManageView = () => {
        if (!isOwner) return <div className="text-red-500">Acceso denegado.</div>;

        return (
            <div className="space-y-8">
                <div className="flex items-center gap-4 mb-4">
                    <SettingsIcon className="w-8 h-8 text-lime-400" />
                    <div>
                        <h3 className="text-2xl font-bold text-white">Configuración del DAO</h3>
                        <p className="text-zinc-400">Panel administrativo general.</p>
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

                    {/* Gamificación DAO */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-lime-500/30 transition-colors">
                        <h4 className="font-bold text-white mb-4">Incentivos & Gamificación</h4>
                        <p className="text-sm text-zinc-400 mb-4">
                            Activa el sistema de logros para recompensar a tu comunidad por su participación.
                        </p>
                        <button
                            onClick={() => {
                                fetch('/api/gamification/track-event', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        eventType: 'dao_activated',
                                        metadata: { project: project?.slug || project?.id }
                                    })
                                })
                                    .then(() => toast.success("¡Sistema de Gamificación Activado!", { description: "Has desbloqueado el logro 'Pionero DAO'." }))
                                    .catch(e => console.error(e));
                            }}
                            className="w-full py-2 bg-purple-900/20 text-purple-400 border border-purple-500/30 hover:bg-purple-900/30 rounded-lg text-sm transition-colors font-bold"
                        >
                            Activar Sistema de Logros
                        </button>
                    </div>

                    {/* Gestion de Tesoreria */}
                    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-lime-500/30 transition-colors">
                        <h4 className="font-bold text-white mb-4">Gestión de Tesorería</h4>
                        <p className="text-sm text-zinc-400 mb-4">
                            Inicia propuestas para mover fondos de la tesorería o cambiar fees.
                        </p>
                        <button
                            onClick={() => setIsProposalModalOpen(true)}
                            className="w-full py-2 bg-lime-900/20 text-lime-400 border border-lime-500/30 hover:bg-lime-900/30 rounded-lg text-sm transition-colors font-bold"
                        >
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

    // --- PBOX Redemption Logic ---
    const account = useActiveAccount();
    const { balance: pboxBalance, mutate: refreshBalance } = usePBOXBalance(account?.address);
    const [isRedeemOpen, setIsRedeemOpen] = useState(false);
    const [redeemAmount, setRedeemAmount] = useState("");
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [redemptionType, setRedemptionType] = useState<'CRYPTO' | 'TOKEN'>('CRYPTO');

    const handleRedeem = async () => {
        if (!account) return;
        setIsRedeeming(true);
        try {
            const outputToken = redemptionType === 'TOKEN' ? 'PBOX_GOV' : 'USDC';

            const res = await fetch("/api/dao/redemption", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userAddress: account.address,
                    amount: redeemAmount,
                    outputToken
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Redemption failed");

            if (data.signature && data.payload) {
                // Execute Minting on Client
                const pboxContract = getContract({
                    client,
                    chain: defineChain(process.env.NODE_ENV === 'production' ? 8453 : 11155111),
                    address: process.env.NEXT_PUBLIC_PBOX_TOKEN_ADDRESS || ""
                });

                // Execute Signature Mint
                const transaction = mintWithSignature({
                    contract: pboxContract,
                    payload: data.payload,
                    signature: data.signature
                });

                await sendTransaction({
                    transaction,
                    account
                });

                toast.success(`Canjeado exitosamente! Has recibido ${redeemAmount} $PBOX`);
            } else {
                toast.success(`Canjeado exitosamente! Recibirás ${data.payout} ${data.symbol}`);
            }
            setIsRedeemOpen(false);
            setRedeemAmount("");
            refreshBalance();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsRedeeming(false);
        }
    };

    const ActivitiesView = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ListTodoIcon className="w-6 h-6 text-lime-400" />
                        Actividades & Recompensas
                    </h3>
                    <p className="text-zinc-400 mt-1">Completa tareas para ganar recompensas y reputación en el DAO.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-700 flex items-center gap-2">
                        <TrophyIcon className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-zinc-300">Mis Puntos: <span className="text-white font-bold font-mono">{Number(pboxBalance).toFixed(0)} PBOX</span></span>
                    </div>

                    <Dialog open={isRedeemOpen} onOpenChange={setIsRedeemOpen}>
                        <DialogTrigger asChild>
                            <button className="px-4 py-2 bg-gradient-to-r from-lime-500 to-green-600 text-black text-sm font-bold rounded-lg shadow-lg hover:shadow-lime-500/20 transition-all flex items-center gap-2">
                                <WalletIcon className="w-4 h-4" />
                                Canjear
                            </button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                            <DialogHeader>
                                <DialogTitle>Canjear PBOX</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="flex bg-zinc-950 p-1 rounded-lg">
                                    <button
                                        onClick={() => setRedemptionType('CRYPTO')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${redemptionType === 'CRYPTO' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        Crypto (USDC/ETH)
                                    </button>
                                    <button
                                        onClick={() => setRedemptionType('TOKEN')}
                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${redemptionType === 'TOKEN' ? 'bg-zinc-800 text-lime-400 shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                                    >
                                        $PBOX (Governance)
                                    </button>
                                </div>

                                <p className="text-sm text-zinc-400">
                                    {redemptionType === 'CRYPTO'
                                        ? <span>Convierte puntos en dinero real.<br />Tasa: <span className="text-lime-400">100 PBOX = 1 USDC</span></span>
                                        : <span>Obtén poder de voto en el DAO.<br />Tasa: <span className="text-lime-400">1 PBOX = 1 $PBOX</span></span>
                                    }
                                </p>

                                <div className="space-y-2">
                                    <Label>Cantidad a Canjear</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            className="bg-zinc-800 border-zinc-700 pr-16"
                                            placeholder="0"
                                            value={redeemAmount}
                                            onChange={(e) => setRedeemAmount(e.target.value)}
                                        />
                                        <button
                                            onClick={() => setRedeemAmount(Number(pboxBalance).toString())}
                                            className="absolute right-2 top-2 text-xs text-lime-400 font-bold hover:text-lime-300"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500 text-right">Disponible: {Number(pboxBalance).toFixed(2)} PBOX</p>
                                </div>
                                <div className="p-3 bg-zinc-950 rounded-lg flex justify-between items-center text-sm">
                                    <span className="text-zinc-400">Recibirás (Estimado):</span>
                                    <span className="font-mono font-bold text-white">
                                        {redemptionType === 'CRYPTO'
                                            ? `${(Number(redeemAmount || 0) * 0.01).toFixed(2)} ${process.env.NODE_ENV === 'production' ? 'USDC' : 'ETH'}`
                                            : `${Number(redeemAmount || 0)} $PBOX`
                                        }
                                    </span>
                                </div>
                                <button
                                    onClick={handleRedeem}
                                    disabled={isRedeeming || Number(redeemAmount) <= 0 || Number(redeemAmount) > Number(pboxBalance)}
                                    className="w-full bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isRedeeming ? "Procesando..." : "Confirmar Canje"}
                                </button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <ActivitiesList projectId={Number(project.id)} />
        </div>
    );

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
                {activeView === 'activities' && <ActivitiesView />}
                {activeView === 'activities_admin' && <ActivitiesAdminView />}
                {activeView === 'chat' && <DAOChat project={project} isOwner={isOwner} />}
                {activeView === 'staking' && <StakingView />}
                {activeView === 'proposals' && <ProposalsView />}
                {activeView === 'info' && <InfoView />}
                {activeView === 'manage' && <ManageView />}
                {activeView === 'docs' && <DAODocs />}

                {activeView === 'members' && (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                        <UsersIcon className="w-12 h-12 mb-4 opacity-50" />
                        <p>Directorio de miembros en construcción</p>
                    </div>
                )}

            </motion.div>

            <CreateProposalModal
                projectId={Number(project.id)}
                isOpen={isProposalModalOpen}
                onClose={() => setIsProposalModalOpen(false)}
                onCreated={() => {
                    // Refetch data if needed (SWR handles it automatically if we revalidate, but simple close is fine)
                    toast.success("Propuesta registrada.");
                }}
                votingContractAddress={project.governorContractAddress}
                chainId={safeChainId}
            />
        </div>
    );
}

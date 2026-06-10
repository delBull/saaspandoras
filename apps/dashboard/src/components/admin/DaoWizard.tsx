'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ScaleIcon,
    ExclamationTriangleIcon,
    PencilSquareIcon,
    CheckCircleIcon,
    ClockIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    BanknotesIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    PlusIcon,
    FireIcon,
    InformationCircleIcon,
    CalendarDaysIcon,
    TrophyIcon,
    Cog8ToothIcon
} from '@heroicons/react/24/outline';
import { GovernanceCalendar } from './GovernanceCalendar';
import { SimpleTooltip } from '../ui/simple-tooltip';
import { defineChain, getContract, prepareContractCall } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { useSendTransaction, TransactionButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { W2EUtilityABI } from "@/lib/abi/W2EUtility";
import { encodeFunctionData } from "viem";
import { toast } from 'sonner';


interface DaoWizardProps {
    project: any; // ProjectData
    governorAddress?: string;
    onClose?: () => void;
}

export default function DaoWizard({ project, governorAddress, onClose }: DaoWizardProps) {
    const [activeMode, setActiveMode] = useState<'list' | 'proposal' | 'rules' | 'mechanics' | 'emergency' | 'calendar' | 'missions' | 'settings'>('list');
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [rules, setRules] = useState({
        quorum: project.w2eConfig?.quorumPercentage || 10,
        votingPeriod: project.w2eConfig?.votingPeriodHours || 168,
        emergencyPeriod: project.w2eConfig?.emergencyPeriodHours || 360,
    });

    const [proposal, setProposal] = useState({
        title: '',
        description: '',
        target: '',
        value: 0,
        calldata: ''
    });

    const [mechanics, setMechanics] = useState({
        currentAPY: 500, // Read from Contract
        royaltyBPS: 500,
        transactionFee: 50
    });

    // --- Governance Logic (Thirdweb v5) ---
    const { mutate: sendTransaction } = useSendTransaction();

    // 1. Contracts
    const chain = defineChain(sepolia.id); // TODO: Dynamic Chain ID from project config

    // Utility Contract (Target for Mechanics)
    const utilityContract = getContract({
        client,
        chain,
        address: project.utilityContractAddress || project.w2eConfig?.utilityToken?.address || "0x0000000000000000000000000000000000000000"
    });

    // License Contract (Target for Royalties)
    const licenseContract = getContract({
        client,
        chain,
        address: project.contractAddress || project.w2eConfig?.licenseToken?.address || "0x0000000000000000000000000000000000000000"
    });

    // Governor Contract (Executor)
    const governorContract = getContract({
        client,
        chain,
        address: governorAddress || "0x0000000000000000000000000000000000000000" // Use passed prop
    });


    // 2. Proposal Logic for Mechanics
    const handleProposeMechanics = () => {
        // Example: Update Phase 1 APY (Assuming modifying Schedule for Phase 1)
        // Note: Real logic would likely propose a batch or specific phase update.
        // But Phase Schedule is per-phase. Let's say we want to update Phase 1.

        // Encode "setPhaseSchedule(1, newAPY)"
        const callData = encodeFunctionData({
            abi: W2EUtilityABI as any,
            functionName: "setPhaseSchedule",
            args: [BigInt(1), BigInt(mechanics.currentAPY)] // Updating Phase 1 for demo
        });

        // Create Proposal on Governor
        // Governor.propose(targets[], values[], calldatas[], description)

        // This button will likely be inside the TransactionButton component,
        // so we return the prepared transaction.
        return prepareContractCall({
            contract: governorContract,
            method: "function propose(address[], uint256[], bytes[], string) returns (uint256)",
            params: [
                [project.utilityContractAddress || ""], // targets
                [BigInt(0)], // values
                [callData], // calldatas
                `Update Economic Schedule: Phase 1 APY to ${(mechanics.currentAPY / 100)}%` // description
            ]
        });
    };

    const handleSubmitMechanics = (e: React.FormEvent) => {
        e.preventDefault();
        // UI simulation for now if contracts aren't ready
        console.log("Proposing mechanics change:", mechanics);
    };

    const handleSubmitRules = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate contract write
        new Promise(r => setTimeout(r, 1500));
        setIsLoading(false);
        // In real app: call contract.setGovernanceRules(rules.quorum, rules.votingPeriod * 3600, ...)
    };

    const handleCreateProposal = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1500));
        setIsLoading(false);
    };

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <ScaleIcon className="w-6 h-6 text-purple-500" />
                        Admin. de Gobernanza
                    </h3>
                    <p className="text-sm text-gray-400">Gestiona los parámetros y propuestas de la DAO</p>
                </div>
            </div>

            <div className="flex border-b border-zinc-800">
                <button
                    onClick={() => setActiveMode('proposal')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeMode === 'proposal' ? 'border-purple-500 text-purple-400 bg-purple-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <PencilSquareIcon className="w-4 h-4" />
                        Nueva Propuesta
                    </div>
                </button>
                <button
                    onClick={() => setActiveMode('rules')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeMode === 'rules' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <CheckCircleIcon className="w-4 h-4" />
                        Reglas DAO
                    </div>
                </button>
                <button
                    onClick={() => setActiveMode('mechanics')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeMode === 'mechanics' ? 'border-green-500 text-green-400 bg-green-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <BanknotesIcon className="w-4 h-4" />
                        Mecánica W2E
                    </div>
                </button>
                <button
                    onClick={() => setActiveMode('emergency')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeMode === 'emergency' ? 'border-red-500 text-red-400 bg-red-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4" />
                        Emergencia
                    </div>
                </button>
                <button
                    onClick={() => setActiveMode('calendar')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeMode === 'calendar' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <CalendarDaysIcon className="w-4 h-4" />
                        Calendario
                    </div>
                </button>
                <button
                    onClick={() => setActiveMode('missions')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeMode === 'missions' ? 'border-orange-500 text-orange-400 bg-orange-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <TrophyIcon className="w-4 h-4" />
                        Misiones
                    </div>
                </button>
                <button
                    onClick={() => setActiveMode('settings')}
                    className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeMode === 'settings' ? 'border-zinc-300 text-zinc-200 bg-zinc-500/5' : 'border-transparent text-gray-400 hover:text-white hover:bg-zinc-800'
                        }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Cog8ToothIcon className="w-4 h-4" />
                        Configuración
                    </div>
                </button>
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {activeMode === 'proposal' && (
                        <motion.div
                            key="proposal"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <form onSubmit={handleCreateProposal} className="space-y-4">
                                <div>
                                    <label htmlFor="proposal-title" className="block text-sm font-medium text-gray-400 mb-1">Título de la Propuesta</label>
                                    <input
                                        id="proposal-title"
                                        type="text"
                                        placeholder="Ej: Aumentar recompensas de staking"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={proposal.title}
                                        onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="proposal-desc" className="block text-sm font-medium text-gray-400 mb-1">Descripción</label>
                                    <textarea
                                        id="proposal-desc"
                                        placeholder="Detalla los cambios propuestos..."
                                        rows={4}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={proposal.description}
                                        onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="proposal-target" className="block text-sm font-medium text-gray-400 mb-1">Contrato Objetivo (Opcional)</label>
                                        <input
                                            id="proposal-target"
                                            type="text"
                                            placeholder="0x..."
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                                            value={proposal.target}
                                            onChange={(e) => setProposal({ ...proposal, target: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="proposal-value" className="block text-sm font-medium text-gray-400 mb-1">Valor ETH (Wei)</label>
                                        <input
                                            id="proposal-value"
                                            type="number"
                                            placeholder="0"
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white font-mono text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                                            value={proposal.value}
                                            onChange={(e) => setProposal({ ...proposal, value: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors flex justify-center gap-2 items-center"
                                >
                                    {isLoading ? 'Creando...' : 'Publicar Propuesta (On-Chain)'}
                                    {!isLoading && <PencilSquareIcon className="w-4 h-4" />}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {activeMode === 'rules' && (
                        <motion.div
                            key="rules"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg flex gap-3 text-blue-300 text-sm">
                                <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
                                <p>
                                    Cualquier cambio en las reglas de gobernanza requiere una votación exitosa de la DAO para ser aplicado.
                                </p>
                            </div>

                            <form onSubmit={handleSubmitRules} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Quorum */}
                                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                                        <div className="flex items-center gap-2 text-white font-medium mb-3">
                                            <UserGroupIcon className="w-5 h-5 text-blue-400" />
                                            Quorum Mínimo (%)
                                            <SimpleTooltip content="Porcentaje mínimo de tokens requeridos para que una votación sea válida.">
                                                <InformationCircleIcon className="w-4 h-4 text-gray-500 hover:text-white transition-colors cursor-help" />
                                            </SimpleTooltip>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="1"
                                                max="100"
                                                value={rules.quorum}
                                                onChange={(e) => setRules({ ...rules, quorum: Number(e.target.value) })}
                                                className="w-full accent-blue-500"
                                            />
                                            <span className="w-12 text-right font-mono text-white">{rules.quorum}%</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Porcentaje mínimo de tokens requeridos para validar una votación.
                                        </p>
                                    </div>

                                    {/* Voting Period */}
                                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                                        <div className="flex items-center gap-2 text-white font-medium mb-3">
                                            <ClockIcon className="w-5 h-5 text-blue-400" />
                                            Periodo de Votación (Horas)
                                        </div>
                                        <input
                                            type="number"
                                            value={rules.votingPeriod}
                                            onChange={(e) => setRules({ ...rules, votingPeriod: Number(e.target.value) })}
                                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-right font-mono"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Duración de las votaciones regulares ({Math.round(rules.votingPeriod / 24)} días).
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                                >
                                    {isLoading ? 'Solicitando...' : 'Proponer Actualización de Reglas'}
                                </button>
                            </form>
                        </motion.div>
                    )}

                    {activeMode === 'mechanics' && (
                        <motion.div
                            key="mechanics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="bg-green-900/20 border border-green-900/50 p-4 rounded-lg flex gap-3 text-green-300 text-sm">
                                <ChartBarIcon className="w-5 h-5 flex-shrink-0" />
                                <p>
                                    Configura los incentivos económicos y regalías del protocolo. (Requiere aprobación DAO).
                                </p>
                            </div>

                            <form onSubmit={handleSubmitMechanics} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Staking APY (Scheduled) */}
                                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 relative overflow-hidden">
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <span className="bg-blue-500/20 text-blue-300 text-[10px] px-2 py-1 rounded-full border border-blue-500/30">
                                                Fase Actual: 1
                                            </span>
                                            <span className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-1 rounded-full border border-purple-500/30 font-bold">
                                                FIXED
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white font-medium mb-3">
                                            <BanknotesIcon className="w-5 h-5 text-green-400" />
                                            Staking APY (Programado)
                                        </div>
                                        <div className="flex items-center justify-between mt-4">
                                            <span className="text-3xl font-mono text-white font-bold">
                                                {(mechanics.currentAPY / 100).toFixed(1)}%
                                            </span>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500">Próxima Fase</div>
                                                <div className="text-sm font-mono text-gray-300">10.0%</div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Definido por Cronograma Económico. (Solo Autoridad Pandora puede modificar).
                                        </p>
                                    </div>

                                    {/* Royalties */}
                                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                                        <div className="flex items-center gap-2 text-white font-medium mb-3">
                                            <CurrencyDollarIcon className="w-5 h-5 text-purple-400" />
                                            Regalías (Mercado Secundario)
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="0"
                                                max="1000"
                                                step="50"
                                                value={mechanics.royaltyBPS}
                                                onChange={(e) => setMechanics({ ...mechanics, royaltyBPS: Number(e.target.value) })}
                                                className="w-full accent-purple-500"
                                            />
                                            <span className="w-16 text-right font-mono text-white">{(mechanics.royaltyBPS / 100).toFixed(1)}%</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Comisión por venta futura de Licencias y Artefactos.
                                        </p>
                                    </div>

                                    {/* Transaction Fee */}
                                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700 col-span-2">
                                        <div className="flex items-center gap-2 text-white font-medium mb-3">
                                            <ScaleIcon className="w-5 h-5 text-yellow-400" />
                                            Tax de Transacción (Token Utility)
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="range"
                                                min="0"
                                                max="500"
                                                step="10"
                                                value={mechanics.transactionFee}
                                                onChange={(e) => setMechanics({ ...mechanics, transactionFee: Number(e.target.value) })}
                                                className="w-full accent-yellow-500"
                                            />
                                            <span className="w-16 text-right font-mono text-white">{(mechanics.transactionFee / 100).toFixed(2)}%</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Quema o redistribución en cada transferencia de tokens. (Deflacionario).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-700/50">
                                    <button
                                        type="button"
                                        onClick={() => setActiveMode('list')}
                                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                    >
                                        Cancelar
                                    </button>

                                    {/* Real Governance Button */}
                                    <TransactionButton
                                        transaction={() => {
                                            // 1. Encode "setPhaseSchedule(1, newAPY)"
                                            const callData = encodeFunctionData({
                                                abi: W2EUtilityABI as any,
                                                functionName: "setPhaseSchedule",
                                                args: [BigInt(1), BigInt(mechanics.currentAPY)] // Updating Phase 1 for demo
                                            });

                                            // 2. Return Proposal Transaction
                                            return prepareContractCall({
                                                contract: governorContract,
                                                method: "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
                                                params: [
                                                    [project.utilityContractAddress || "0x0000000000000000000000000000000000000000"], // targets
                                                    [BigInt(0)], // values
                                                    [callData], // calldatas
                                                    `Update Economic Schedule: Phase 1 APY to ${(mechanics.currentAPY / 100)}%` // description
                                                ]
                                            });
                                        }}
                                        onTransactionConfirmed={(tx) => {
                                            console.log("Proposal Created:", tx);
                                            alert("Propuesta de Gobernanza Creada Exitosamente!");
                                            setActiveMode('list');
                                        }}
                                        onError={(error) => {
                                            console.error("Proposal Failed:", error);
                                            alert("Error al crear la propuesta. Verifica que tienes tokens de voto.");
                                        }}
                                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/20"
                                    >
                                        Proponer Cambios (DAO)
                                    </TransactionButton>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {activeMode === 'emergency' && (
                        <motion.div
                            key="emergency"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-lg flex gap-3 text-red-300 text-sm">
                                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                                <p>
                                    <strong>Zona de Peligro:</strong> Las acciones de emergencia bypassan la votación regular pero requieren un quorum especial y solo se activan tras inactividad prolongada.
                                </p>
                            </div>

                            <div className="bg-zinc-800 p-6 rounded-lg border border-red-900/30">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5 text-green-500" />
                                    Estado de Seguridad
                                </h4>
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Estado del Protocolo</span>
                                        <span className="text-green-400 font-mono">ACTIVO</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Última Actividad DAO</span>
                                        <span className="text-white font-mono">Hace 2 horas</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Periodo de Emergencia</span>
                                        <span className="text-red-400 font-mono">{project.w2eConfig?.emergencyPeriodHours || 360} horas</span>
                                    </div>
                                </div>

                                <button
                                    disabled={true}
                                    className="w-full py-3 bg-zinc-700 text-gray-500 cursor-not-allowed font-bold rounded-lg flex items-center justify-center gap-2"
                                >
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    Liberación de Emergencia (No Disponible)
                                </button>
                                <p className="text-xs text-center text-gray-500 mt-2">
                                    Esta acción solo se habilita si el protocolo detecta inactividad total superior al periodo de emergencia.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {activeMode === 'missions' && (
                        <motion.div
                            key="missions"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="bg-orange-900/20 border border-orange-900/50 p-4 rounded-lg flex gap-3 text-orange-300 text-sm">
                                <TrophyIcon className="w-5 h-5 flex-shrink-0" />
                                <p>
                                    <strong>Gestor de Misiones:</strong> Crea, edita y administra las misiones disponibles para la comunidad (Gamificación & Incentivos).
                                </p>
                            </div>

                            <div className="flex justify-between items-center">
                                <h4 className="text-white font-bold">Plantillas Rápidas</h4>
                                <button className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-2">
                                    <PlusIcon className="w-4 h-4" /> Nueva Actividad
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-orange-500/50 transition-colors cursor-pointer">
                                    <h5 className="font-bold text-white mb-1">Misión Social</h5>
                                    <p className="text-xs text-orange-400 font-mono">10 PBOX • Única</p>
                                    <p className="text-xs text-zinc-500 mt-2">Seguimiento en redes, likes, RTs.</p>
                                </div>
                                <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-orange-500/50 transition-colors cursor-pointer">
                                    <h5 className="font-bold text-white mb-1">Labor Semanal</h5>
                                    <p className="text-xs text-orange-400 font-mono">50 PBOX • 7 Días</p>
                                    <p className="text-xs text-zinc-500 mt-2">Creación de contenido o promoción.</p>
                                </div>
                                <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-orange-500/50 transition-colors cursor-pointer">
                                    <h5 className="font-bold text-white mb-1">Staking</h5>
                                    <p className="text-xs text-orange-400 font-mono">Variable • Dinámica</p>
                                    <p className="text-xs text-zinc-500 mt-2">Bloqueo de liquidez a cambio de rendimientos.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeMode === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            <div className="bg-zinc-800 p-6 rounded-lg border border-zinc-700">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Cog8ToothIcon className="w-5 h-5 text-zinc-400" />
                                    Configuración del DAO
                                </h4>
                                
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-zinc-900/50 p-4 rounded-lg">
                                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Nombre del Token de Gobernanza</p>
                                            <p className="text-white font-mono text-lg">{project.w2eConfig?.utilityToken?.symbol || '--'}</p>
                                        </div>
                                        <div className="bg-zinc-900/50 p-4 rounded-lg">
                                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Timelock (Retraso)</p>
                                            <p className="text-white font-mono text-lg">2 Días</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-zinc-700/50 pt-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-bold">Incentivos & Gamificación</p>
                                            <p className="text-xs text-zinc-400">Activa el sistema de logros para recompensar a tu comunidad por su participación.</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                toast.success("Sistema de Logros activado");
                                            }}
                                            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-sm transition-colors font-bold border border-zinc-600"
                                        >
                                            Activar Sistema de Logros
                                        </button>
                                    </div>

                                    <div className="border-t border-zinc-700/50 pt-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-bold">Gestión de Tesorería</p>
                                            <p className="text-xs text-zinc-400">Inicia propuestas para mover fondos de la tesorería o cambiar fees.</p>
                                        </div>
                                        <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors font-bold shadow-[0_0_15px_rgba(52,211,153,0.3)] border border-emerald-500/50">
                                            Crear Propuesta de Fondos
                                        </button>
                                    </div>

                                    <div className="border-t border-zinc-700/50 pt-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-bold">Sincronización de Datos</p>
                                            <p className="text-xs text-zinc-400">Recalcula miembros y poder de voto desde el historial de eventos. Útil para backfills.</p>
                                        </div>
                                        <button 
                                            onClick={async () => {
                                                setIsLoading(true);
                                                try {
                                                    const res = await fetch(`/api/v1/projects/${project.id}/admin/sync-dao`, {
                                                        method: 'POST'
                                                    });
                                                    const data = await res.json();
                                                    if (res.ok) {
                                                        toast.success(data.message || "Miembros sincronizados correctamente");
                                                    } else {
                                                        toast.error(data.error || "Error al sincronizar miembros");
                                                    }
                                                } catch (e) {
                                                    toast.error("Error de red");
                                                } finally {
                                                    setIsLoading(false);
                                                }
                                            }}
                                            disabled={isLoading}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm transition-colors font-bold shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-500/50"
                                        >
                                            {isLoading ? 'Sincronizando...' : 'Sincronizar Miembros Ahora'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

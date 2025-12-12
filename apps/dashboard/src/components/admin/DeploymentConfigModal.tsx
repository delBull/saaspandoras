'use client';

import React, { useState } from 'react';
import type { DeploymentConfig, UtilityPhase, TokenomicsConfig } from '@/types/deployment';
import { DEFAULT_PHASES, DEFAULT_TOKENOMICS } from '@/types/deployment';

interface DeploymentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: DeploymentConfig) => Promise<void>;
    projectTitle: string;
    isLoading?: boolean;
}

export function DeploymentConfigModal({
    isOpen,
    onClose,
    onConfirm,
    projectTitle,
    isLoading = false
}: DeploymentConfigModalProps) {
    const [phases, setPhases] = useState<UtilityPhase[]>(DEFAULT_PHASES);
    const [tokenomics, setTokenomics] = useState<TokenomicsConfig>(DEFAULT_TOKENOMICS);
    const [accessCardImage, setAccessCardImage] = useState<string>('');

    if (!isOpen) return null;

    const handlePhaseChange = (id: string, field: keyof UtilityPhase, value: string | number | boolean) => {
        setPhases(prev => prev.map(p => {
            if (p.id !== id) return p;
            return { ...p, [field]: value };
        }));
    };

    const handleTokenomicsChange = (field: keyof TokenomicsConfig, value: number) => {
        setTokenomics(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            phases,
            tokenomics,
            accessCardImage: accessCardImage || undefined
        });
    };

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🚀 Configurar Despliegue: <span className="text-lime-400">{projectTitle}</span>
                        </h2>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Utility Phases */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm">1</span>
                                    Fases de Utilidad
                                </h3>
                                <span className="text-xs text-gray-400">Define las etapas de venta</span>
                            </div>

                            <div className="space-y-3">
                                {phases.map((phase) => (
                                    <div key={phase.id} className={`p-4 rounded-lg border transition-all ${phase.isActive ? 'bg-zinc-800/50 border-indigo-500/30' : 'bg-zinc-900 border-zinc-800 opacity-60'}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <input
                                                type="checkbox"
                                                checked={phase.isActive}
                                                onChange={(e) => handlePhaseChange(phase.id, 'isActive', e.target.checked)}
                                                className="w-5 h-5 rounded border-zinc-600 text-indigo-500 focus:ring-indigo-500 bg-zinc-700"
                                                id={`phase-${phase.id}`}
                                            />
                                            <label htmlFor={`phase-${phase.id}`} className="font-medium text-white flex-1 cursor-pointer">
                                                {phase.name}
                                            </label>
                                            <span className="text-xs bg-zinc-700 px-2 py-1 rounded text-gray-300">
                                                ID: {phase.id}
                                            </span>
                                        </div>

                                        {phase.isActive && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-8">
                                                <div>
                                                    <label htmlFor={`phase-type-${phase.id}`} className="block text-xs text-gray-400 mb-1">Tipo de Regla</label>
                                                    <select
                                                        id={`phase-type-${phase.id}`}
                                                        value={phase.type}
                                                        onChange={(e) => handlePhaseChange(phase.id, 'type', e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                    >
                                                        <option value="time">⏳ Tiempo (Días)</option>
                                                        <option value="amount">💰 Monto (USD Recaudado)</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label htmlFor={`phase-limit-${phase.id}`} className="block text-xs text-gray-400 mb-1">
                                                        {phase.type === 'time' ? 'Duración (Días)' : 'Objetivo (USD)'}
                                                    </label>
                                                    <input
                                                        id={`phase-limit-${phase.id}`}
                                                        type="number"
                                                        min="1"
                                                        value={phase.limit}
                                                        onChange={(e) => handlePhaseChange(phase.id, 'limit', Number(e.target.value))}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Tokenomics */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">2</span>
                                Tokenomics & Gobernanza
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label htmlFor="token-supply" className="block text-xs text-gray-400 mb-1">Suministro Inicial (Tokens)</label>
                                    <input
                                        id="token-supply"
                                        type="number"
                                        min="1"
                                        value={tokenomics.initialSupply}
                                        onChange={(e) => handleTokenomicsChange('initialSupply', Number(e.target.value))}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="token-price" className="block text-xs text-gray-400 mb-1">Precio Inicial (USD)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                        <input
                                            id="token-price"
                                            type="number"
                                            min="0.000001"
                                            step="0.000001"
                                            value={tokenomics.price}
                                            onChange={(e) => handleTokenomicsChange('price', Number(e.target.value))}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 pl-7 text-sm text-white focus:border-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="token-voting" className="block text-xs text-gray-400 mb-1">Voting Multiplier</label>
                                    <input
                                        id="token-voting"
                                        type="number"
                                        min="1"
                                        value={tokenomics.votingPowerMultiplier}
                                        onChange={(e) => handleTokenomicsChange('votingPowerMultiplier', Number(e.target.value))}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                                        title="Cuántos votos otorga cada token"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Access Card */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-amber-300 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-sm">3</span>
                                Tarjeta de Acceso (NFT)
                            </h3>

                            <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                                <label htmlFor="access-card-image" className="block text-sm font-medium text-gray-300 mb-2">
                                    Imagen del NFT de Acceso
                                </label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1">
                                        <input
                                            id="access-card-image"
                                            type="text"
                                            placeholder="https://... o ipfs://..."
                                            value={accessCardImage}
                                            onChange={(e) => setAccessCardImage(e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-600 rounded px-3 py-2 text-sm text-white focus:border-amber-500 outline-none mb-2"
                                        />
                                        <p className="text-xs text-gray-500">
                                            Ingresa la URL de la imagen que representará el acceso a este protocolo.
                                            <br />
                                            * En el futuro, esto será un uploader directo a IPFS.
                                        </p>
                                    </div>
                                    {accessCardImage && (
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-black border border-zinc-600">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={accessCardImage}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-700">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black font-bold shadow-lg shadow-lime-500/20 transition-all transform hover:scale-[1.02] flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Deploying...
                                    </>
                                ) : (
                                    <>
                                        🚀 Confirmar Despliegue
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

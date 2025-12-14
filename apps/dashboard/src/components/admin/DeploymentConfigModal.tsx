'use client';

import React, { useState } from 'react';
import type { DeploymentConfig, UtilityPhase, TokenomicsConfig } from '@/types/deployment';
import { DEFAULT_PHASES, DEFAULT_TOKENOMICS } from '@/types/deployment';
import { TrashIcon, PlusIcon, PhotoIcon, InformationCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';

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

    // Economic Schedule (Basis Points)
    const [economicSchedule, setEconomicSchedule] = useState({
        phase1APY: 500,  // 5%
        phase2APY: 1000, // 10%
        phase3APY: 2000, // 20%
        royaltyBPS: 500  // 5% (Fixed max)
    });

    if (!isOpen) return null;

    // --- Dynamic Phase Logic ---
    const addPhase = () => {
        const newId = `phase-${Date.now()}`;
        setPhases([...phases, {
            id: newId,
            name: 'Nueva Fase',
            description: '',
            type: 'time',
            limit: 30,
            isActive: true,
            tokenAllocation: 0,
            tokenPrice: tokenomics.price
        }]);
    };

    const removePhase = (id: string) => {
        setPhases(phases.filter(p => p.id !== id));
    };

    const handlePhaseChange = (id: string, field: keyof UtilityPhase, value: string | number | boolean) => {
        setPhases(prev => prev.map(p => {
            if (p.id !== id) return p;
            return { ...p, [field]: value };
        }));
    };

    // --- File Handling (Client-Side Preview) ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            if (target === 'accessCard') {
                setAccessCardImage(result);
            } else {
                // Update specific phase image
                handlePhaseChange(target, 'image', result);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleTokenomicsChange = (field: keyof TokenomicsConfig, value: number) => {
        setTokenomics(prev => ({ ...prev, [field]: value }));
    };

    const handleEconomicChange = (field: string, value: number) => {
        setEconomicSchedule(prev => ({ ...prev, [field]: value }));
    };

    // --- Computed Stats ---
    const totalPhaseAllocation = phases.reduce((sum, p) => sum + (p.tokenAllocation || 0), 0);
    const totalReserveAllocation = tokenomics.reserveSupply || 0;
    const totalComputedSupply = totalPhaseAllocation + totalReserveAllocation;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm({
            phases,
            tokenomics: {
                ...tokenomics,
                initialSupply: totalComputedSupply
            },
            accessCardImage: accessCardImage || undefined,
            w2eConfig: { // Pass schedule as custom config
                ...economicSchedule
            }
        });
    };

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            🚀 Configurar Despliegue: <span className="text-lime-400">{projectTitle}</span>
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">Configura las fases de venta, tokenomics y activos digitales.</p>
                    </div>
                    <button onClick={onClose} disabled={isLoading} className="text-gray-400 hover:text-white p-2">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Section 1: Tokenomics (Foundation) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-emerald-300 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">1</span>
                                Tokenomics & Gobernanza
                            </h3>

                            <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Supply Calculation */}
                                    <div className="space-y-4">
                                        <div className="group relative">
                                            <div className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                                Suministro Total (Calculado) <InformationCircleIcon className="w-3 h-3" />
                                            </div>
                                            <div className="w-full bg-zinc-900/50 border border-zinc-700 rounded px-3 py-2 text-white font-mono text-lg flex justify-between items-center">
                                                <span>{totalComputedSupply.toLocaleString()}</span>
                                                <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">AUTO</span>
                                            </div>
                                            <div className="absolute hidden group-hover:block z-20 bottom-full left-0 w-64 p-2 bg-black border border-zinc-700 text-xs text-gray-300 rounded mb-1">
                                                Suma automática: Fases de Venta ({totalPhaseAllocation.toLocaleString()}) + Reserva ({totalReserveAllocation.toLocaleString()}).
                                            </div>
                                        </div>

                                        <div className="group relative">
                                            <label htmlFor="reserveSupply" className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                                Reserva / Team Allocation <InformationCircleIcon className="w-3 h-3" />
                                            </label>
                                            <input
                                                id="reserveSupply"
                                                type="number"
                                                value={tokenomics.reserveSupply || 0}
                                                onChange={(e) => handleTokenomicsChange('reserveSupply', Number(e.target.value))}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none"
                                                placeholder="0"
                                            />
                                            <div className="absolute hidden group-hover:block z-20 bottom-full left-0 w-64 p-2 bg-black border border-zinc-700 text-xs text-gray-300 rounded mb-1">
                                                Tokens retenidos para el equipo, tesorería, marketing, etc. No se venden en las fases.
                                            </div>
                                        </div>
                                    </div>

                                    {/* Governance */}
                                    <div className="space-y-4">
                                        <div className="group relative">
                                            <label htmlFor="votingPower" className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
                                                Poder de Voto <InformationCircleIcon className="w-3 h-3" />
                                            </label>
                                            <input
                                                id="votingPower"
                                                type="number"
                                                min="1"
                                                value={tokenomics.votingPowerMultiplier}
                                                onChange={(e) => handleTokenomicsChange('votingPowerMultiplier', Number(e.target.value))}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white focus:border-emerald-500 outline-none"
                                            />
                                            <div className="absolute hidden group-hover:block z-20 bottom-full left-0 w-48 p-2 bg-black border border-zinc-700 text-xs text-gray-300 rounded mb-1">
                                                Multiplicador para gobernanza. 1 Token = X Votos. Usualmente 1.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Allocation Bar */}
                                <div className="mt-4 pt-4 border-t border-zinc-700/50">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-emerald-400">
                                            Venta: {totalPhaseAllocation.toLocaleString()}
                                        </span>
                                        <span className="text-blue-400">
                                            Reserva: {totalReserveAllocation.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden flex">
                                        <div
                                            className="h-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${(totalComputedSupply === 0 ? 0 : (totalPhaseAllocation / totalComputedSupply) * 100)}%` }}
                                        />
                                        <div
                                            className="h-full bg-blue-500 transition-all duration-500"
                                            style={{ width: `${(totalComputedSupply === 0 ? 0 : (totalReserveAllocation / totalComputedSupply) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                                        <span>Público ({totalComputedSupply > 0 ? ((totalPhaseAllocation / totalComputedSupply) * 100).toFixed(1) : 0}%)</span>
                                        <span>Treasury ({totalComputedSupply > 0 ? ((totalReserveAllocation / totalComputedSupply) * 100).toFixed(1) : 0}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 1.5: Economic Schedule (Pact) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-purple-300 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-sm">P</span>
                                Cronograma Económico (Pacto W2E)
                            </h3>
                            <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700/50">
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Phase 1 */}
                                    <div>
                                        <label htmlFor="phase1APY" className="block text-xs font-medium text-gray-400 mb-1">Fase 1 APY (Base)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="phase1APY"
                                                type="number"
                                                value={economicSchedule.phase1APY}
                                                onChange={(e) => handleEconomicChange('phase1APY', Number(e.target.value))}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                                            />
                                            <span className="text-xs text-gray-500">BPS</span>
                                        </div>
                                        <p className="text-[10px] text-green-400 mt-1">{(economicSchedule.phase1APY / 100).toFixed(1)}%</p>
                                    </div>
                                    {/* Phase 2 */}
                                    <div>
                                        <label htmlFor="phase2APY" className="block text-xs font-medium text-gray-400 mb-1">Fase 2 APY (Scale)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="phase2APY"
                                                type="number"
                                                value={economicSchedule.phase2APY}
                                                onChange={(e) => handleEconomicChange('phase2APY', Number(e.target.value))}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                                            />
                                            <span className="text-xs text-gray-500">BPS</span>
                                        </div>
                                        <p className="text-[10px] text-green-400 mt-1">{(economicSchedule.phase2APY / 100).toFixed(1)}%</p>
                                    </div>
                                    {/* Phase 3 */}
                                    <div>
                                        <label htmlFor="phase3APY" className="block text-xs font-medium text-gray-400 mb-1">Fase 3 APY (Mature)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="phase3APY"
                                                type="number"
                                                value={economicSchedule.phase3APY}
                                                onChange={(e) => handleEconomicChange('phase3APY', Number(e.target.value))}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white text-sm"
                                            />
                                            <span className="text-xs text-gray-500">BPS</span>
                                        </div>
                                        <p className="text-[10px] text-green-400 mt-1">{(economicSchedule.phase3APY / 100).toFixed(1)}%</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                                    <InformationCircleIcon className="w-3 h-3" />
                                    Estos valores son inmutables para el cliente y solo modificables por la Autoridad Pandora.
                                </p>
                            </div>
                        </div>

                        {/* Section 2: Phases (Dynamic) */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-indigo-300 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-sm">2</span>
                                    Fases de Venta & Utilidad
                                </h3>
                                <button type="button" onClick={addPhase} className="text-xs flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded transition-colors">
                                    <PlusIcon className="w-3 h-3" /> Agregar Fase
                                </button>
                            </div>

                            <div className="space-y-4">
                                {phases.map((phase) => (
                                    <div key={phase.id} className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700 hover:border-indigo-500/30 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1 mr-4">
                                                <input
                                                    type="text"
                                                    value={phase.name}
                                                    onChange={(e) => handlePhaseChange(phase.id, 'name', e.target.value)}
                                                    className="bg-transparent text-lg font-bold text-white outline-none placeholder-zinc-600 w-full mb-1"
                                                    placeholder="Nombre de la Fase (ej. Early Bird)"
                                                />
                                                <input
                                                    type="text"
                                                    value={phase.description || ''}
                                                    onChange={(e) => handlePhaseChange(phase.id, 'description', e.target.value)}
                                                    className="bg-transparent text-sm text-gray-400 outline-none placeholder-zinc-700 w-full"
                                                    placeholder="Descripción corta para los usuarios..."
                                                />
                                            </div>
                                            <button type="button" onClick={() => removePhase(phase.id)} className="text-zinc-600 hover:text-red-400 p-1">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* Logic Type */}
                                            <div>
                                                <label htmlFor={`phase-rule-${phase.id}`} className="text-xs text-gray-500 block mb-1">Regla de Cierre</label>
                                                <select
                                                    id={`phase-rule-${phase.id}`}
                                                    value={phase.type}
                                                    onChange={(e) => handlePhaseChange(phase.id, 'type', e.target.value)}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-gray-300"
                                                >
                                                    <option value="time">Por Tiempo (Días)</option>
                                                    <option value="amount">Por Recaudación (USD)</option>
                                                </select>
                                            </div>

                                            {/* Limit */}
                                            <div>
                                                <label className="text-xs text-gray-500 block mb-1">Límite ({phase.type === 'time' ? 'Días' : 'USD'})</label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label htmlFor={`phase-limit-type-${phase.id}`} className="block text-xs text-gray-400 mb-1">Tipo</label>
                                                        <select
                                                            id={`phase-limit-type-${phase.id}`}
                                                            value={phase.type}
                                                            onChange={(e) => handlePhaseChange(phase.id, 'type', e.target.value)}
                                                            className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white text-sm focus:ring-2 focus:ring-lime-500/50 outline-none transition-all"
                                                        >
                                                            <option value="time">Tiempo (Días)</option>
                                                            <option value="amount">Monto (USD/Tokens)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label htmlFor={`phase-limit-${phase.id}`} className="block text-xs text-gray-400 mb-1">
                                                            {phase.type === 'time' ? 'Duración (Días)' : 'Meta (Cantidad)'}
                                                        </label>
                                                        <input
                                                            id={`phase-limit-${phase.id}`}
                                                            type="number"
                                                            value={phase.limit}
                                                            onChange={(e) => handlePhaseChange(phase.id, 'limit', Number(e.target.value))}
                                                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Allocation */}
                                            <div>
                                                <label htmlFor={`phase-allocation-${phase.id}`} className="text-xs text-gray-500 block mb-1">Tokens Asignados</label>
                                                <input
                                                    id={`phase-allocation-${phase.id}`}
                                                    type="number"
                                                    value={phase.tokenAllocation || 0}
                                                    onChange={(e) => handlePhaseChange(phase.id, 'tokenAllocation', Number(e.target.value))}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-emerald-400 font-mono"
                                                    placeholder="0"
                                                />
                                            </div>

                                            {/* Price */}
                                            <div>
                                                <label htmlFor={`phase-price-${phase.id}`} className="text-xs text-gray-500 block mb-1">Precio Fase (USD)</label>
                                                <input
                                                    id={`phase-price-${phase.id}`}
                                                    type="number"
                                                    step="0.000001"
                                                    value={phase.tokenPrice || tokenomics.price}
                                                    onChange={(e) => handlePhaseChange(phase.id, 'tokenPrice', Number(e.target.value))}
                                                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white"
                                                />
                                            </div>

                                            {/* NEW: Date & Soft Cap (Full Width) */}
                                            <div className="col-span-full grid grid-cols-2 gap-4 border-t border-zinc-700/30 pt-4 mt-2">
                                                <div>
                                                    <label htmlFor={`phase-start-${phase.id}`} className="block text-xs text-gray-400 mb-1">Fecha Inicio</label>
                                                    <input
                                                        id={`phase-start-${phase.id}`}
                                                        type="date"
                                                        value={phase.startDate || ''}
                                                        onChange={(e) => handlePhaseChange(phase.id, 'startDate', e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`phase-end-${phase.id}`} className="block text-xs text-gray-400 mb-1">Fecha Fin</label>
                                                    <input
                                                        id={`phase-end-${phase.id}`}
                                                        type="date"
                                                        value={phase.endDate || ''}
                                                        onChange={(e) => handlePhaseChange(phase.id, 'endDate', e.target.value)}
                                                        className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none transition-colors"
                                                    />
                                                </div>
                                                <div className="col-span-full flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`softcap-${phase.id}`}
                                                        checked={phase.isSoftCap || false}
                                                        onChange={(e) => handlePhaseChange(phase.id, 'isSoftCap', e.target.checked)}
                                                        className="w-4 h-4 rounded border-zinc-600 text-indigo-500 focus:ring-indigo-500/50 bg-zinc-800"
                                                    />
                                                    <label htmlFor={`softcap-${phase.id}`} className="text-sm text-gray-300 select-none cursor-pointer">
                                                        Habilitar "All or Nothing" (Soft Cap)
                                                        <span className="block text-xs text-gray-500">Si no se alcanza la meta, se devuelven los fondos.</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Artifact Image Upload */}
                                        <div className="mt-4 pt-4 border-t border-zinc-700/30 flex items-center gap-4">
                                            <div className="relative w-12 h-12 bg-zinc-900 rounded border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0 group">
                                                {phase.image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={phase.image} alt="Artifact" className="w-full h-full object-cover" />
                                                ) : (
                                                    <PhotoIcon className="w-5 h-5 text-gray-600" />
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(e, phase.id)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-400">Artefacto de Fase (Gamification)</p>
                                                <p className="text-[10px] text-gray-600">Este NFT/Badge se entrega al completar la fase.</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 3: Access Card (NFT) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-amber-300 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-sm">3</span>
                                Tarjeta de Acceso (NFT)
                            </h3>

                            <div className="bg-zinc-800/50 p-6 rounded-xl border border-zinc-700 flex flex-col md:flex-row gap-6 items-start">
                                <div className="relative group w-full md:w-64 aspect-[3/4] bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-600 hover:border-amber-500/50 transition-colors flex flex-col items-center justify-center overflow-hidden">
                                    {accessCardImage ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={accessCardImage} alt="Access Card Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <PhotoIcon className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                                            <p className="text-sm text-gray-400">Subir Imagen</p>
                                            <p className="text-xs text-gray-600 mt-1">Recomendado: 600x800px</p>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e, 'accessCard')}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h4 className="font-bold text-white">Access Card NFT</h4>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Es la llave de entrada a tu protocolo. Los usuarios deben adquirir este NFT para desbloquear funcionalidades y niveles superiores.
                                        </p>
                                    </div>

                                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                                        <p className="text-amber-200 text-xs font-medium mb-1">💡 Tip de Gamification logic</p>
                                        <p className="text-amber-100/70 text-xs">
                                            Este NFT servirá como Multiplicador x1.5 para los primeros 100 usuarios (Early Adopters).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-zinc-800 bg-zinc-900 z-10 sticky bottom-0 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className={`px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transform transition-all 
                            ${isLoading
                                ? 'bg-zinc-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-400 hover:to-emerald-400 text-black shadow-lime-500/20 hover:scale-[1.02]'
                            }`}
                    >
                        {isLoading ? 'Desplegando...' : '🚀 Confirmar Despliegue'}
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { DeploymentConfig, UtilityPhase, TokenomicsConfig, ArtifactConfig, ArtifactType, NetworkType } from '@/types/deployment';
import { DEFAULT_PHASES, DEFAULT_TOKENOMICS, DEFAULT_ARTIFACT, ARTIFACT_TYPE_META } from '@/types/deployment';
import { TrashIcon, PlusIcon, PhotoIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, InformationCircleIcon } from '@heroicons/react/24/solid';

// ── Contextual Help Tooltip ──────────────────────────────────────────────────
function InfoTooltip({ title, children }: { title: string; children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
        <div className="relative inline-flex items-center" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(prev => !prev)}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 transition-colors ml-1 flex-shrink-0"
                aria-label="Más información"
            >
                <InformationCircleIcon className="w-4 h-4" />
            </button>
            {open && (
                <div className="absolute z-[9000] left-5 -top-1 w-72 p-4 bg-zinc-800 border border-indigo-500/40 rounded-xl shadow-2xl shadow-black/50">
                    <p className="font-bold text-white text-xs mb-1.5">{title}</p>
                    <div className="text-xs text-gray-300 space-y-1.5 leading-relaxed">{children}</div>
                    <div className="absolute -left-1.5 top-3 w-3 h-3 bg-zinc-800 border-l border-t border-indigo-500/40 rotate-45" />
                </div>
            )}
        </div>
    );
}


interface DeploymentConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: DeploymentConfig) => Promise<void>;
    projectTitle: string;
    projectTotalTokens?: number;
    projectSlug?: string;
    isLoading?: boolean;
}

export function DeploymentConfigModal({
    isOpen,
    onClose,
    onConfirm,
    projectTitle,
    projectTotalTokens,
    isLoading = false
}: DeploymentConfigModalProps) {
    const [network, setNetwork] = useState<NetworkType>('sepolia');
    const [pageLayoutType, setPageLayoutType] = useState<'Access' | 'Identity' | 'Membership' | 'Coupon' | 'Reputation' | 'Yield'>('Access');
    const [artifacts, setArtifacts] = useState<ArtifactConfig[]>([
        DEFAULT_ARTIFACT(projectTitle, projectTitle.substring(0, 4).toUpperCase(), projectTotalTokens || 1000)
    ]);
    const [phases, setPhases] = useState<UtilityPhase[]>(DEFAULT_PHASES);
    const [tokenomics, setTokenomics] = useState<TokenomicsConfig>(DEFAULT_TOKENOMICS);
    const [economicSchedule, setEconomicSchedule] = useState({
        phase1APY: 500,
        phase2APY: 1000,
        phase3APY: 2000,
        royaltyBPS: 500,
    });
    const [activeTab, setActiveTab] = useState<'artifacts' | 'phases' | 'economics' | 'preview'>('artifacts');

    if (!isOpen) return null;

    // ── Artifact Handlers ────────────────────────────────────────────────
    const addArtifact = () => {
        setArtifacts(prev => [
            ...prev,
            { id: `art-${Date.now()}`, name: 'Nuevo Artefacto', symbol: 'ART', artifactType: 'Access', maxSupply: 500, price: '0', isPrimary: false }
        ]);
    };

    const removeArtifact = (id: string) => {
        setArtifacts(prev => {
            const next = prev.filter(a => a.id !== id);
            if (next.length > 0 && !next.some(a => a.isPrimary)) next[0]!.isPrimary = true;
            return next;
        });
    };

    const updateArtifact = <K extends keyof ArtifactConfig>(id: string, field: K, value: ArtifactConfig[K]) => {
        setArtifacts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
    };

    const makePrimary = (id: string) => {
        setArtifacts(prev => prev.map(a => ({ ...a, isPrimary: a.id === id })));
    };

    const handleArtifactImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => updateArtifact(id, 'image', reader.result as string);
        reader.readAsDataURL(file);
    };

    // ── Phase Handlers ────────────────────────────────────────────────
    const addPhase = () => {
        setPhases(prev => [...prev, {
            id: `phase-${Date.now()}`, name: 'Nueva Fase', description: '',
            type: 'time', limit: 30, isActive: true, tokenAllocation: 0, tokenPrice: tokenomics.price
        }]);
    };

    const removePhase = (id: string) => setPhases(prev => prev.filter(p => p.id !== id));

    const handlePhaseChange = (id: string, field: keyof UtilityPhase, value: string | number | boolean) => {
        setPhases(prev => prev.map(p => {
            if (p.id !== id) return p;
            const updated = { ...p, [field]: value };
            if (updated.type === 'time' && (field === 'startDate' || field === 'limit')) {
                if (updated.startDate && updated.limit > 0) {
                    const d = new Date(updated.startDate);
                    d.setDate(d.getDate() + Number(updated.limit));
                    updated.endDate = d.toISOString().split('T')[0];
                }
            }
            return updated;
        }));
    };

    // ── Submit ────────────────────────────────────────────────────────
    const handleSubmit = () => {
        const totalPhaseAlloc = phases.reduce((s, p) => s + (p.tokenAllocation || 0), 0);
        onConfirm({
            artifacts,
            network,
            pageLayoutType,
            phases,
            tokenomics: { ...tokenomics, initialSupply: totalPhaseAlloc + (tokenomics.reserveSupply || 0) },
            w2eConfig: economicSchedule,
        });
    };

    // ── Computed ───────────────────────────────────────────────────────
    const totalPhaseAllocation = phases.reduce((s, p) => s + (p.tokenAllocation || 0), 0);
    const totalSupply = totalPhaseAllocation + (tokenomics.reserveSupply || 0);

    const TABS = [
        { id: 'artifacts', label: '🔌 Artefactos V2', badge: artifacts.length },
        { id: 'phases', label: '📈 Fases de Venta' },
        { id: 'economics', label: '⚙️ Economía' },
        { id: 'preview', label: '🔭 Preview del Ecosistema' },
    ] as const;

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col">

                {/* ── Header ── */}
                <div className="p-5 border-b border-zinc-800 flex items-start justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">🏛️</div>
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                Desplegar Protocolo V2
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    MODULAR ECOSYSTEM
                                </span>
                            </h2>
                            <p className="text-sm text-gray-400 mt-0.5">
                                <span className="text-lime-400 font-medium">{projectTitle}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Page Layout Type Selector */}
                        <div className="flex items-center gap-1">
                            <select
                                value={pageLayoutType}
                                onChange={e => setPageLayoutType(e.target.value as typeof pageLayoutType)}
                                className="text-xs font-bold px-3 py-1.5 rounded-lg border outline-none cursor-pointer bg-zinc-800 border-zinc-600 text-white transition-all"
                            >
                                <option value="Access">🔑 Access Page</option>
                                <option value="Identity">🪪 Identity Page</option>
                                <option value="Membership">🏷️ Membership Page</option>
                                <option value="Coupon">🎟️ Coupon Page</option>
                                <option value="Reputation">🏆 Reputation Page</option>
                                <option value="Yield">💰 Yield Page</option>
                            </select>
                            <InfoTooltip title="¿Qué Page Type elegir?">
                                <p><strong className="text-lime-300">🔑 Access:</strong> Pase de entrada al protocolo. <strong className="text-lime-400">SIEMPRE GRATIS</strong> — el artefacto de acceso nunca cobra al usuario.</p>
                                <p><strong className="text-indigo-300">🪪 Identity:</strong> Credencial SBT (Soul-Bound Token). Muestra badge de verificación KYC/identidad.</p>
                                <p><strong className="text-purple-300">🏷️ Membership:</strong> Suscripción con expiración. Muestra días restantes y botón de renovación.</p>
                                <p><strong className="text-yellow-300">🎟️ Coupon:</strong> Un solo uso, quemable. Ideal para eventos y descuentos únicos.</p>
                                <p><strong className="text-amber-300">🏆 Reputation:</strong> Badge de logro por mérito, no vendible.</p>
                                <p><strong className="text-emerald-300">💰 Yield:</strong> Página de inversión con APY, TVL y distribución de ingresos.</p>
                                <p className="text-gray-500 mt-1">Esta selección determina el diseño visual de la página pública del protocolo.</p>
                            </InfoTooltip>
                        </div>
                        {/* Network Selector */}
                        <div className="flex items-center gap-1">
                            <select
                                value={network}
                                onChange={e => setNetwork(e.target.value as NetworkType)}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-all ${network === 'base'
                                    ? 'bg-blue-900/50 border-blue-500/60 text-blue-300'
                                    : 'bg-amber-900/30 border-amber-500/40 text-amber-300'
                                    }`}
                            >
                                <option value="sepolia">🧪 Sepolia Testnet</option>
                                <option value="base">🔵 Base Mainnet</option>
                            </select>
                            <InfoTooltip title="¿Qué red elegir?">
                                <p><strong className="text-amber-300">🧪 Sepolia:</strong> Red de pruebas. Sin costo real. Úsala para probar la configuración antes del lanzamiento oficial.</p>
                                <p><strong className="text-blue-300">🔵 Base Mainnet:</strong> Red de producción. Los contratos serán permanentes, inmutables y costarán ETH real. Solo cuando estés 100% listo.</p>
                                <p className="text-yellow-400 mt-1">⚠️ Switch a Base solo para el deploy final aprobado por el cliente.</p>
                            </InfoTooltip>
                        </div>
                        <button onClick={onClose} disabled={isLoading} className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-zinc-800">✕</button>
                    </div>
                </div>

                {/* Network Warning Banner */}
                {network === 'base' && (
                    <div className="mx-5 mt-3 px-4 py-2.5 rounded-xl bg-blue-900/30 border border-blue-500/40 flex items-center gap-3 text-sm shrink-0">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <p className="font-bold text-blue-300">Producción: Base Mainnet</p>
                            <p className="text-blue-200/70 text-xs">Los contratos serán inmutables y costarán ETH real. Asegúrate de que la configuración es final.</p>
                        </div>
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="flex gap-1 px-5 pt-4 border-b border-zinc-800 shrink-0 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all border-b-2 -mb-px ${activeTab === tab.id
                                ? 'text-white border-indigo-500 bg-indigo-500/10'
                                : 'text-gray-400 border-transparent hover:text-white hover:border-zinc-600'
                                }`}
                        >
                            {tab.label}
                            {'badge' in tab && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">

                    {/* ── TAB: Artifacts ── */}
                    {activeTab === 'artifacts' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-white flex items-center">
                                        Artefactos del Ecosistema
                                        <InfoTooltip title="¿Qué es un Artefacto?">
                                            <p>Un artefacto es un <strong className="text-indigo-300">contrato NFT inteligente</strong> que actúa como "llave" de acceso al protocolo.</p>
                                            <p>El <strong className="text-yellow-300">ProtocolRegistry</strong> (corazón de V2) solo permite interactuar con el Loom a quienes tengan al menos uno de los artefactos autorizados.</p>
                                            <p className="text-emerald-400">✓ Agrega múltiples artefactos para ofrecer diferentes niveles de acceso.</p>
                                        </InfoTooltip>
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        Define los activos digitales que operan como gatekeepers del Protocol Registry.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addArtifact}
                                    className="flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <PlusIcon className="w-3.5 h-3.5" /> Agregar Artefacto
                                </button>
                            </div>

                            {artifacts.map((art, idx) => (
                                <div key={art.id} className={`p-4 rounded-xl border transition-colors ${art.isPrimary ? 'border-indigo-500/60 bg-indigo-500/5' : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{ARTIFACT_TYPE_META[art.artifactType].icon}</span>
                                            <div>
                                                <span className="text-xs font-bold text-gray-300">#{idx + 1}</span>
                                                {art.isPrimary && (
                                                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                        PRIMARY
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!art.isPrimary && (
                                                <button
                                                    type="button"
                                                    onClick={() => makePrimary(art.id)}
                                                    title="Convertir en artefacto primario"
                                                    className="p-1.5 text-gray-500 hover:text-yellow-400 transition-colors"
                                                >
                                                    <StarIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                            {art.isPrimary && (
                                                <div className="flex items-center gap-1">
                                                    <StarIconSolid className="w-4 h-4 text-yellow-400" />
                                                    <InfoTooltip title="Artefacto Primario">
                                                        <p>El artefacto <strong className="text-yellow-300">PRIMARY</strong> es el que se registra como <code className="bg-zinc-700 px-1 rounded">licenseContractAddress</code> en la base de datos.</p>
                                                        <p>Es el artefacto principal de acceso visible en la página pública del protocolo.</p>
                                                        <p className="text-emerald-400">Solo puede haber uno. Al dar primario a otro, este pierde el status.</p>
                                                    </InfoTooltip>
                                                </div>
                                            )}
                                            {artifacts.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeArtifact(art.id)}
                                                    className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Artifact Type Selector */}
                                    <div className="mb-4">
                                        <label className="block text-xs font-medium text-gray-400 mb-2 flex items-center">
                                            Tipo de Artefacto
                                            <InfoTooltip title="Tipos de Artefacto y cuándo usar cada uno">
                                                <p><strong className="text-indigo-300">🔑 Access Pass:</strong> El más común. NFT transferible que da entrada al protocolo. Ideal para membresías de pago único.</p>
                                                <p><strong className="text-indigo-300">🪪 Identity SBT:</strong> No transferible. Queda ligado al wallet. Ideal para credenciales, membresías KYC, o reputación personal.</p>
                                                <p><strong className="text-indigo-300">🏷️ Membership:</strong> Con fecha de expiración. El usuario debe renovar para mantener acceso.</p>
                                                <p><strong className="text-indigo-300">🎟️ Coupon:</strong> De un solo uso. Se quema al canjear. Ideal para descuentos, tickets de evento, o acciones únicas.</p>
                                                <p><strong className="text-indigo-300">🏆 Reputation:</strong> Badge de logro. No transferible ni quemable. Para gamificación.</p>
                                                <p><strong className="text-indigo-300">💰 Yield:</strong> Comparte ingresos del protocolo con sus holders. Para modelos de revenue sharing.</p>
                                            </InfoTooltip>
                                        </label>
                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                            {(Object.keys(ARTIFACT_TYPE_META) as ArtifactType[]).map(type => {
                                                const meta = ARTIFACT_TYPE_META[type];
                                                return (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => updateArtifact(art.id, 'artifactType', type)}
                                                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all ${art.artifactType === type
                                                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                                                            : 'border-zinc-700 hover:border-zinc-500 text-gray-400'
                                                            }`}
                                                    >
                                                        <span className="text-lg">{meta.icon}</span>
                                                        <span className="font-medium leading-tight text-center">{meta.label.split(' ')[0]}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1">
                                            <InformationCircleIcon className="w-3 h-3" />
                                            {ARTIFACT_TYPE_META[art.artifactType].description}
                                            <span className="ml-1 text-zinc-600">— {ARTIFACT_TYPE_META[art.artifactType].tags}</span>
                                        </p>
                                    </div>

                                    {/* Artifact Fields */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                                            <input
                                                type="text"
                                                value={art.name}
                                                onChange={e => updateArtifact(art.id, 'name', e.target.value)}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white focus:border-indigo-500 outline-none transition-colors"
                                                placeholder="Ej. Protocol Access"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1 flex items-center">
                                                Símbolo
                                                <InfoTooltip title="Símbolo del NFT">
                                                    <p>Ticker corto de 3–5 letras del contrato NFT. Aparece en exploradores como Etherscan y wallets.</p>
                                                    <p className="text-emerald-400">Ej: PACC, MBRS, IDT, REP. Usa mayúsculas.</p>
                                                    <p className="text-yellow-400">⚠️ No puede cambiarse después del deploy.</p>
                                                </InfoTooltip>
                                            </label>
                                            <input
                                                type="text"
                                                value={art.symbol}
                                                onChange={e => updateArtifact(art.id, 'symbol', e.target.value.toUpperCase())}
                                                maxLength={6}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono uppercase focus:border-indigo-500 outline-none transition-colors"
                                                placeholder="PACC"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1 flex items-center">
                                                Supply Máx.
                                                <InfoTooltip title="Supply Máximo (Max Supply)">
                                                    <p>Número máximo de NFTs que pueden existir de este artefacto.</p>
                                                    <p><strong className="text-indigo-300">Escasez alta:</strong> Pocos NFTs = mayor valor percibido. Ej: 100–500 para accesos VIP.</p>
                                                    <p><strong className="text-indigo-300">Escasez media:</strong> Ej: 1,000–10,000 para comunidades medianas.</p>
                                                    <p><strong className="text-indigo-300">Ilimitado:</strong> Usa 0 o un número muy alto. No recomendado sin modelo económico claro.</p>
                                                </InfoTooltip>
                                            </label>
                                            <input
                                                type="number"
                                                value={art.maxSupply}
                                                onChange={e => updateArtifact(art.id, 'maxSupply', Number(e.target.value))}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-emerald-400 font-mono focus:border-indigo-500 outline-none transition-colors"
                                                min={1}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1 flex items-center">
                                                Precio (ETH)
                                                <InfoTooltip title="Precio de Mint en ETH">
                                                    <p>Costo en ETH para que un usuario adquiera este artefacto directamente del contrato.</p>
                                                    <p><strong className="text-amber-300">0 ETH:</strong> Free mint. El control de acceso es off-chain o por whitelist.</p>
                                                    <p><strong className="text-emerald-300">0.01 ETH ≈ $30–40:</strong> Precio típico de acceso básico.</p>
                                                    <p className="text-gray-400">Los ingresos van directo a la Treasury del protocolo.</p>
                                                </InfoTooltip>
                                            </label>
                                            <input
                                                type="number"
                                                value={art.price}
                                                onChange={e => updateArtifact(art.id, 'price', e.target.value)}
                                                step="0.001"
                                                min={0}
                                                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono focus:border-indigo-500 outline-none transition-colors"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    {/* Image Uploader */}
                                    <div className="mt-3 flex items-center gap-3">
                                        <label className="relative w-12 h-12 shrink-0 bg-zinc-900 border border-zinc-700 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors group">
                                            {art.image
                                                // eslint-disable-next-line @next/next/no-img-element
                                                ? <img src={art.image} alt="" className="w-full h-full object-cover" />
                                                : <PhotoIcon className="w-5 h-5 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                                            }
                                            <input type="file" accept="image/*" onChange={e => handleArtifactImage(art.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        </label>
                                        <div>
                                            <p className="text-xs text-gray-400">Imagen del NFT (opcional)</p>
                                            <p className="text-[11px] text-gray-600">PNG / JPG, 1:1 recomendado. Mín 400px.</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── TAB: Sale Phases ── */}
                    {activeTab === 'phases' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-white">Fases de Venta & Utilidad</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Configura las rondas de distribución del token PHI.</p>
                                </div>
                                <button type="button" onClick={addPhase} className="flex items-center gap-1.5 text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors">
                                    <PlusIcon className="w-3.5 h-3.5" /> Agregar Fase
                                </button>
                            </div>

                            {/* Allocation Preview Bar */}
                            <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                                    <span>Venta: <strong className="text-emerald-400">{totalPhaseAllocation.toLocaleString()}</strong></span>
                                    <span>Reserva: <strong className="text-blue-400">{(tokenomics.reserveSupply || 0).toLocaleString()}</strong></span>
                                    <span>Total: <strong className="text-white">{totalSupply.toLocaleString()}</strong></span>
                                </div>
                                <div className="h-2 bg-zinc-900 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${totalSupply === 0 ? 0 : (totalPhaseAllocation / totalSupply) * 100}%` }} />
                                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${totalSupply === 0 ? 0 : ((tokenomics.reserveSupply || 0) / totalSupply) * 100}%` }} />
                                </div>
                            </div>

                            {phases.map(phase => (
                                <div key={phase.id} className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700 hover:border-indigo-500/30 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 mr-3">
                                            <input type="text" value={phase.name} onChange={e => handlePhaseChange(phase.id, 'name', e.target.value)} className="bg-transparent text-base font-bold text-white outline-none placeholder-zinc-600 w-full mb-1" placeholder="Nombre de la Fase" />
                                            <input type="text" value={phase.description || ''} onChange={e => handlePhaseChange(phase.id, 'description', e.target.value)} className="bg-transparent text-xs text-gray-400 outline-none placeholder-zinc-700 w-full" placeholder="Descripción para los usuarios..." />
                                        </div>
                                        <button type="button" onClick={() => removePhase(phase.id)} className="text-zinc-600 hover:text-red-400 p-1 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Regla de Cierre</label>
                                            <select value={phase.type} onChange={e => handlePhaseChange(phase.id, 'type', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none">
                                                <option value="time">Por Tiempo (Días)</option>
                                                <option value="amount">Por Recaudación</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">{phase.type === 'time' ? 'Duración (Días)' : 'Meta (USD)'}</label>
                                            <input type="number" value={phase.limit} onChange={e => handlePhaseChange(phase.id, 'limit', Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Tokens Asignados</label>
                                            <input type="number" value={phase.tokenAllocation || 0} onChange={e => handlePhaseChange(phase.id, 'tokenAllocation', Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-emerald-400 font-mono outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 block mb-1">Precio Fase (USD)</label>
                                            <input type="number" step="0.000001" value={phase.tokenPrice ?? tokenomics.price} onChange={e => handlePhaseChange(phase.id, 'tokenPrice', Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none" />
                                        </div>
                                    </div>
                                    {/* Dates + Soft Cap */}
                                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-zinc-700/50">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Fecha Inicio</label>
                                            <input type="date" value={phase.startDate || ''} onChange={e => handlePhaseChange(phase.id, 'startDate', e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">{phase.type === 'time' ? 'Fecha Fin (calculada)' : 'Fecha Fin (opcional)'}</label>
                                            <input type="date" value={phase.endDate || ''} onChange={e => handlePhaseChange(phase.id, 'endDate', e.target.value)} disabled={phase.type === 'time'} className={`w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none ${phase.type === 'time' ? 'opacity-40 cursor-not-allowed' : ''}`} />
                                        </div>
                                        <div className="col-span-2 flex items-center gap-2">
                                            <input type="checkbox" id={`sc-${phase.id}`} checked={phase.isSoftCap || false} onChange={e => handlePhaseChange(phase.id, 'isSoftCap', e.target.checked)} className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-indigo-500" />
                                            <label htmlFor={`sc-${phase.id}`} className="text-xs text-gray-300 cursor-pointer select-none flex items-center">
                                                Habilitar «All or Nothing» — si no se alcanza la meta, se devuelven los fondos.
                                                <InfoTooltip title="¿Qué es el Soft Cap (All or Nothing)?">
                                                    <p>Si activas esto, la fase funciona como un <strong className="text-indigo-300">crowdfunding con garantía</strong>:</p>
                                                    <p>✓ Si se alcanza la meta → los fondos se liberan al protocolo.</p>
                                                    <p>✗ Si NO se alcanza → todos los fondos se devuelven automáticamente a los participantes.</p>
                                                    <p className="text-yellow-400 mt-1">⚠️ Requiere lógica de escrow en la fase. Úsalo solo si el cliente tiene obligaciones de retorno de fondos.</p>
                                                </InfoTooltip>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Reserve Supply */}
                            <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3">Tokenomics General</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Reserva / Team Allocation</label>
                                        <input type="number" value={tokenomics.reserveSupply || 0} onChange={e => setTokenomics(prev => ({ ...prev, reserveSupply: Number(e.target.value) }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-blue-400 font-mono outline-none focus:border-indigo-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Precio Base (USD)</label>
                                        <input type="number" step="0.0001" value={tokenomics.price} onChange={e => setTokenomics(prev => ({ ...prev, price: Number(e.target.value) }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono outline-none focus:border-indigo-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 block mb-1">Poder de Voto</label>
                                        <input type="number" min={1} value={tokenomics.votingPowerMultiplier} onChange={e => setTokenomics(prev => ({ ...prev, votingPowerMultiplier: Number(e.target.value) }))} className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm text-white font-mono outline-none focus:border-indigo-500 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── TAB: Economics ── */}
                    {activeTab === 'economics' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-white">Cronograma Económico (Pacto W2E)</h3>
                                <p className="text-xs text-gray-400 mt-0.5 flex items-center">
                                    Estos valores son inmutables post-deploy y solo modificables por la Autoridad Pandora.
                                    <InfoTooltip title="¿Por qué son inmutables?">
                                        <p>Los APY y el royalty se graban en el bytecode del contrato <strong className="text-indigo-300">W2ELoomV2</strong> en el momento del deploy.</p>
                                        <p>Esto <strong className="text-emerald-300">protege al usuario final</strong>: el dueño del protocolo no puede cambiarlos unilateralmente después del lanzamiento.</p>
                                        <p>Solo la <strong className="text-purple-300">Autoridad Pandora</strong> (vía Timelock + Governor) puede modificarlos, con un período de aviso previo.</p>
                                    </InfoTooltip>
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {([{
                                    key: 'phase1APY', label: 'APY Fase 1 (Base)', color: 'text-emerald-400',
                                    info: { title: 'APY Fase 1 — Base', body: 'El rendimiento anual ofrecido a participantes en la fase temprana. Ej: 500 BPS = 5%. Es el APY más alto para recompensar a early adopters. Recomendado entre 500–2000 BPS.' }
                                }, {
                                    key: 'phase2APY', label: 'APY Fase 2 (Scale)', color: 'text-lime-400',
                                    info: { title: 'APY Fase 2 — Scale', body: 'APY de la fase de expansión. Debe ser mayor al de Fase 1 para reflejar crecimiento del protocolo. Recomendado: 1.5×–2× el APY de Fase 1.' }
                                }, {
                                    key: 'phase3APY', label: 'APY Fase 3 (Mature)', color: 'text-yellow-400',
                                    info: { title: 'APY Fase 3 — Mature', body: 'APY del estado maduro del protocolo (largo plazo). Debe ser sustentable económicamente. Demasiado alto en esta fase puede generar inflación. Recomendado: 1500–3000 BPS máx.' }
                                }, {
                                    key: 'royaltyBPS', label: 'Royalty (BPS)', color: 'text-purple-400',
                                    info: { title: 'Royalty de Mercado Secundario', body: 'Porcentaje del precio de reventa que el protocolo recibe cuando un NFT se vende en mercados como OpenSea. Ej: 500 BPS = 5% de royalty. OpenSea y otros respetan royalties de hasta 10% (1000 BPS). Recomendado: 300–700 BPS.' }
                                }] as const).map(item => (
                                    <div key={item.key} className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700">
                                        <label className="text-xs text-gray-400 block mb-2 flex items-center">
                                            {item.label}
                                            <InfoTooltip title={item.info.title}>
                                                <p>{item.info.body}</p>
                                            </InfoTooltip>
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={economicSchedule[item.key]}
                                                onChange={e => setEconomicSchedule(prev => ({ ...prev, [item.key]: Number(e.target.value) }))}
                                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500 transition-colors"
                                            />
                                            <span className="text-xs text-gray-500 w-8">BPS</span>
                                        </div>
                                        <p className={`text-sm font-bold mt-1.5 ${item.color}`}>
                                            {(economicSchedule[item.key] / 100).toFixed(2)}%
                                        </p>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-200/70">
                                <p className="font-bold text-amber-300 mb-1">💡 Acerca del Cronograma</p>
                                <p>Los APY se almacenan en Basis Points (BPS). 1% = 100 BPS. Estos valores configuran los parámetros de `W2ELoomV2` en el momento del deploy y no pueden ser modificados por el cliente del protocolo.</p>
                            </div>
                        </div>
                    )}

                    {/* ── TAB: Ecosystem Preview ── */}
                    {activeTab === 'preview' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-white">Ecosistema a Desplegar</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Revisión final antes de confirmar. Red: <strong className={network === 'base' ? 'text-blue-400' : 'text-amber-400'}>{network === 'base' ? '🔵 Base Mainnet' : '🧪 Sepolia Testnet'}</strong>
                                </p>
                            </div>

                            {/* Core Contracts */}
                            <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700 space-y-2">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Contratos Core (Automáticos)</h4>
                                {[
                                    { icon: '📒', name: 'ProtocolRegistry', desc: 'Fuente de verdad para artefactos autorizados', tag: 'V2' },
                                    { icon: '⚙️', name: 'W2ELoomV2', desc: 'Motor lógico W2E (modular)', tag: 'V2' },
                                    { icon: '🏦', name: 'PBOXProtocolTreasury', desc: 'Tesorería multi-sig del protocolo', tag: 'Core' },
                                    { icon: '🗳️', name: 'W2EGovernor + Timelock', desc: 'Gobernanza DAO con ejecución diferida', tag: 'Core' },
                                    { icon: '🪙', name: 'W2EUtility (PHI)', desc: 'Token de utilidad ERC-20', tag: 'Core' },
                                ].map(c => (
                                    <div key={c.name} className="flex items-center gap-3 p-2.5 bg-zinc-900/50 rounded-lg">
                                        <span className="text-lg w-7 text-center shrink-0">{c.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white">{c.name}</p>
                                            <p className="text-[11px] text-gray-500 truncate">{c.desc}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${c.tag === 'V2' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-zinc-700 text-zinc-400'}`}>
                                            {c.tag}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Artifacts */}
                            <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700 space-y-2">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                                    Artefactos del Ecosistema ({artifacts.length})
                                </h4>
                                {artifacts.map((art, idx) => {
                                    const meta = ARTIFACT_TYPE_META[art.artifactType];
                                    return (
                                        <div key={art.id} className="flex items-center gap-3 p-2.5 bg-zinc-900/50 rounded-lg">
                                            <span className="text-lg w-7 text-center shrink-0">{meta.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-white">{art.name}</p>
                                                    <span className="text-[10px] text-gray-500">({art.symbol})</span>
                                                    {art.isPrimary && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">PRIMARY</span>}
                                                </div>
                                                <p className="text-[11px] text-gray-500">
                                                    {meta.tags} · Supply: {art.maxSupply.toLocaleString()} · Precio: {art.price} ETH
                                                </p>
                                            </div>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                                #{idx + 1}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* PHI Tokenomics Summary */}
                            <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">PHI Token Summary</h4>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-lg font-bold text-emerald-400">{totalPhaseAllocation.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">Venta Pública</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-blue-400">{(tokenomics.reserveSupply || 0).toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">Reserva</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-white">{totalSupply.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">Total Supply</p>
                                    </div>
                                </div>
                            </div>

                            {/* Complexity estimate */}
                            <div className={`p-3 rounded-xl border flex items-center gap-3 text-sm ${artifacts.length === 1 ? 'border-emerald-500/30 bg-emerald-500/5' :
                                artifacts.length <= 3 ? 'border-amber-500/30 bg-amber-500/5' :
                                    'border-red-500/30 bg-red-500/5'
                                }`}>
                                <span className="text-xl">
                                    {artifacts.length === 1 ? '🟢' : artifacts.length <= 3 ? '🟡' : '🔴'}
                                </span>
                                <div>
                                    <p className={`font-semibold ${artifacts.length === 1 ? 'text-emerald-300' : artifacts.length <= 3 ? 'text-amber-300' : 'text-red-300'}`}>
                                        Complejidad: {artifacts.length === 1 ? 'Baja' : artifacts.length <= 3 ? 'Media' : 'Alta'} ({artifacts.length} artefacto{artifacts.length !== 1 ? 's' : ''})
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {artifacts.length + 5} contratos en total · Tiempo estimado: ~{(artifacts.length + 2) * 10}–{(artifacts.length + 2) * 20} segundos
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between gap-3 shrink-0 rounded-b-2xl">
                    <div className="flex gap-2">
                        {TABS.map((tab, i) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`w-2 h-2 rounded-full transition-all ${activeTab === tab.id ? 'bg-indigo-400' : 'bg-zinc-700 hover:bg-zinc-500'}`}
                                title={tab.label}
                            />
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} disabled={isLoading} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm">
                            Cancelar
                        </button>
                        {activeTab !== 'preview' && (
                            <button
                                onClick={() => {
                                    type TabId = 'artifacts' | 'phases' | 'economics' | 'preview';
                                    const tabOrder: TabId[] = ['artifacts', 'phases', 'economics', 'preview'];
                                    const nextIdx = tabOrder.indexOf(activeTab) + 1;
                                    if (nextIdx < tabOrder.length) setActiveTab(tabOrder[nextIdx]!);
                                }}
                                className="px-5 py-2 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition-colors"
                            >
                                Siguiente →
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={isLoading || artifacts.length === 0}
                            className={`px-6 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all ${isLoading || artifacts.length === 0
                                ? 'bg-zinc-700 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/20 hover:scale-[1.02]'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Desplegando...
                                </>
                            ) : (
                                <>🚀 Confirmar Deploy V2</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

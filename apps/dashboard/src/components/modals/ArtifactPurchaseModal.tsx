import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, CheckCircle, Loader2, HelpCircle, Copy, ExternalLink, AlertCircle, TrendingUp, ArrowRight, Gift, Sparkles, PlusCircle, CreditCard } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useActiveAccount, TransactionButton, useWalletBalance } from "thirdweb/react";
import { prepareContractCall, defineChain, getContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { toast } from "sonner";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Protocol Engine Imports
import { resolveExecution } from "@/lib/protocol-engine/execute";
import { resolveArtifactPrice } from "@/lib/protocol-engine/artifact/pricing";
import { ProgressionEngine, Tier } from "@/lib/protocol-engine/progression";
import { CHAIN_TOKENS } from "@/lib/protocol-engine/artifact/payment";

interface ArtifactPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    utilityContract: any;
    phase: any;
    userArtifactCount: number;
    initialAmount?: string;
    tokenType?: 'erc20' | 'erc721' | 'erc1155' | 'unknown';
}

export default function ArtifactPurchaseModal({ 
    isOpen, 
    onClose, 
    project, 
    utilityContract, 
    phase, 
    userArtifactCount,
    initialAmount 
}: ArtifactPurchaseModalProps) {
    const router = useRouter();
    const account = useActiveAccount();
    const [step, setStep] = useState<'review' | 'processing' | 'success'>('review');
    const [amount, setAmount] = useState<string>("1");
    const [isFauceting, setIsFauceting] = useState(false);
    const [needsFaucet, setNeedsFaucet] = useState(false);
    const [showFaucetGuide, setShowFaucetGuide] = useState(false);

    // New Engine States
    const [contractPrice, setContractPrice] = useState<bigint | undefined>(undefined);
    const [isPriceLoading, setIsPriceLoading] = useState(true);

    // Real-time scarcity: purchases in the last 10 minutes
    const { data: activityData } = useSWR(
        project?.id && isOpen ? `/api/dao/recent-activity?projectId=${project.id}&minutes=10` : null,
        (url: string) => fetch(url).then(r => r.json()),
        { refreshInterval: 30000, fallbackData: null }
    );
    const recentPurchaseCount = activityData?.count ?? null;

    // 0. Progression Engine Data
    const tokenType = (project as any).tokenType || 'erc20';
    const tiers: Tier[] = useMemo(() => {
        const rawTiers = (project?.w2eConfig?.tiers || project?.w2eConfig?.packages || []) as any[];
        return rawTiers.map(t => {
            // Extract threshold from range (e.g. "101 - 500" -> 101) or other fallback props
            let threshold = t.artifactCountThreshold ?? t.minArtifacts ?? 0;
            if (t.range && typeof t.range === 'string') {
                const parsed = parseInt(t.range.split('-')[0].replace(/,/g, '').trim());
                if (!isNaN(parsed)) threshold = parsed;
            }
            
            return {
                id: (t.id || t.name || '').toLowerCase(),
                name: t.name || 'Protocol Member',
                artifactCountThreshold: threshold,
                perks: t.perks || [],
            };
        });
    }, [project]);

    const progression = useMemo(() => 
        ProgressionEngine.calculate(Number(userArtifactCount || 0), tiers, Number(amount || 0), tokenType),
    [userArtifactCount, tiers, amount, tokenType]);

    const initialDelta = useMemo(() => {
        const state = ProgressionEngine.calculate(Number(userArtifactCount || 0), tiers, 0, tokenType);
        return state.unlockDelta;
    }, [userArtifactCount, tiers, tokenType]);

    // Handle initial amount from props or suggested delta
    useEffect(() => {
        if (isOpen) {
            if (initialAmount) {
                setAmount(initialAmount);
            } else if (initialDelta > 0) {
                // Pre-fill with the amount needed for next tier
                setAmount(String(initialDelta));
            } else {
                setAmount("1");
            }
            setStep('review');
        }
    }, [isOpen, initialAmount, initialDelta]);

    const IS_PROD = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';
    const rawChainId = Number((project as any).chainId);
    const safeChainId = IS_PROD ? (rawChainId || 8453) : 11155111;
    const chain = useMemo(() => defineChain(safeChainId), [safeChainId]);
    const isTestnet = safeChainId === 11155111 || safeChainId === 84532;

    // Balance check
    const { data: balanceData } = useWalletBalance({
        client,
        chain,
        address: account?.address,
    });

    // 1. Resolve Target Contract
    // Priority handled by the Engine Resolver
    console.log('[ArtifactPurchaseModal] Target resolution:', {
        phase_artifactAddress: phase?.artifactAddress,
        phase_name: phase?.name,
        phase_phaseIndex: phase?.phaseIndex,
        project_licenseContractAddress: project?.licenseContractAddress,
        project_artifacts: project?.artifacts?.slice?.(0, 2)
    });
    
    const targetAddress = phase?.artifactAddress ||
        project.licenseContractAddress ||
        project.w2eConfig?.licenseToken?.address ||
        (project as any).contractAddress ||
        utilityContract?.address;

    const targetContract = useMemo(() => getContract({
        client,
        chain,
        address: targetAddress || "0x0000000000000000000000000000000000000000"
    }), [chain, targetAddress]);

    // 2. Robust Price Fetching (Prevents hook reverts)
    useEffect(() => {
        let isMounted = true;
        async function fetchPrice() {
            if (!targetAddress || targetAddress === "0x0000000000000000000000000000000000000000") {
                setIsPriceLoading(false);
                return;
            }

            setIsPriceLoading(true);
            try {
                const { price } = await resolveArtifactPrice({
                    contract: targetContract,
                    fallbackPrice: phase?.tokenPrice || 0,
                    chainId: safeChainId
                });
                if (isMounted) setContractPrice(price);
            } catch (error) {
                console.error("Failed to resolve artifact price", error);
            } finally {
                if (isMounted) setIsPriceLoading(false);
            }
        }

        fetchPrice();
        return () => { isMounted = false; };
    }, [targetAddress, targetContract, phase?.tokenPrice]);

    // 3. Calculation & Config Generation (Safe Logic)
    const tokenConfig = useMemo(() => CHAIN_TOKENS[safeChainId] || CHAIN_TOKENS[11155111]!, [safeChainId]);
    const isBase = safeChainId === 8453 || safeChainId === 84532;
    const decimals = useMemo(() => BigInt(10 ** tokenConfig.decimals), [tokenConfig.decimals]);
    
    // Normalize user input to prevent NaN/Negative/Zero errors
    const safeAmount = useMemo(() => Math.max(1, Math.floor(Number(amount) || 1)), [amount]);
    
    const effectivePriceInWei = useMemo(() => {
        return contractPrice ?? BigInt(Math.round((phase?.tokenPrice || 0) * Number(decimals)));
    }, [contractPrice, phase?.tokenPrice, decimals]);
    
    // Use BigInt for all core calculations to prevent precision/overflow issues
    const totalCostWei = useMemo(() => BigInt(safeAmount) * effectivePriceInWei, [safeAmount, effectivePriceInWei]);
    const totalCostDisplay = useMemo(() => Number(totalCostWei) / Number(decimals), [totalCostWei, decimals]);

    // Unified Transaction Configuration (Safe wrapping to prevent render crashes on misconfigured projects)
    const txConfig = useMemo(() => {
        try {
            if (!targetAddress || targetAddress === "0x0000000000000000000000000000000000000000") {
                throw new Error("Missing target address");
            }
            return resolveExecution({
                type: 'BUY_ARTIFACT',
                payload: {
                    project,
                    phase,
                    utilityContract,
                    artifactType: (phase as any)?.artifactType || 'Access',
                    quantity: BigInt(safeAmount),
                    account: account?.address || "",
                    chainId: safeChainId,
                    priceInWei: effectivePriceInWei
                }
            });
        } catch (e) {
            console.warn("[ProtocolEngine] Artifact execution config could not be generated:", e);
            return {
                address: "",
                method: "",
                params: [],
                value: 0n,
                requiresApproval: false,
                token: "ETH"
            };
        }
    }, [project, phase, utilityContract, safeAmount, account, safeChainId, effectivePriceInWei, targetAddress]);

    const handleSuccess = async () => {
        const sessionId = typeof window !== 'undefined' ? localStorage.getItem("growth_session_id") : null;
        
        try {
            await fetch('/api/gamification/track-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-wallet-address': account?.address || "",
                    'x-session-id': sessionId || ""
                },
                body: JSON.stringify({
                    eventType: 'artifact_purchased',
                    metadata: {
                        amount: safeAmount,
                        price: phase?.tokenPrice || 0,
                        project: project.slug,
                        phase: phase.name,
                        projectId: project.id,
                        sessionId,
                        source: typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('utm_source') : null
                    }
                })
            });
        } catch (e) {
            console.error("Failed to track gamification event", e);
        }

        // Register buyer as unique holder immediately — updates Holders count in real-time
        try {
            fetch('/api/dao/register-holder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: account?.address,
                    projectId: project.id,
                    artifactsAcquired: safeAmount,
                })
            }).catch(() => {});
        } catch (e) {
            // Fire-and-forget — non-critical
        }

        setStep('success');
        toast.success("¡Artefactos adquiridos exitosamente!");
    };


    const handleFailure = async (error: any) => {
        const sessionId = typeof window !== 'undefined' ? localStorage.getItem("growth_session_id") : null;
        try {
            await fetch('/api/gamification/track-event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-wallet-address': account?.address || "",
                    'x-session-id': sessionId || ""
                },
                body: JSON.stringify({
                    eventType: 'purchase_intent_failed',
                    metadata: {
                        error: error.message,
                        amount: safeAmount,
                        project: project.slug,
                        tierTarget: progression.nextTier?.name
                    }
                })
            });
        } catch (e) {
            console.error("Failed to track failure event", e);
        }
    };

    const handleLevelUpReward = () => {
        toast.success("¡Referido copiado! Gana +5 artefactos por cada amigo.");
        navigator.clipboard.writeText(`https://pandoras.io/${project.slug}?ref=${account?.address}`);
    };

    const handleFaucet = async () => {
        if (!account) return;
        setIsFauceting(true);
        try {
            const res = await fetch('/api/faucet/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress: account.address })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al solicitar fondos');

            toast.success(data.message);
            setNeedsFaucet(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsFauceting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence mode="wait">
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-zinc-900 border border-lime-500/30 rounded-2xl shadow-[0_0_30px_rgba(163,230,53,0.1)] overflow-hidden"
                >
                    {/* Header */}
                    <div className="relative h-24 bg-zinc-800 overflow-hidden flex items-center px-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-lime-900/20 to-zinc-900 z-0" />
                        <div className="z-10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-lime-400/20 rounded-xl flex items-center justify-center border border-lime-400/30">
                                <Coins className="w-6 h-6 text-lime-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Adquirir Artefactos</h2>
                                <p className="text-lime-400 text-xs font-medium uppercase">{phase?.name || 'Venta de Tokens'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors z-20">
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {step === 'review' && (
                            <div className="space-y-6">
                                {/* Amount Input */}
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label htmlFor="artifact-amount" className="text-sm text-gray-400">Cantidad de Artefactos (Tokens)</label>
                                        <span className="text-xs text-lime-400">
                                            Disponible: {phase?.stats?.remainingTokens?.toLocaleString() || '∞'}
                                        </span>
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="artifact-amount"
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className={`w-full bg-zinc-950 border rounded-xl p-4 text-white font-mono text-lg focus:outline-none transition-colors ${Number(amount) > (phase?.stats?.remainingTokens || 0) && (phase?.stats?.remainingTokens > 0)
                                                    ? 'border-red-500/50 focus:border-red-500'
                                                    : 'border-zinc-800 focus:border-lime-500/50'
                                                }`}
                                            placeholder="0"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            <button
                                                onClick={() => setAmount(String(phase?.stats?.remainingTokens || 0))}
                                                className="text-xs font-bold text-lime-400 hover:text-lime-300"
                                            >
                                                MAX
                                            </button>
                                            <span className="text-xs font-bold text-gray-500">
                                                {project.ticker || project.slug?.toUpperCase() || 'TOKENS'}
                                            </span>
                                        </div>
                                    </div>
                                    {Number(amount) > (phase?.stats?.remainingTokens || 0) && (phase?.stats?.remainingTokens > 0) && (
                                        <p className="text-xs text-red-400 mt-1">
                                            Excedes la disponibilidad de esta fase ({phase?.stats?.remainingTokens?.toLocaleString()}).
                                        </p>
                                    )}

                                    {/* Dynamic Urgency / Scarcity UI */}
                                    <div className="flex items-center justify-between gap-2 px-1 py-1">
                                        <div className="flex items-center gap-1.5">
                                           <div className={`w-1.5 h-1.5 rounded-full ${recentPurchaseCount !== null && recentPurchaseCount > 0 ? 'bg-orange-500 animate-pulse' : 'bg-zinc-500'}`} />
                                           <span className={`text-[10px] font-bold uppercase tracking-tight ${recentPurchaseCount !== null && recentPurchaseCount > 0 ? 'text-orange-400' : 'text-zinc-500'}`}>
                                              {recentPurchaseCount !== null && recentPurchaseCount > 0 
                                                ? `+${recentPurchaseCount} adquiridos últ. 10 min` 
                                                : `Expectativa: ${phase?.stats?.velocity || 'ALTA'}`}
                                           </span>
                                        </div>
                                        {phase?.stats?.timeRemaining && (
                                           <span className="text-[10px] font-medium text-zinc-500 italic">
                                              Fase termina en {phase.stats.timeRemaining}
                                           </span>
                                        )}
                                    </div>
                                </div>

                                {/* Progression Impact Block (v2.0 Optimized) */}
                                {tiers && tiers.length > 0 && (
                                <div className={`border rounded-[2rem] p-6 space-y-4 transition-all duration-500 ${
                                    progression.isUnlockMoment 
                                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                                        : 'bg-zinc-950/40 border-zinc-800'
                                }`}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-xl ${progression.isUnlockMoment ? 'bg-emerald-500/20' : 'bg-zinc-900'}`}>
                                                <TrendingUp className={`w-4 h-4 ${progression.isUnlockMoment ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                            </div>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Impacto de Progresión</span>
                                        </div>
                                        {progression.isUnlockMoment && (
                                            <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black animate-bounce">
                                                ¡NUEVO RANGO DESBLOQUEADO!
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between gap-4 px-1">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Actual</span>
                                            <span className="text-xs font-bold text-zinc-500 leading-none">
                                                {progression.currentTier?.name || 'Protocol Member'}
                                            </span>
                                        </div>
                                        
                                        <div className="flex-1 flex items-center justify-center">
                                            <div className="h-px w-full bg-zinc-800 relative mx-4">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-1 bg-zinc-900 rounded-full border border-zinc-800">
                                                    <ArrowRight className={`w-3 h-3 ${progression.isUnlockMoment ? 'text-emerald-400' : 'text-zinc-600'}`} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end text-right">
                                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Tras Compra</span>
                                            <span className={`text-sm font-black italic uppercase leading-none ${progression.isUnlockMoment ? 'text-emerald-400' : 'text-purple-400'}`}>
                                                {progression.isUnlockMoment ? progression.nextTier?.name : progression.currentTier?.name || 'Protocol Member'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress Bar or Benefits Highlight */}
                                    {progression.nextTier && !progression.isUnlockMoment ? (
                                        <div className="pt-2">
                                            <div className="flex justify-between items-center mb-1.5 px-1">
                                                <span className="text-[10px] text-zinc-500 font-medium">Faltan {progression.unlockDelta} para {progression.nextTier.name}</span>
                                                <span className="text-[10px] font-black text-purple-400">{progression.progressPercentage}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progression.progressPercentage}%` }}
                                                    className="h-full bg-gradient-to-r from-purple-600 to-blue-500" 
                                                />
                                            </div>
                                            
                                            {/* Micro-Upscale Suggestion (v2.0) */}
                                            {progression.unlockDelta > 0 && progression.unlockDelta <= 5 && (
                                                <motion.button
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => setAmount(String(Number(amount) + progression.unlockDelta))}
                                                    className="mt-4 w-full p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center gap-2 group hover:bg-purple-500 hover:border-purple-500 transition-all duration-300"
                                                >
                                                    <PlusCircle className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
                                                    <span className="text-[10px] font-black text-purple-300 group-hover:text-white uppercase tracking-tight">
                                                        Suma {progression.unlockDelta} más y desbloquea VIP
                                                    </span>
                                                </motion.button>
                                            )}
                                        </div>
                                    ) : progression.isUnlockMoment ? (
                                        <div className="pt-3 border-t border-emerald-500/20">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Gift className="w-3.5 h-3.5 text-emerald-400" />
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Beneficios Desbloqueados:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(progression.nextTier?.perks || []).slice(0, 2).map((perk, i) => (
                                                    <div key={i} className="px-2 py-1 bg-emerald-500/10 rounded-lg text-[9px] font-bold text-emerald-200 border border-emerald-500/20">
                                                        {perk}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                )}

                                {/* Summary */}
                                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Precio por Unidad</span>
                                        <span className="text-white font-mono flex items-center gap-2">
                                            {isPriceLoading ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <>
                                                    {Number(effectivePriceInWei) / (isBase ? 1e6 : 1e18)} {txConfig.token}
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-lime-400 font-bold font-mono text-lg">
                                            Total: {totalCostDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {txConfig.token}
                                        </span>
                                    </div>

                                    {/* Low Balance Warning (Testnet Only) */}
                                    {isTestnet && account && balanceData && (
                                        (() => {
                                            const balanceInEth = Number(balanceData.displayValue);
                                            const totalWithGas = totalCostDisplay + 0.002;
                                            const isLow = balanceInEth < totalWithGas;
                                            return isLow ? (
                                                <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
                                                    <span className="text-orange-400 mt-0.5">⚠️</span>
                                                    <div className="text-xs text-orange-200/80 leading-tight">
                                                        Tu saldo actual ({balanceInEth.toFixed(4)} {balanceData.symbol}) es insuficiente.
                                                    </div>
                                                </div>
                                            ) : null;
                                        })()
                                    )}
                                </div>

                                {/* Action */}
                                {account ? (
                                    (!project.treasuryAddress || project.treasuryAddress === "0x0000000000000000000000000000000000000000") ? (
                                        <div className="text-center">
                                            <button disabled className="w-full bg-red-500/10 text-red-400 font-bold py-4 rounded-xl border border-red-500/20 cursor-not-allowed">
                                                Configuración Incompleta
                                            </button>
                                            <p className="text-xs text-red-400/80 mt-2">
                                                El proyecto no tiene una Tesorería configurada.
                                            </p>
                                        </div>
                                    ) : (
                                        (Number(amount) > (phase?.stats?.remainingTokens || 0) && (phase?.stats?.remainingTokens > 0)) ? (
                                            <button disabled className="w-full bg-zinc-800 text-gray-500 font-bold py-4 rounded-xl cursor-not-allowed">
                                                Excede Disponibilidad
                                            </button>
                                        ) : (
                                            <TransactionButton
                                                transaction={() => {
                                                    return prepareContractCall({
                                                        contract: getContract({
                                                            client,
                                                            chain,
                                                            address: txConfig.address
                                                        }),
                                                        method: txConfig.method as any,
                                                        params: txConfig.params as any,
                                                        value: txConfig.value
                                                    });
                                                }}
                                                onTransactionSent={() => setStep('processing')}
                                                theme="dark"
                                                onTransactionConfirmed={(tx) => {
                                                    console.log("Transaction confirmed:", tx);
                                                    handleSuccess();
                                                }}
                                                onError={(error) => {
                                                    console.error("Purchase failed", error);
                                                    handleFailure(error);
                                                    if (error.message.toLowerCase().includes('insufficient')) {
                                                        if (isTestnet) setNeedsFaucet(true);
                                                        toast.error("Fondos insuficientes.");
                                                    } else {
                                                        toast.error(`Error: ${error.message}`);
                                                    }
                                                    setStep('review');
                                                }}
                                                disabled={isPriceLoading || !txConfig.address}
                                                className="!w-full !bg-lime-400 hover:!bg-lime-500 !text-black !font-bold !py-4 !rounded-xl"
                                            >
                                                 {isPriceLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                                ) : (
                                                    <>Adquirir Ahora ({totalCostDisplay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {txConfig.token})</>
                                                )}
                                            </TransactionButton>
                                        )
                                    )
                                ) : (
                                    <button disabled className="w-full bg-zinc-700 text-gray-400 font-bold py-4 rounded-xl">
                                        Conecta tu Wallet para Comprar con Cripto
                                    </button>
                                )}

                                {/* Traditional Payment Bridge (Stripe / Wire Transfer) */}
                                {['stripe', 'wire', 'card'].some(m => project.payment_methods?.includes(m)) && (
                                    <div className="pt-4 border-t border-zinc-800/50 mt-4">
                                        <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest text-center mb-4">O PAGA CON MEDIOS TRADICIONALES</p>
                                        <button 
                                            onClick={() => {
                                                const tierSlug = String(phase?.name || phase?.id || 'silver').toLowerCase();
                                                window.open(`/pay/${project.slug}/${tierSlug}`, '_blank');
                                            }}
                                            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold py-4 rounded-xl border border-zinc-800 flex items-center justify-center gap-2 group transition-all"
                                        >
                                            <CreditCard className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                            Pagar con Tarjeta o Transferencia
                                        </button>
                                        <p className="text-[10px] text-zinc-500 text-center mt-3 px-4 italic leading-tight">
                                            Tu artefacto será registrado en tu perfil de {project.title} una vez confirmado el pago.
                                        </p>
                                    </div>
                                )}

                                {needsFaucet && account && isTestnet && (
                                    <div className="space-y-3 mt-3 text-center">
                                        <button
                                            onClick={handleFaucet}
                                            disabled={isFauceting}
                                            className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold py-3 rounded-xl border border-blue-500/30 flex items-center justify-center gap-2"
                                        >
                                            {isFauceting ? (
                                                <><Loader2 className="w-5 h-5 animate-spin" /> Obteniendo fondos...</>
                                            ) : (
                                                <><Coins className="w-5 h-5" /> Obtener Sepolia ETH de Prueba</>
                                            )}
                                        </button>
                                        <button onClick={() => setShowFaucetGuide(true)} className="text-xs text-blue-400/60 hover:text-blue-400 mx-auto flex items-center gap-1 mt-2">
                                            <HelpCircle className="w-3 h-3" /> ¿Necesitas aún más ETH Sepolia?
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'processing' && (
                            <div className="text-center py-8 space-y-4">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-16 h-16 border-4 border-lime-500/30 border-t-lime-500 rounded-full mx-auto"
                                />
                                <h3 className="text-xl font-bold text-white">Procesando...</h3>
                                <p className="text-sm text-zinc-400 mt-1">Confirmando en la blockchain.</p>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="text-center py-2 space-y-6">
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    className="relative w-24 h-24 mx-auto"
                                >
                                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                                    <div className="relative w-full h-full bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/30">
                                        <CheckCircle className="w-12 h-12" />
                                    </div>
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1] }} 
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -top-2 -right-2 bg-purple-600 text-[10px] font-black px-2 py-1 rounded-lg text-white shadow-lg"
                                    >
                                        + {safeAmount}
                                    </motion.div>
                                </motion.div>

                                <div>
                                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">¡Operación Exitosa!</h3>
                                    <p className="text-zinc-500 text-xs font-medium mt-1">Has asegurado {safeAmount} artefactos en {project.title}.</p>
                                </div>

                                {progression.isUnlockMoment && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4 text-left"
                                    >
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                            <Sparkles className="w-5 h-5 text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Nuevo Rango Alcanzado</p>
                                            <p className="text-sm font-bold text-white uppercase">{progression.nextTier?.name}</p>
                                        </div>
                                    </motion.div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={handleLevelUpReward}
                                        className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center gap-2 hover:border-purple-500/50 transition-colors group"
                                    >
                                        <Gift className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">Invitar & Ganar</span>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            onClose();
                                            router.push(`/projects/${project.slug}/dao`);
                                        }}
                                        className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col items-center gap-2 hover:border-emerald-500/50 transition-colors group w-full"
                                    >
                                        <PlusCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest text-center">Unirse al DAO</span>
                                    </button>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <button 
                                        onClick={onClose} 
                                        className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-[0.2em] text-[11px] hover:bg-zinc-200 transition-colors"
                                    >
                                        Finalizar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* External Faucet Guide Modal */}
                <AnimatePresence>
                    {showFaucetGuide && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowFaucetGuide(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 10 }}
                                className="relative w-full max-w-sm bg-zinc-900 border border-blue-500/30 rounded-2xl p-6"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-white">
                                        <h3 className="font-bold">Guía de Faucets</h3>
                                        <button onClick={() => setShowFaucetGuide(false)}><X className="w-4 h-4" /></button>
                                    </div>
                                    <p className="text-xs text-gray-400">Usa el Google Faucet oficial para obtener ETH Sepolia.</p>
                                    <a
                                        href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                                        target="_blank" rel="noopener noreferrer"
                                        className="block w-full py-2 bg-blue-600 text-white text-center rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                                    >
                                        Ir a Google Faucet <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <button onClick={() => setShowFaucetGuide(false)} className="w-full text-gray-500 text-xs mt-2">Volver</button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AnimatePresence>
    );
}

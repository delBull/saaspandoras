'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveAccount, TransactionButton, useWalletBalance, ConnectButton } from "thirdweb/react";
import { prepareContractCall, defineChain, getContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { toast } from "sonner";
import { CheckCircle, Loader2, Lock, ArrowRight, ShieldCheck, Flame, ChevronRight, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useConnectModal } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import useSWR from 'swr';

// Protocol Engine Imports
import { resolveExecution } from "@/lib/protocol-engine/execute";
import { resolveArtifactPrice } from "@/lib/protocol-engine/artifact/pricing";
import { calculatePhaseStatus, getRawPhases } from "@/lib/phase-utils";

// Generic fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CheckoutClient({ project, rawPhase, tierName }: { project: any, rawPhase: any, tierName: string }) {
    const router = useRouter();
    const account = useActiveAccount();
    const [step, setStep] = useState<'checkout' | 'processing' | 'success' | 'fast_lane'>('checkout');
    const [amount, setAmount] = useState("1");
    const [contractPrice, setContractPrice] = useState<bigint | undefined>(undefined);
    const [isPriceLoading, setIsPriceLoading] = useState(true);
    const [totalSupply, setTotalSupply] = useState<number>(0);
    const [isStatusLoading, setIsStatusLoading] = useState(true);

    const [fastLaneEmail, setFastLaneEmail] = useState('');
    const [isSubmittingFastLane, setIsSubmittingFastLane] = useState(false);
    const [cameFromFastLane, setCameFromFastLane] = useState(false);
    const { connect } = useConnectModal();

    // Deep Styling Configuration
    const brandColor = project.themeColor || '#10b981'; // Emerald 500 default
    
    // Resolve clean tier name for display (handles URI encoding like %C3%A9)
    const displayTierName = useMemo(() => {
        try {
            return decodeURIComponent(tierName);
        } catch (e) {
            return tierName;
        }
    }, [tierName]);

    // Chain detection
    const rawChainId = Number(project.chainId);
    const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;
    const chain = useMemo(() => defineChain(safeChainId), [safeChainId]);
    const isTestnet = safeChainId === 11155111 || safeChainId === 84532;

    const { data: balanceData } = useWalletBalance({
        client,
        chain,
        address: account?.address,
    });

    // Resolve Context Target
    const targetAddress = rawPhase?.artifactAddress ||
        project.licenseContractAddress ||
        project.w2eConfig?.licenseToken?.address ||
        project.contractAddress ||
        project.utilityContractAddress;

    const targetContract = useMemo(() => getContract({
        client,
        chain,
        address: targetAddress || "0x0000000000000000000000000000000000000000"
    }), [chain, targetAddress]);

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
                    fallbackPrice: rawPhase?.tokenPrice || 0,
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
    }, [targetAddress, targetContract, rawPhase?.tokenPrice, safeChainId]);

    const isBase = safeChainId === 8453 || safeChainId === 84532;
    const decimals = BigInt(isBase ? 1e6 : 1e18);
    const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));
    const effectivePriceInWei = contractPrice ?? BigInt(Math.round((rawPhase?.tokenPrice || 0) * Number(decimals)));
    const totalCostWei = BigInt(safeAmount) * effectivePriceInWei;
    const totalCostDisplay = Number(totalCostWei) / Number(decimals);

    const [hasEnsuredAccess, setHasEnsuredAccess] = useState(false);
    const [isCheckingAccess, setIsCheckingAccess] = useState(false);

    // 🧬 Real-time Phase Activation Engine (Unified)
    const accumulatedTokensBefore = useMemo(() => {
        if (!project || !rawPhase) return 0;
        try {
            const phases = getRawPhases(project);
            let acc = 0;
            for (const p of phases) {
                // Match by ID or Name (resilient)
                if (String(p.id || "") === String(rawPhase.id || "") || 
                    String(p.name || "").toLowerCase().trim() === String(rawPhase.name || "").toLowerCase().trim()) {
                    break;
                }
                acc += Number(p.tokenAllocation || 0);
            }
            return acc;
        } catch (e) {
            return 0;
        }
    }, [project, rawPhase]);

    const isPhaseActive = useMemo(() => {
        if (!rawPhase || isStatusLoading) return false;
        // Optimization: during global bootstrap we use 0, but here we use the precise offset
        const statusData = calculatePhaseStatus(rawPhase, totalSupply, accumulatedTokensBefore);
        return statusData.isClickable || statusData.status === 'active';
    }, [rawPhase, totalSupply, isStatusLoading, accumulatedTokensBefore]);

    // 🛡️ On-chain Status Synchronization
    useEffect(() => {
        if (!targetContract) return;

        const { readContract } = require("thirdweb");
        
        async function syncStatus() {
            try {
                const supply = await readContract({
                    contract: targetContract,
                    method: "function totalSupply() view returns (uint256)",
                    params: []
                });
                
                // Normalization Engine: 
                // If the supply is astronomical, it's likely an ERC-20 with 18 decimals.
                // Otherwise, treat as an ERC-721/Artifact count.
                const rawSupply = BigInt(supply);
                const normalizedSupply = rawSupply > BigInt(1e12) ? Number(rawSupply / BigInt(1e18)) : Number(rawSupply);
                
                setTotalSupply(normalizedSupply);
            } catch (e) {
                console.warn("[CheckoutHub] TotalSupply sync failed:", e);
                setTotalSupply(0);
            } finally {
                setIsStatusLoading(false);
            }
        }
        syncStatus();
        const interval = setInterval(syncStatus, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, [targetContract]);

    // 🧬 Real-time Scarcity Engine
    const { data: activityData } = useSWR(
        project?.id ? `/api/dao/recent-activity?projectId=${project.id}&minutes=15` : null,
        fetcher,
        { refreshInterval: 30000 } // Refresh every 30s
    );

    // 🛡️ Pandora Key Handshake (Blocking Pre-requisite)
    useEffect(() => {
        let isMounted = true;
        if (account?.address) {
            setIsCheckingAccess(true);
            fetch('/api/v1/external-commerce/ensure-pandora-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    wallet: account.address,
                    projectId: project.id 
                })
            })
            .then(res => res.json())
            .then(data => {
                if (isMounted) {
                  setHasEnsuredAccess(data.hasProtocolAccess || data.hasPandorasKey);
                  setIsCheckingAccess(false);
                }
            })
            .catch(err => {
              console.warn("Handshake v2 Error:", err);
              if (isMounted) setIsCheckingAccess(false);
            });
        } else {
            setHasEnsuredAccess(false);
            setIsCheckingAccess(false);
        }
        return () => { isMounted = false; };
    }, [account?.address, project.id]);

    const txConfig = useMemo(() => {
        try {
            return resolveExecution({
                type: 'BUY_ARTIFACT',
                payload: {
                    project,
                    phase: rawPhase,
                    utilityContract: { address: project.utilityContractAddress },
                    artifactType: 'Access',
                    quantity: BigInt(safeAmount),
                    account: account?.address || "",
                    chainId: safeChainId,
                    priceInWei: effectivePriceInWei
                }
            });
        } catch (e) {
            return { address: "", method: "", params: [], value: 0n, token: "ETH" };
        }
    }, [project, rawPhase, safeAmount, account, safeChainId, effectivePriceInWei]);

    const handleSuccess = async () => {
        setStep('success');
        toast.success("¡Participación Confirmada!");

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
        } catch (e) {}
    };

    const submitFastLane = async () => {
        if (!fastLaneEmail || !fastLaneEmail.includes('@')) {
            toast.error("Ingresa un correo electrónico válido.");
            return;
        }
        setIsSubmittingFastLane(true);
        try {
            const res = await fetch(`/api/v1/external-commerce/${project.id}/fast-lane`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fastLaneEmail, tier: displayTierName, amount: safeAmount, source: 'checkout_hub', wallet_connected: !!account })
            });
            const data = await res.json();
            if (res.ok) {
                toast.success("Reserva enviada con éxito.");
                setCameFromFastLane(true);
                setStep('success');
            } else {
                toast.error(data.error || "Ocurrió un error");
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setIsSubmittingFastLane(false);
        }
    };

    return (
        <div className="flex flex-col min-h-[100dvh] bg-[#050505] relative overflow-y-auto md:items-center md:justify-center p-4 py-12 md:py-8 lg:p-4">
            {/* Deep Branding Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0" style={{
                background: `radial-gradient(ellipse at top, ${brandColor}20 0%, transparent 70%)`
            }}></div>

            <AnimatePresence mode="wait">
                <motion.div 
                    key={step}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative w-full max-w-[420px] bg-zinc-950/80 backdrop-blur-3xl border border-zinc-800/40 rounded-[2.5rem] shadow-2xl overflow-hidden z-10 p-8"
                >
                    {(step === 'checkout' || step === 'fast_lane') && (
                        <>
                            {/* Header Section */}
                            <div className="text-center mb-8">
                                {project.logoUrl ? (
                                    <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden mb-6 border border-zinc-800" style={{ boxShadow: `0 10px 40px -10px ${brandColor}40` }}>
                                        <Image src={project.logoUrl} alt={project.title} width={64} height={64} className="object-cover" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                                        <span className="text-xl font-black text-white">{project.title.substring(0, 2).toUpperCase()}</span>
                                    </div>
                                )}
                                
                                <h1 className="text-2xl font-black tracking-tight text-white mb-2 leading-tight">
                                    {isPhaseActive ? `Acceso Prioritario: ${project.title}` : `Tier ${displayTierName} No Disponible`}
                                </h1>
                                <p className="text-zinc-400 font-medium text-xs">
                                    {isPhaseActive 
                                        ? `Asegura tu participación en una de las fases exclusivas del protocolo.`
                                        : `Esta fase del protocolo ya no se encuentra abierta para contribución directa.`
                                    }
                                </p>
                            </div>

                            {/* Main View Logic */}
                            {!isPhaseActive ? (
                                /* Inactive Phase UI */
                                <div className="space-y-6 mb-4 animate-in fade-in zoom-in-95 duration-500">
                                    {step === 'checkout' ? (
                                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 text-center">
                                            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                                                <Lock className="w-8 h-8 text-zinc-500" />
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase tracking-tighter">Acceso Restringido</h3>
                                            <p className="text-[11px] text-zinc-400 mb-6 font-medium leading-relaxed">
                                                La fase <strong>{displayTierName.toUpperCase()}</strong> se encuentra cerrada. <br/> Puedes unirte a la lista de espera para acceso prioritario en la próxima ventana.
                                            </p>
                                            
                                            <button 
                                                onClick={() => setStep('fast_lane')}
                                                className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-white/5 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                            >
                                                Entrar por Fast Lane <Zap className="w-4 h-4 fill-black group-hover:scale-125 transition-transform" />
                                            </button>
                                        </div>
                                    ) : (
                                        /* This is where Fast Lane Form will render via the shared block below, 
                                           facilitated by step condition. */
                                        null
                                    )}
                                </div>
                            ) : (
                                /* Active Phase UI */
                                <>
                                    {/* Trust Layer */}
                                    <div className="bg-zinc-900/40 rounded-2xl p-5 mb-6 border border-zinc-800/50">
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                                                    <ShieldCheck className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black uppercase text-zinc-300 tracking-widest mt-0.5">Participación Asegurada</h4>
                                                    <p className="text-[11px] text-zinc-500 leading-tight">Registro inmutable en la red {chain.name || 'Blockchain'}.</p>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-black/40 rounded-xl border border-zinc-900">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Activo Subyacente</span>
                                                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md uppercase">{displayTierName}</span>
                                                </div>
                                                <p className="text-[11px] text-zinc-400 font-medium font-mono leading-relaxed truncate">
                                                    {targetAddress}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Indicator */}
                                    <div className="bg-emerald-500/10 rounded-xl p-4 mb-4 border border-emerald-500/20 text-center">
                                        <h4 className="text-[11px] font-black uppercase text-emerald-400 tracking-widest mb-1 flex items-center justify-center gap-1.5"><Zap className="w-3 h-3" /> {activityData?.count > 0 ? `VENTA ACTIVA (+${activityData.count} usuarios)` : "VENTA ACTIVA — VERIFICADA"}</h4>
                                        <p className="text-[10px] text-emerald-400/80 font-medium">Condiciones preferentes habilitadas para esta fase.</p>
                                    </div>

                                    {/* Action Flow */}
                                    {step === 'checkout' ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center bg-black/50 rounded-2xl p-4 mb-2 border border-zinc-800/80">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Inversión Estimada</span>
                                                    <span className="text-2xl font-black text-white font-mono flex items-center gap-2">
                                                        {isPriceLoading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-700" /> : `${totalCostDisplay.toLocaleString()} ${txConfig.token}`}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 block mb-1">Unidades</span>
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                        className="w-16 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-bold px-2 py-1 outline-none text-right focus:border-indigo-500 transition-colors"
                                                    />
                                                </div>
                                            </div>

                                            {account ? (
                                                <div className="space-y-4">
                                                    {isCheckingAccess ? (
                                                        <button disabled className="w-full h-14 bg-zinc-900 text-zinc-500 font-black rounded-2xl uppercase tracking-widest text-[11px] border border-zinc-800 flex items-center justify-center gap-2">
                                                            <Loader2 className="w-4 h-4 animate-spin" /> Verificando Credenciales...
                                                        </button>
                                                    ) : (
                                                        <TransactionButton
                                                            transaction={() => {
                                                                return prepareContractCall({
                                                                    contract: getContract({ client, chain, address: txConfig.address }),
                                                                    method: txConfig.method as any,
                                                                    params: txConfig.params as any,
                                                                    value: txConfig.value
                                                                });
                                                            }}
                                                            onTransactionSent={() => setStep('processing')}
                                                            onTransactionConfirmed={handleSuccess}
                                                            onError={(error) => {
                                                                console.error(error);
                                                                toast.error(error.message.includes('insufficient') ? "Fondos insuficientes" : "Ocurrió un error en la blockchain.");
                                                            }}
                                                            disabled={!hasEnsuredAccess || isPriceLoading || !txConfig.address}
                                                            className="!w-full !h-14 !rounded-2xl !font-black !uppercase !tracking-widest !text-[11px] !border-none"
                                                            style={{ backgroundColor: brandColor, color: '#000' }}
                                                        >
                                                            {hasEnsuredAccess ? "Asegurar Mi Posición Ahora" : "Preparando Acceso..."}
                                                        </TransactionButton>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="relative group">
                                                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                                    <button 
                                                        onClick={() => connect({
                                                            client,
                                                            chain,
                                                            wallets: [
                                                                inAppWallet({
                                                                    auth: {
                                                                        options: ["email", "google", "apple", "facebook", "passkey"],
                                                                    },
                                                                    executionMode: {
                                                                        mode: "EIP7702",
                                                                        sponsorGas: true,
                                                                    },
                                                                }),
                                                                createWallet("io.metamask"),
                                                            ],
                                                            showThirdwebBranding: false,
                                                            size: "compact",
                                                            title: "Identificación Segura"
                                                        })}
                                                        className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all relative z-10"
                                                    >
                                                        Comenzar Registro Seguro
                                                    </button>
                                                </div>
                                            )}

                                            <button 
                                                onClick={() => setStep('fast_lane')}
                                                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                            >
                                                Reservar con medios tradicionales <ArrowRight className="w-3 h-3 inline ml-1" />
                                            </button>
                                        </div>
                                    ) : null}
                                </>
                            )}

                            {/* Shared Fast Lane Form (Visible in both active/inactive states when step is fast_lane) */}
                            {step === 'fast_lane' && (
                                <div className="space-y-4 animate-in fade-in zoom-in-95">
                                    <input 
                                        type="email" 
                                        placeholder="Tu correo electrónico empresarial/personal"
                                        value={fastLaneEmail}
                                        onChange={(e) => setFastLaneEmail(e.target.value)}
                                        className="w-full h-14 bg-zinc-900 border border-zinc-700 rounded-2xl px-5 text-sm text-white focus:outline-none focus:border-white transition-colors"
                                    />
                                    <button 
                                        disabled={isSubmittingFastLane}
                                        onClick={submitFastLane}
                                        className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmittingFastLane ? <Loader2 className="w-4 h-4 animate-spin" /> : "Asegurar Reserva"}
                                    </button>
                                    <button 
                                        onClick={() => setStep('checkout')}
                                        className="w-full py-3 text-[10px] font-black uppercase text-zinc-500 hover:text-zinc-300 transition-colors"
                                    >
                                        Volver Atrás
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {step === 'processing' && (
                        <div className="py-12 flex flex-col items-center text-center">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-8">
                                <div className="w-16 h-16 border-[3px] rounded-full border-t-white border-r-white/30 border-b-white/10 border-l-white/10" style={{ borderTopColor: brandColor }}></div>
                            </motion.div>
                            <h3 className="text-xl font-black text-white mb-2">Estamos validando tu transacción.</h3>
                            <p className="text-sm font-medium text-zinc-400">Esto puede tomar unos segundos mientras confirmamos tu acceso en la red.</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-6 text-left animate-in fade-in zoom-in">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                            </div>
                            
                            {cameFromFastLane ? (
                                <>
                                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">Validación en Progreso</h2>
                                    <p className="text-zinc-400 font-medium text-sm mb-2">
                                        Tu acceso está en proceso de validación. Un asesor del protocolo puede ayudarte a completar tu entrada prioritaria.
                                    </p>
                                    <p className="text-zinc-300 font-bold text-sm mb-6">¿Qué prefieres hacer ahora?</p>
                                    
                                    <div className="space-y-3">
                                        <a href="mailto:soporte@pandoras.finance" className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group">
                                            Agendar asesoría privada
                                        </a>
                                        <a href="https://t.me/PandorasOfficial" target="_blank" rel="noopener noreferrer" className="w-full py-4 text-center text-[10px] uppercase font-black tracking-widest text-zinc-400 hover:text-white transition-colors block border border-zinc-800 rounded-2xl">
                                            Continuar por Telegram
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-black text-white tracking-tight mb-2">Acceso confirmado</h2>
                                    <p className="text-zinc-400 font-medium text-sm mb-4">
                                        Tu posición ha sido registrada correctamente dentro del proyecto.
                                    </p>
                                    
                                    <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 mb-4">
                                        <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-widest mb-3">A partir de ahora puedes:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2 text-xs text-zinc-400 font-medium"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Visualizar tu participación</li>
                                            <li className="flex items-center gap-2 text-xs text-zinc-400 font-medium"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Acceder a tu panel privado</li>
                                            <li className="flex items-center gap-2 text-xs text-zinc-400 font-medium"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Prepararte para las siguientes fases</li>
                                        </ul>
                                    </div>
                                    
                                    <p className="text-[11px] text-emerald-400 font-bold mb-6 text-center">Bienvenido a una posición temprana dentro del protocolo.</p>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => router.push(`/projects/${project.slug}/dao`)}
                                            className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                        >
                                            Ver mi participación <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => window.open(`${window.location.origin}/projects/${project.slug}/dao`, '_blank')}
                                            className="w-full py-4 text-center text-[10px] uppercase font-black tracking-widest text-zinc-400 hover:text-white transition-colors block border border-zinc-800 rounded-2xl"
                                        >
                                            Abrir en nueva pestaña <ArrowRight className="w-3 h-3 inline ml-1 opacity-50" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Context/Trust Narrative Wrapper (Bottom) */}
            <div className="fixed bottom-6 text-center left-0 right-0 z-0">
                <div className="flex flex-col items-center justify-center gap-1.5 px-4">
                    <p className="text-[9px] text-zinc-600 font-medium leading-tight">Procesado de forma segura mediante infraestructura blockchain verificable.<br/>Pandoras actúa como capa de validación y registro de accesos.</p>
                </div>
            </div>
        </div>
    );
}

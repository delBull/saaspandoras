'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActiveAccount, TransactionButton, useWalletBalance, ConnectButton, darkTheme } from "thirdweb/react";
import { prepareContractCall, defineChain, getContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { toast } from "sonner";
import { CheckCircle, Loader2, Lock, ArrowRight, ShieldCheck, Flame, ChevronRight, Zap, AlertTriangle, FileText, CheckSquare, Square, X } from 'lucide-react';
import { LegalDocModal } from '@/components/legal/LegalDocModal';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConnectModal } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import useSWR from 'swr';

// Protocol Engine Imports
import { resolveExecution } from "@/lib/protocol-engine/execute";
import { resolveArtifactPrice } from "@/lib/protocol-engine/artifact/pricing";
import { CHAIN_TOKENS } from "@/lib/protocol-engine/artifact/payment";
import { calculatePhaseStatus, getRawPhases } from "@/lib/phase-utils";
import { sanitizeUrl } from "@/lib/project-utils";

// Generic fetcher for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CheckoutClient({ project, rawPhase, tierName }: { project: any, rawPhase: any, tierName: string }) {
    const router = useRouter();
    const account = useActiveAccount();
    const searchParams = useSearchParams();
    const externalOrigin = searchParams.get('origin');

    // Determine the base portal URL. If origin is present, use it.
    const portalUrl = useMemo(() => {
        if (externalOrigin) {
            try {
                const url = new URL(externalOrigin);
                const walletParam = account?.address ? `&wallet=${account.address}` : '';
                return `${url.origin}/portal?membership=active${walletParam}`;
            } catch (e) {
                return null;
            }
        }
        return null;
    }, [externalOrigin, account?.address]);
    const [step, setStep] = useState<'checkout' | 'processing' | 'success' | 'fast_lane'>('checkout');
    const [amount, setAmount] = useState("1");
    const [contractPrice, setContractPrice] = useState<bigint | undefined>(undefined);
    const [isPriceLoading, setIsPriceLoading] = useState(true);
    const [totalSupply, setTotalSupply] = useState<number>(0);
    const [isStatusLoading, setIsStatusLoading] = useState(true);

    const [fastLaneEmail, setFastLaneEmail] = useState('');
    const [fastLaneName, setFastLaneName] = useState('');
    const [fastLanePhone, setFastLanePhone] = useState('');
    const [isSubmittingFastLane, setIsSubmittingFastLane] = useState(false);
    const [cameFromFastLane, setCameFromFastLane] = useState(false);
    const [fastLaneStage, setFastLaneStage] = useState<'form' | 'intent' | 'instructions' | 'success'>('form');
    const [purchaseRef, setPurchaseRef] = useState<string | null>(null);
    const [bankInstructions, setBankInstructions] = useState<any>(null);
    const [isConfirmedIntent, setIsConfirmedIntent] = useState(false);
    const [showGuide, setShowGuide] = useState(false);
    const { connect } = useConnectModal();

    // Legal Stack State
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
    const [activeLegalDoc, setActiveLegalDoc] = useState<'agreement' | 'risk-disclosure' | null>(null);
    const [legalChecks, setLegalChecks] = useState({
        agreement: false,
        nature: false,
        risk: false
    });
    const allLegalChecked = legalChecks.agreement && legalChecks.nature && legalChecks.risk;

    const openLegalDoc = (type: 'agreement' | 'risk-disclosure') => {
        setActiveLegalDoc(type);
    };

    // Deep Styling Configuration
    const brandColor = project.themeColor || '#10b981'; // Emerald 500 default

    // Resolve clean tier name for display (handles URI encoding like %C3%A9)
    // ✨ FIX: Prioritize the actual phase name from the DB over the URL parameter
    const displayTierName = useMemo(() => {
        if (rawPhase && rawPhase.name) return rawPhase.name;
        try {
            return decodeURIComponent(tierName);
        } catch (e) {
            return tierName;
        }
    }, [tierName, rawPhase]);

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
                // Determine Phase Index for on-chain lookup
                const phaseIndex = rawPhase?.phaseIndex !== undefined ? rawPhase.phaseIndex : undefined;

                const { price } = await resolveArtifactPrice({
                    contract: targetContract,
                    fallbackPrice: rawPhase?.tokenPrice || 0,
                    chainId: safeChainId,
                    phaseIndex: phaseIndex
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

    const tokenConfig = CHAIN_TOKENS[safeChainId] || CHAIN_TOKENS[11155111]!;
    const decimals = BigInt(Math.pow(10, tokenConfig.decimals));
    const safeAmount = Math.max(1, Math.floor(Number(amount) || 1));

    // Normalize Phase using unified engine (S'Narai & V2 handling)
    const normalizedPhases = getRawPhases(project);
    const matchedPhase = rawPhase ? normalizedPhases.find((p: any) =>
        String(p.id || "") === String(rawPhase?.id || "") ||
        String(p.name || "").toLowerCase().trim() === String(rawPhase?.name || "").toLowerCase().trim()
    ) : undefined;

    let effectivePriceInWei = (contractPrice && contractPrice > 0n)
        ? contractPrice
        : BigInt(Math.round((matchedPhase?.tokenPrice || rawPhase?.tokenPrice || 0) * Number(decimals)));

    const totalCostWei = BigInt(safeAmount) * effectivePriceInWei;
    const totalCostDisplay = Number(totalCostWei) / Number(decimals);
    const currencySymbol = tokenConfig.symbol;

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
            console.log("🛡️ [CheckoutHub] Starting Handshake for:", account.address);
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
                  console.log("🛡️ [CheckoutHub] Handshake Result:", data);
                  // 🧬 Resilient Access: In staging/testnet, we allow the user to proceed
                  // if the handshake call was successful, even if the background mint is still pending.
                  // The contract itself will act as the final guard.
                  setHasEnsuredAccess(true);
                  setIsCheckingAccess(false);
                }
            })
            .catch(err => {
              console.warn("🛡️ [CheckoutHub] Handshake Error (API Path: /api/v1/external-commerce/ensure-pandora-key):", err);
              if (isMounted) {
                // Fail-safe: allow proceeding to let the wallet/contract handle the error
                setHasEnsuredAccess(true);
                setIsCheckingAccess(false);
              }
            });
        } else {
            setHasEnsuredAccess(false);
            setIsCheckingAccess(false);
        }
        return () => { isMounted = false; };
    }, [account?.address, project.id]);

    const txConfig = useMemo(() => {
        try {
            const config = resolveExecution({
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
            console.log("🛠️ [CheckoutHub] Tx Resolved:", config);
            return config;
        } catch (e) {
            console.error("🛠️ [CheckoutHub] Execution Error:", e);
            return { address: "", method: "", params: [], value: 0n, token: currencySymbol };
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

    const submitFastLane = async (confirm = false) => {
        if (!fastLaneEmail || !fastLaneEmail.includes('@')) {
            toast.error("Ingresa un correo electrónico válido.");
            return;
        }
        setIsSubmittingFastLane(true);
        try {
            const res = await fetch(`/api/v1/external-commerce/${project.id}/fast-lane`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: fastLaneEmail,
                    name: fastLaneName,
                    phone: fastLanePhone,
                    tier: displayTierName,
                    amount: safeAmount,
                    source: 'checkout_hub',
                    wallet_connected: !!account,
                    confirmIntent: confirm
                })
            });
            const data = await res.json();
            if (res.ok) {
                if (confirm) {
                    setPurchaseRef(data.purchaseRef);
                    setBankInstructions(data.bankInstructions);
                    setFastLaneStage('instructions');
                    toast.success("Referencia de pago generada.");
                } else {
                    toast.success("Datos registrados. Procediendo a instrucciones.");
                    setFastLaneStage('intent');
                }
                setCameFromFastLane(true);
            } else {
                toast.error(data.error || "Ocurrió un error");
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setIsSubmittingFastLane(false);
        }
    };

    const wallets = useMemo(() => [
        inAppWallet({ auth: { options: ["email", "google", "apple", "facebook", "passkey"] } }),
        createWallet("io.metamask")
    ], []);

    // 🛡️ AUTH GATE: Force centered login if no wallet is connected
    if (!account?.address) {
        return (
            <div className="flex flex-col min-h-[100dvh] bg-[#050505] relative items-center justify-center p-6 overflow-hidden">
                {/* Deep Branding Background Effects */}
                <div className="fixed inset-0 pointer-events-none z-0" style={{
                    background: `radial-gradient(ellipse at top, ${brandColor}30 0%, transparent 70%)`
                }}></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="z-10 w-full max-w-[380px] flex flex-col items-center space-y-8 p-10 bg-zinc-950/50 backdrop-blur-3xl border border-zinc-800/50 rounded-[2.5rem] shadow-2xl"
                >
                    <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center bg-zinc-900 group">
                        {sanitizeUrl(project.logoUrl || project.imageUrl) ? (
                            <img
                                src={sanitizeUrl(project.logoUrl || project.imageUrl)!}
                                alt={project.title}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            />
                        ) : (
                            <span className="text-2xl font-black text-white">{project.title.substring(0, 2).toUpperCase()}</span>
                        )}
                    </div>

                    <div className="text-center space-y-3">
                        <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{project.title}</h2>
                        <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Identificación Requerida</p>
                    </div>

                    <div className="w-full relative scale-[1.05] flex justify-center">
                        <ConnectButton
                            client={client}
                            chain={chain}
                            wallets={wallets}
                            connectButton={{
                                label: "Activa tu acceso",
                            }}
                            connectModal={{
                                size: "compact",
                                title: `Acceder a ${project.title}`,
                                showThirdwebBranding: false,
                            }}
                            theme={darkTheme({
                                colors: {
                                    primaryButtonBg: brandColor,
                                    primaryButtonText: "#000",
                                }
                            })}
                        />
                    </div>

                    <p className="text-[10px] text-zinc-600 font-medium text-center leading-relaxed">
                        Conecta tu billetera o usa tu correo para validar tu acceso al protocolo de forma segura.
                    </p>
                </motion.div>

                <div className="fixed bottom-8 text-center opacity-30">
                     <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-black">Pandoras Security Layer</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-[100dvh] bg-[#050505] relative overflow-x-hidden md:items-center md:justify-center p-4 py-12 md:py-8 lg:p-4">
            {/* Legal Document Modal */}
            {activeLegalDoc && (
                <LegalDocModal
                    type={activeLegalDoc}
                    projectName={project.slug || 'snarai'}
                    onClose={() => setActiveLegalDoc(null)}
                />
            )}
            {/* Deep Branding Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                {/* Project Cover Photo as Background */}
                {sanitizeUrl(project.coverPhotoUrl) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.3, scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${sanitizeUrl(project.coverPhotoUrl)})` }}
                    />
                )}

                {/* Deep Overlay Gradients */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0" style={{
                    background: `radial-gradient(ellipse at center, ${brandColor}15 0%, #050505 100%)`
                }}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
            </div>

            {/* Global Session & Navigation Cluster */}
            <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-2">
                <div className="scale-90 origin-top-right">
                    <ConnectButton
                        client={client}
                        chain={chain}
                        wallets={wallets}
                        theme={darkTheme({
                            colors: {
                                primaryButtonBg: brandColor,
                                primaryButtonText: "#000",
                            }
                        })}
                    />
                </div>
                <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="flex items-center gap-2 text-[8px] uppercase font-black tracking-[0.2em] text-zinc-600 hover:text-zinc-300 transition-colors mr-2"
                >
                    {showGuide ? "Ocultar Guía" : "Guía de Usuario"}
                    <ChevronRight className={`w-2 h-2 transition-transform ${showGuide ? 'rotate-90' : ''}`} />
                </button>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8 w-full max-w-[900px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-[420px] bg-zinc-950/80 backdrop-blur-3xl border border-zinc-800/40 rounded-[2.5rem] shadow-2xl overflow-hidden p-8"
                    >
                    {(step === 'checkout' || step === 'fast_lane') && (
                        <>
                            {/* Header Section */}
                            <div className="text-center mb-8 relative">
                                {sanitizeUrl(project.logoUrl || project.imageUrl) ? (
                                    <div className="w-16 h-16 mx-auto rounded-2xl overflow-hidden mb-6 border border-zinc-800 group" style={{ boxShadow: `0 10px 40px -10px ${brandColor}40` }}>
                                        <img
                                            src={sanitizeUrl(project.logoUrl || project.imageUrl)!}
                                            alt={project.title}
                                            width={64}
                                            height={64}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
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
                                    {/* Consolidated Info Row */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        {/* Trust Layer */}
                                        <div className="bg-zinc-900/40 rounded-xl p-3 border border-zinc-800/50 flex flex-col justify-center">
                                            <div className="flex items-start gap-2">
                                                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[8px] font-black uppercase text-zinc-300 tracking-widest mt-0.5 mb-0.5">Participación Asegurada</h4>
                                                    <p className="text-[8px] text-zinc-500 leading-tight">Registro inmutable en la red.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Indicator */}
                                        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 flex flex-col justify-center">
                                            <h4 className="text-[8px] font-black uppercase text-emerald-400 tracking-widest mb-1 flex items-center gap-1.5">
                                                <Zap className="w-3 h-3" /> {activityData?.count > 0 ? `VENTA ACTIVA (+${activityData.count})` : "VENTA ACTIVA — VERIFICADA"}
                                            </h4>
                                            <p className="text-[8px] text-emerald-400/80 font-medium leading-tight">Condiciones preferentes habilitadas.</p>
                                        </div>
                                    </div>

                                    {/* Action Flow */}
                                    {step === 'checkout' ? (
                                        <div className="space-y-4">
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-center">
                                                <h4 className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1 flex items-center justify-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Aviso Importante</h4>
                                                <p className="text-[9px] text-red-400/80 font-medium">
                                                    Los Certificados son instrumentos de participación digital. <strong>NO representan:</strong> propiedad inmobiliaria directa, acciones societarias ni rendimientos garantizados. Participación sujeta a los términos del ecosistema.
                                                </p>
                                            </div>

                                            <div className="flex justify-between items-center bg-black/50 rounded-2xl p-4 mb-2 border border-zinc-800/80">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Inversión Estimada</span>
                                                    <span className="text-2xl font-black text-white font-mono flex items-center gap-2">
                                                        {isPriceLoading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-700" /> : `${totalCostDisplay < 1 ? totalCostDisplay.toFixed(4) : totalCostDisplay.toLocaleString()} ${currencySymbol}`}
                                                    </span>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 block mb-1">Unidades</span>
                                                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 rounded-lg p-1">
                                                        <button
                                                            onClick={() => setAmount(prev => String(Math.max(1, Number(prev) - 1)))}
                                                            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={amount}
                                                            onChange={(e) => setAmount(e.target.value)}
                                                            className="w-10 bg-transparent text-white font-bold text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                        />
                                                        <button
                                                            onClick={() => setAmount(prev => String(Number(prev) + 1))}
                                                            className="w-6 h-6 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {isCheckingAccess ? (
                                                    <button disabled className="w-full h-14 bg-zinc-900 text-zinc-500 font-black rounded-2xl uppercase tracking-widest text-[11px] border border-zinc-800 flex items-center justify-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" /> Verificando Credenciales...
                                                    </button>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {!isLegalModalOpen ? (
                                                            <button
                                                                onClick={() => setIsLegalModalOpen(true)}
                                                                disabled={isPriceLoading || !txConfig.address || !hasEnsuredAccess}
                                                                className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] border-none ${(isPriceLoading || !txConfig.address || !hasEnsuredAccess) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                                                                style={{
                                                                    backgroundColor: !hasEnsuredAccess ? '#3f3f46' : brandColor,
                                                                    color: !hasEnsuredAccess ? '#a1a1aa' : '#000',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {isPriceLoading ? "Calculando..." : (hasEnsuredAccess ? "Continuar con la Participación" : "Preparando Acceso...")}
                                                            </button>
                                                        ) : (
                                                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
                                                                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                                                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2"><FileText className="w-3 h-3 text-narai-gold" /> Validación Legal Requerida</h3>
                                                                    <button onClick={() => setIsLegalModalOpen(false)} className="text-zinc-500 hover:text-white text-xs">Cerrar</button>
                                                                </div>
                                                                
                                                                <div className="space-y-4 py-2">
                                                                    <label className="flex items-start gap-3 cursor-pointer group">
                                                                        <div className="mt-0.5" onClick={() => setLegalChecks(prev => ({...prev, agreement: !prev.agreement}))}>
                                                                            {legalChecks.agreement ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                                                                        </div>
                                                                         <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">He leído y acepto el <button type="button" onClick={() => openLegalDoc('agreement')} className="text-emerald-400 hover:underline">Acuerdo Marco de Participación Digital</button>.</p>
                                                                    </label>

                                                                    <label className="flex items-start gap-3 cursor-pointer group">
                                                                        <div className="mt-0.5" onClick={() => setLegalChecks(prev => ({...prev, nature: !prev.nature}))}>
                                                                            {legalChecks.nature ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                                                                        </div>
                                                                        <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">Entiendo que <strong>NO</strong> estoy adquiriendo propiedad inmobiliaria directa, acciones societarias ni rendimientos garantizados.</p>
                                                                    </label>

                                                                    <label className="flex items-start gap-3 cursor-pointer group">
                                                                        <div className="mt-0.5" onClick={() => setLegalChecks(prev => ({...prev, risk: !prev.risk}))}>
                                                                            {legalChecks.risk ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                                                                        </div>
                                                                         <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">He leído y acepto el <button type="button" onClick={() => openLegalDoc('risk-disclosure')} className="text-emerald-400 hover:underline">Aviso Integral de Riesgos</button>.</p>
                                                                    </label>
                                                                </div>

                                                                <TransactionButton
                                                                    transaction={() => {
                                                                        if (!txConfig.address) throw new Error("Configuración de contrato no válida.");
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
                                                                        console.error("Transacción Fallida:", error);
                                                                        let errorMsg = "Error en el protocolo.";
                                                                        const msg = error.message?.toLowerCase() || "";

                                                                        if (msg.includes('insufficient')) errorMsg = "Fondos insuficientes.";
                                                                        else if (msg.includes('user rejected')) errorMsg = "Transacción cancelada.";
                                                                        else if (msg.includes('already owned') || msg.includes('already minted')) errorMsg = "Ya posees esta participación.";
                                                                        else if (msg.includes('invalid key') || msg.includes('clientid')) errorMsg = "Error de configuración del protocolo.";

                                                                        toast.error(errorMsg);
                                                                    }}
                                                                    disabled={!allLegalChecked || isPriceLoading || !txConfig.address}
                                                                    className={`!w-full !h-14 !rounded-2xl !font-black !uppercase !tracking-widest !text-[11px] !border-none ${(!allLegalChecked || isPriceLoading || !txConfig.address) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                                                                    style={{
                                                                        backgroundColor: brandColor,
                                                                        color: '#000',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    {isPriceLoading ? "Calculando..." : "Confirmar Participación"}
                                                                </TransactionButton>
                                                            </div>
                                                        )}

                                                        {!hasEnsuredAccess && !isCheckingAccess && (
                                                            <p className="text-[10px] text-zinc-500 text-center font-bold px-4">
                                                                Estamos sincronizando tu llave de acceso para esta red. Espera un momento.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* User Guide Section */}
                                                <div className="mt-8 pt-6 border-t border-zinc-800/50 space-y-4">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
                                                            <Zap className="w-3 h-3" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Tu Acceso Inteligente</h5>
                                                            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                                                                Al usar métodos tradicionales (Google, Apple, Facebook), se crea automáticamente una <strong>Smart Wallet</strong> vinculada a tu cuenta. Tu conexión estará siempre asegurada mediante tu login habitual.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start gap-3">
                                                        <div className="p-1.5 bg-zinc-500/10 rounded-lg text-zinc-400">
                                                            <Lock className="w-3 h-3" />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1">Gestión de Sesión</h5>
                                                            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                                                                ¿Quieres usar un método diferente? Puedes desconectarte haciendo clic en el botón de billetera arriba a la derecha y seleccionar <strong>"Disconnect"</strong> para iniciar con otra cuenta.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setStep('fast_lane')}
                                                    className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
                                                >
                                                    Reserva con Métodos Tradicionales <ArrowRight className="w-3 h-3 inline ml-1" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : null}
                                </>
                            )}

                            {/* 🚀 INSTITUTIONAL FAST LANE / OFFLINE FLOW */}
                            {step === 'fast_lane' && (
                                <div className="space-y-6">
                                    {fastLaneStage === 'form' && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="text-center mb-4">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-narai-gold/10 border border-narai-gold/20 rounded-full mb-2">
                                                    <ShieldCheck className="w-3 h-3 text-narai-gold" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-narai-gold">Acceso Institucional</span>
                                                </div>
                                                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                                                    Completa tus datos para recibir las instrucciones de transferencia bancaria (CLABE).
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <input
                                                    type="text"
                                                    placeholder="Nombre Completo"
                                                    value={fastLaneName}
                                                    onChange={(e) => setFastLaneName(e.target.value)}
                                                    className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-narai-gold transition-colors"
                                                />
                                                <input
                                                    type="email"
                                                    placeholder="Correo electrónico"
                                                    value={fastLaneEmail}
                                                    onChange={(e) => setFastLaneEmail(e.target.value)}
                                                    className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-narai-gold transition-colors"
                                                />
                                                <input
                                                    type="tel"
                                                    placeholder="WhatsApp (Opcional)"
                                                    value={fastLanePhone}
                                                    onChange={(e) => setFastLanePhone(e.target.value)}
                                                    className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-narai-gold transition-colors"
                                                />
                                            </div>
                                            <button
                                                onClick={() => submitFastLane(false)}
                                                disabled={isSubmittingFastLane}
                                                className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-white/5 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                            >
                                                {isSubmittingFastLane ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continuar"}
                                            </button>
                                            <button
                                                onClick={() => setStep('checkout')}
                                                className="w-full py-2 text-[10px] uppercase font-black tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors"
                                            >
                                                Volver al checkout
                                            </button>
                                        </div>
                                    )}

                                    {fastLaneStage === 'intent' && (
                                        <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                                            <div className="w-16 h-16 bg-narai-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-narai-gold/20">
                                                <Zap className="text-narai-gold w-8 h-8 fill-narai-gold/20" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white italic">¿Estás listo para invertir?</h3>
                                                <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                                                    Al confirmar, bloquearemos tu posición por un monto de <strong>${safeAmount.toLocaleString()} USD</strong> y generaremos tu referencia única de transferencia.
                                                </p>
                                            </div>
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => submitFastLane(true)}
                                                    disabled={isSubmittingFastLane}
                                                    className="w-full h-14 bg-narai-gold text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-narai-gold/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                                >
                                                    {isSubmittingFastLane ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : "YA ESTOY LISTO PARA INVERTIR"}
                                                </button>
                                                <button
                                                    onClick={() => setFastLaneStage('form')}
                                                    className="text-[10px] uppercase font-black tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors"
                                                >
                                                    Volver a editar datos
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {fastLaneStage === 'instructions' && bankInstructions && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="bg-narai-gold/5 border border-narai-gold/20 rounded-2xl p-6 space-y-4">
                                                <div className="text-center pb-2 border-b border-narai-gold/10">
                                                    <p className="text-[10px] font-black uppercase text-narai-gold tracking-widest">Instrucciones de Transferencia</p>
                                                </div>
                                                <div className="space-y-4 py-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] uppercase font-black text-zinc-500">Beneficiario</span>
                                                        <span className="text-xs font-bold text-white">{bankInstructions.beneficiary}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] uppercase font-black text-zinc-500">Banco</span>
                                                        <span className="text-xs font-bold text-white">{bankInstructions.bank}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] uppercase font-black text-zinc-500">CLABE</span>
                                                        <span className="text-sm font-black font-mono text-narai-gold">{bankInstructions.clabe}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <span className="text-[10px] uppercase font-black text-white/40">Referencia</span>
                                                        <span className="text-sm font-black font-mono text-white select-all">{bankInstructions.reference}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] uppercase font-black text-zinc-500">Monto exacto</span>
                                                        <span className="text-lg font-black text-white italic">${bankInstructions.amount.toLocaleString()} USD</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center space-y-4">
                                                <p className="text-[10px] text-zinc-500 leading-relaxed italic">
                                                    Tu posición aparecerá como <strong>"PENDIENTE"</strong> en tu portal hasta que validemos la transferencia. Por favor, asegúrate de incluir la referencia exacta.
                                                </p>
                                                <button
                                                    onClick={() => setStep('success')}
                                                    className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-colors"
                                                >
                                                    YA REALICÉ MI TRANSFERENCIA
                                                </button>
                                            </div>
                                        </div>
                                    )}
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
                                        <a
                                            href={`https://wa.me/${project.whatsappPhone || '523222741987'}?text=${encodeURIComponent(`Hola, acabo de reservar mi lugar en ${project.title} (${displayTierName}) y quiero coordinar el pago.`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full h-14 bg-[#25D366] text-white font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                        >
                                            <Zap className="w-4 h-4 fill-current" /> Hablar por WhatsApp
                                        </a>
                                        <a href="mailto:soporte@pandoras.finance" className="w-full py-4 text-center text-[10px] uppercase font-black tracking-widest text-zinc-400 hover:text-white transition-colors block border border-zinc-800 rounded-2xl">
                                            Agendar asesoría privada
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
                                        <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-widest mb-3">Documentación Legal Asignada:</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2 text-xs text-emerald-400 font-medium"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Certificado Individual de Participación</li>
                                            <li className="flex items-center gap-2 text-xs text-zinc-400 font-medium"><button onClick={() => openLegalDoc('agreement')} className="hover:text-white transition-colors flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-zinc-500" /> Acuerdo Marco de Participación</button></li>
                                            <li className="flex items-center gap-2 text-xs text-zinc-400 font-medium"><button onClick={() => openLegalDoc('risk-disclosure')} className="hover:text-white transition-colors flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-zinc-500" /> Aviso Integral de Riesgos</button></li>
                                        </ul>
                                    </div>

                                    <p className="text-[11px] text-emerald-400 font-bold mb-6 text-center">Bienvenido a una posición temprana dentro del protocolo.</p>

                                    <div className="space-y-3">
                                        <button
                                            onClick={() => {
                                                if (portalUrl) {
                                                    window.location.href = portalUrl;
                                                } else {
                                                    router.push(`/projects/${project.slug}/dao`);
                                                }
                                            }}
                                            className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                        >
                                            {portalUrl ? "Ir a mi portal" : "Ver mi participación"} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={() => window.open(portalUrl || `${window.location.origin}/projects/${project.slug}/dao`, '_blank')}
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

                {/* User Onboarding Guide (Smart Wallet & Persistence) - Sidebar Layout */}
                <AnimatePresence>
                    {showGuide && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="w-full lg:w-[320px] space-y-6"
                        >
                            <div className="bg-zinc-950/50 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-800/50 shadow-2xl">
                                <h5 className="text-[11px] font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Identidad Digital (Smart Wallet)
                                </h5>
                                <p className="text-[11px] text-zinc-400 leading-relaxed mb-6 font-medium">
                                    Al usar tu correo o redes sociales, creamos una <strong>Smart Wallet</strong> inmutable.
                                    Tu participación en <strong>{project.title}</strong> queda ligada a esta identidad de forma permanente.
                                </p>
                                <div className="space-y-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Persistencia</p>
                                        <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Si cierras sesión, solo vuelve a conectar el mismo correo para recuperar tu acceso.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Seguridad</p>
                                        <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">No necesitas frases semilla. Tu correo es tu llave maestra mediante Passkeys.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-950/50 backdrop-blur-xl rounded-[2rem] p-8 border border-zinc-800/50 shadow-2xl">
                                <h5 className="text-[11px] font-black uppercase text-white tracking-widest mb-4 flex items-center gap-2">
                                    <Zap className="w-3.5 h-3.5 text-lime-400" /> Acceso al Portal
                                </h5>
                                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                                    Una vez completado el pago, podrás ver tus métricas, votar en el DAO y reclamar recompensas en el <strong>Portal S&apos;Narai</strong>.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


            {/* Context/Trust Narrative Wrapper (Bottom) */}
            <div className="fixed bottom-6 text-center left-0 right-0 z-0">
                <div className="flex flex-col items-center justify-center gap-1.5 px-4">
                    <p className="text-[9px] text-zinc-600 font-medium leading-tight">Procesado de forma segura mediante infraestructura blockchain verificable.<br />Pandoras actúa como capa de validación y registro de accesos.</p>
                </div>
            </div>
        </div>
    );
}

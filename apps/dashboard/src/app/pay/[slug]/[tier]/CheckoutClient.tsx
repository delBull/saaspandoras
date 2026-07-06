'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
    const referralCode = searchParams.get('ref');

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
    const isMountedRef = useRef(true);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const handshakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [step, setStep] = useState<'checkout' | 'processing' | 'success' | 'fast_lane'>('checkout');
    const [amount, setAmount] = useState(searchParams.get('quantity') || "1");
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
    const [mxnRate, setMxnRate] = useState<number | null>(null);
    const [buyerEmail, setBuyerEmail] = useState('');
    const [newsletterConsent, setNewsletterConsent] = useState(true);

    useEffect(() => {
        let isMounted = true;
        fetch('https://api.exchangerate-api.com/v4/latest/USD')
            .then(res => res.json())
            .then(data => {
                if (isMounted && data?.rates?.MXN) {
                    setMxnRate(data.rates.MXN);
                }
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, []);

    // Legal Stack State
    const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
    const [activeLegalDoc, setActiveLegalDoc] = useState<'agreement' | 'risk-disclosure' | 'phase-dynamics' | null>(null);
    const [legalChecks, setLegalChecks] = useState({
        agreement: false,
        nature: false,
        risk: false
    });
    const [imageError, setImageError] = useState(false);
    const allLegalChecked = legalChecks.agreement && legalChecks.nature && legalChecks.risk;

    const openLegalDoc = (type: 'agreement' | 'risk-disclosure' | 'phase-dynamics') => {
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
        isMountedRef.current = true;

        function runHandshake() {
            if (!account?.address) return;
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
                if (!isMountedRef.current) return;
                console.log("🛡️ [CheckoutHub] Handshake Result:", data);

                if (data.mintPending) {
                    // Sponsored mint is in progress. Start polling to wait for it to finish!
                    setIsCheckingAccess(false);
                    setHasEnsuredAccess(false);
                    
                    if (!pollIntervalRef.current) {
                        pollIntervalRef.current = setInterval(() => {
                            console.log("🛡️ [CheckoutHub] Polling for background mint completion...");
                            fetch('/api/v1/external-commerce/ensure-pandora-key', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    wallet: account.address,
                                    projectId: project.id
                                })
                            })
                            .then(res => res.json())
                            .then(pollData => {
                                if (isMountedRef.current && !pollData.mintPending && pollData.success) {
                                    console.log("🛡️ [CheckoutHub] Background mint finished successfully!");
                                    if (pollIntervalRef.current) {
                                        clearInterval(pollIntervalRef.current);
                                        pollIntervalRef.current = null;
                                    }
                                    setHasEnsuredAccess(true);
                                }
                            }).catch(() => {});
                        }, 3000);
                    }
                } else {
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    if (handshakeTimeoutRef.current) {
                        clearTimeout(handshakeTimeoutRef.current);
                        handshakeTimeoutRef.current = null;
                    }
                    setHasEnsuredAccess(true);
                    setIsCheckingAccess(false);
                }
            })
            .catch(err => {
              console.warn("🛡️ [CheckoutHub] Handshake Error:", err);
              if (isMountedRef.current) {
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
                if (handshakeTimeoutRef.current) {
                    clearTimeout(handshakeTimeoutRef.current);
                    handshakeTimeoutRef.current = null;
                }
                setHasEnsuredAccess(true);
                setIsCheckingAccess(false);
              }
            });
        }

        if (account?.address) {
            runHandshake();
            
            handshakeTimeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    console.warn("🛡️ [CheckoutHub] Handshake safety timeout reached. Bypassing...");
                    if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current);
                        pollIntervalRef.current = null;
                    }
                    setHasEnsuredAccess(true);
                    setIsCheckingAccess(false);
                }
            }, 8000); // Safe 8-second timeout
        } else {
            setHasEnsuredAccess(false);
            setIsCheckingAccess(false);
        }

        return () => {
            isMountedRef.current = false;
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            if (handshakeTimeoutRef.current) clearTimeout(handshakeTimeoutRef.current);
        };
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

    const handleSuccess = async (receipt?: any) => {
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
                    txHash: receipt?.transactionHash || receipt?.receipt?.transactionHash,
                    buyerEmail: buyerEmail || undefined,
                    newsletterConsent,
                    referralCode
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
                    amount: totalCostDisplay,
                    quantity: safeAmount,
                    source: 'checkout_hub',
                    wallet_connected: !!account,
                    wallet_address: account?.address || null,
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
                {/* Global Session & Navigation Cluster (Auth Gate version) */}
                <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-2">
                    <button
                        onClick={() => setShowGuide(!showGuide)}
                        className="flex items-center gap-2 text-[8px] uppercase font-black tracking-[0.2em] text-zinc-600 hover:text-zinc-300 transition-colors mr-2"
                    >
                        {showGuide ? "Ocultar Guía" : "Guía de Usuario"}
                        <ChevronRight className={`w-2 h-2 transition-transform ${showGuide ? 'rotate-90' : ''}`} />
                    </button>
                </div>

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
                        {sanitizeUrl(project.logoUrl || project.logo_url || project.imageUrl) ? (
                            <img
                                src={sanitizeUrl(project.logoUrl || project.logo_url || project.imageUrl)!}
                                alt={project.title}
                                width={80}
                                height={80}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
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
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 font-sans relative overflow-x-hidden">
            {/* Legal Document Modal */}
            {activeLegalDoc && (
                <LegalDocModal
                    type={activeLegalDoc}
                    projectName={project.slug || 'snarai'}
                    onClose={() => setActiveLegalDoc(null)}
                />
            )}

            {/* Dynamic Glass Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                {sanitizeUrl(project.coverPhotoUrl) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.2, scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${sanitizeUrl(project.coverPhotoUrl)})` }}
                    />
                )}
                <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 30%, ${brandColor}20 0%, #050505 70%)` }} />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-30 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            {/* Global Session & Navigation Cluster */}
            <div className="fixed top-6 right-6 z-50 flex flex-col items-end gap-3">
                <div className="scale-90 origin-top-right shadow-2xl">
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
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-24 min-h-screen flex items-center justify-center">
                
                {/* Horizontal Container (Grid) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 w-full max-w-[1100px] items-start">
                    
                    {/* LEFT COLUMN: Project Context & Info */}
                    <div className="lg:col-span-5 flex flex-col space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6"
                        >
                            {/* Logo & Badge */}
                            <div className="flex flex-col gap-4">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
                                    <div className="absolute inset-0 blur-md group-hover:opacity-70 transition-opacity" style={{ backgroundColor: brandColor, opacity: 0.3 }} />
                                    {sanitizeUrl(project.logoUrl || project.imageUrl) && !imageError ? (
                                        <img 
                                            src={sanitizeUrl(project.logoUrl || project.imageUrl)!} 
                                            alt={project.title} 
                                            className="w-full h-full object-cover relative z-10 transition-transform group-hover:scale-110"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-900 border border-zinc-800 flex items-center justify-center relative z-10">
                                            <span className="text-2xl font-black text-white">{project.title.substring(0, 2).toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <span className="px-3 py-1 rounded-full border bg-opacity-10 text-[10px] font-bold tracking-widest uppercase mb-3 inline-block" style={{ borderColor: `${brandColor}50`, backgroundColor: `${brandColor}20`, color: brandColor }}>
                                        Acceso Prioritario
                                    </span>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none mb-3">
                                        {project.title}
                                    </h1>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-zinc-300">
                                    {isPhaseActive ? `Fondo: ${displayTierName}` : (
                                        rawPhase && calculatePhaseStatus(rawPhase, totalSupply, accumulatedTokensBefore).status === 'upcoming'
                                            ? `Fondo ${displayTierName} Próximamente` 
                                            : `Fondo ${displayTierName} Finalizado`
                                    )}
                                </h2>
                                <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                                    {isPhaseActive
                                        ? `Asegura tu participación en una de las fases exclusivas del proyecto mediante nuestra infraestructura institucional.`
                                        : (rawPhase && calculatePhaseStatus(rawPhase, totalSupply, accumulatedTokensBefore).status === 'upcoming'
                                            ? `Esta fase aún no ha comenzado. Regresa pronto o entra por Fast Lane para recibir noticias.`
                                            : `Este fondo de inversión ya no se encuentra abierto para contribución directa.`)
                                    }
                                </p>
                            </div>

                            {/* Status Row */}
                            {isPhaseActive && (
                                <div className="grid grid-cols-2 gap-3 pt-4">
                                    <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/20">
                                        <h4 className="text-[10px] font-black uppercase text-emerald-400 tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5" /> {activityData?.count > 0 ? `VENTA ACTIVA (+${activityData.count})` : "VENTA ACTIVA"}
                                        </h4>
                                        <p className="text-[10px] text-emerald-400/80 font-medium leading-tight">Condiciones preferentes habilitadas.</p>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                        <div className="flex items-start gap-2">
                                            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase text-zinc-300 tracking-widest mb-1">Registro Inmutable</h4>
                                                <p className="text-[10px] text-zinc-500 leading-tight">Participación asegurada on-chain.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Disclaimer */}
                            {isPhaseActive && (
                                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 mt-4">
                                    <h4 className="text-[10px] font-black uppercase text-red-400 tracking-widest mb-1 flex items-center gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5" /> Aviso Legal
                                    </h4>
                                    <p className="text-[10px] text-red-400/80 font-medium leading-relaxed">
                                        Los Certificados son instrumentos de participación digital. NO representan propiedad inmobiliaria directa, acciones societarias ni rendimientos garantizados.
                                    </p>
                                </div>
                            )}

                            {/* User Onboarding Guide Toggle */}
                            <div className="pt-4 border-t border-white/5">
                                <button
                                    onClick={() => setShowGuide(!showGuide)}
                                    className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white transition-colors"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    {showGuide ? "Ocultar Detalles de Identidad" : "¿Cómo funciona mi Smart Wallet?"}
                                    <ChevronRight className={`w-3 h-3 transition-transform ${showGuide ? 'rotate-90' : ''}`} />
                                </button>
                            </div>

                        </motion.div>

                        {/* Guide Content */}
                        <AnimatePresence>
                            {showGuide && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 overflow-hidden"
                                >
                                    <div className="bg-zinc-950/50 backdrop-blur-xl rounded-3xl p-6 border border-zinc-800/50 shadow-xl">
                                        <h5 className="text-[11px] font-black uppercase text-white tracking-widest mb-3 flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Identidad Digital
                                        </h5>
                                        <p className="text-[10px] text-zinc-400 leading-relaxed mb-4 font-medium">
                                            Al usar tu correo o redes sociales, creamos una <strong>Smart Wallet</strong> inmutable vinculada permanentemente.
                                        </p>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Persistencia</p>
                                                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Si cierras sesión, solo vuelve a conectar el mismo correo para recuperar tu acceso.</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Acceso al Portal</p>
                                                <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Una vez completado el pago, podrás ver tus métricas, votar y reclamar recompensas en tu portal personal.</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>

                    {/* RIGHT COLUMN: Interactive Glassmorphism Form */}
                    <div className="lg:col-span-7 relative">
                        {/* Background Glow for Panel */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `${brandColor}15` }} />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step + (isPhaseActive ? 'active' : 'inactive')}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.6 }}
                                className="relative bg-zinc-950/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_-20px_rgba(0,0,0,0.5)] p-6 md:p-8 overflow-hidden"
                            >
                                {/* Subtle top glare */}
                                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                {!isPhaseActive && step !== 'fast_lane' ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-6 border border-zinc-700">
                                            <Lock className="w-8 h-8 text-zinc-500" />
                                        </div>
                                        <h3 className="text-xl font-black text-white mb-3 tracking-tighter uppercase">Acceso Restringido</h3>
                                        <p className="text-xs text-zinc-400 mb-8 font-medium leading-relaxed max-w-sm mx-auto">
                                            La fase <strong>{displayTierName.toUpperCase()}</strong> se encuentra completada o no está disponible. <br/> Únete a la lista de espera por Fast Lane.
                                        </p>
                                        <button
                                            onClick={() => setStep('fast_lane')}
                                            className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                        >
                                            Entrar por Fast Lane <Zap className="w-4 h-4 fill-black group-hover:scale-125 transition-transform" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {step === 'checkout' && (
                                            <>
                                                {/* Amount Selector */}
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-black/40 rounded-3xl p-5 border border-white/5 gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-1">Inversión Estimada</span>
                                                        <span className="text-3xl font-black text-white font-mono flex items-center gap-2">
                                                            {isPriceLoading ? <Loader2 className="w-5 h-5 animate-spin text-zinc-700" /> : `${totalCostDisplay < 1 ? Number(totalCostDisplay.toFixed(8)).toString() : totalCostDisplay.toLocaleString()} ${currencySymbol}`}
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                                                        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 block mb-1">Unidades</span>
                                                        <div className="flex items-center justify-between md:justify-end gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-1 w-full md:w-auto">
                                                            <button onClick={() => setAmount(prev => String(Math.max(1, Number(prev) - 1)))} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-lg">-</button>
                                                            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-16 bg-transparent text-white font-bold text-xl text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                                            <button onClick={() => setAmount(prev => String(Number(prev) + 1))} className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors text-lg">+</button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Area */}
                                                <div className="space-y-4 pt-2">
                                                    {isCheckingAccess ? (
                                                        <button disabled className="w-full h-14 bg-zinc-900 text-zinc-500 font-black rounded-2xl uppercase tracking-widest text-[11px] border border-zinc-800 flex items-center justify-center gap-2">
                                                            <Loader2 className="w-4 h-4 animate-spin" /> Verificando Credenciales...
                                                        </button>
                                                    ) : !isLegalModalOpen ? (
                                                        <button
                                                            onClick={() => setIsLegalModalOpen(true)}
                                                            disabled={isPriceLoading || !txConfig.address || !hasEnsuredAccess}
                                                            className={`w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs border-none transition-all ${(!txConfig.address || !hasEnsuredAccess || isPriceLoading) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                                                            style={{
                                                                backgroundColor: !hasEnsuredAccess ? '#3f3f46' : brandColor,
                                                                color: !hasEnsuredAccess ? '#a1a1aa' : '#000',
                                                                boxShadow: hasEnsuredAccess ? `0 0 30px -10px ${brandColor}` : 'none'
                                                            }}
                                                        >
                                                            {isPriceLoading ? "Calculando..." : (!hasEnsuredAccess ? "Preparando Acceso..." : "Continuar con la Participación")}
                                                        </button>
                                                    ) : (
                                                        <motion.div 
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-5"
                                                        >
                                                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                                                <h3 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                                                                    <FileText className="w-4 h-4" style={{ color: brandColor }} /> Validación Legal
                                                                </h3>
                                                                <button onClick={() => setIsLegalModalOpen(false)} className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest">Cerrar</button>
                                                            </div>
                                                            
                                                            <div className="space-y-4">
                                                                <label className="flex items-start gap-4 cursor-pointer group">
                                                                    <div className="mt-0.5" onClick={() => setLegalChecks(prev => ({...prev, agreement: !prev.agreement}))}>
                                                                        {legalChecks.agreement ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                                                                    </div>
                                                                    <p className="text-xs text-zinc-400 leading-relaxed">He leído y acepto el <button type="button" onClick={(e) => { e.preventDefault(); openLegalDoc('agreement'); }} className="text-emerald-400 hover:underline">Acuerdo Marco de Participación</button>.</p>
                                                                </label>

                                                                <label className="flex items-start gap-4 cursor-pointer group">
                                                                    <div className="mt-0.5" onClick={() => setLegalChecks(prev => ({...prev, nature: !prev.nature}))}>
                                                                        {legalChecks.nature ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                                                                    </div>
                                                                    <p className="text-xs text-zinc-400 leading-relaxed">Entiendo que <strong>NO</strong> adquiero acciones ni propiedad directa, sino participación digital.</p>
                                                                </label>

                                                                <label className="flex items-start gap-4 cursor-pointer group">
                                                                    <div className="mt-0.5" onClick={() => setLegalChecks(prev => ({...prev, risk: !prev.risk}))}>
                                                                        {legalChecks.risk ? <CheckSquare className="w-5 h-5 text-emerald-500" /> : <Square className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                                                                    </div>
                                                                    <p className="text-xs text-zinc-400 leading-relaxed">He leído y acepto el <button type="button" onClick={(e) => { e.preventDefault(); openLegalDoc('risk-disclosure'); }} className="text-emerald-400 hover:underline">Aviso Integral de Riesgos</button> y las <button type="button" onClick={(e) => { e.preventDefault(); openLegalDoc('phase-dynamics'); }} className="text-emerald-400 hover:underline">Cláusulas de Fases de proyecto</button>.</p>
                                                                </label>
                                                            </div>

                                                            <div className="pt-4 border-t border-white/5 space-y-4">
                                                                <div className="flex flex-col gap-1.5">
                                                                    <label className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold ml-1">Correo Electrónico (Opcional)</label>
                                                                    <input
                                                                        type="email"
                                                                        value={buyerEmail}
                                                                        onChange={(e) => setBuyerEmail(e.target.value)}
                                                                        placeholder="tu@correo.com"
                                                                        className="w-full h-12 bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                                                                    />
                                                                </div>
                                                                <label className="flex items-start gap-3 cursor-pointer group px-1">
                                                                    <div className="mt-0.5" onClick={() => setNewsletterConsent(prev => !prev)}>
                                                                        {newsletterConsent ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />}
                                                                    </div>
                                                                    <p className="text-[10px] text-zinc-500 leading-relaxed">Deseo recibir actualizaciones y mi comprobante por correo.</p>
                                                                </label>
                                                            </div>

                                                            <div className="pt-2">
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
                                                                        transition: 'all 0.2s',
                                                                        boxShadow: allLegalChecked ? `0 0 20px -5px ${brandColor}` : 'none'
                                                                    }}
                                                                >
                                                                    {isPriceLoading ? "Calculando..." : "Confirmar Participación"}
                                                                </TransactionButton>
                                                            </div>
                                                        </motion.div>
                                                    )}

                                                    {!hasEnsuredAccess && !isCheckingAccess && (
                                                        <p className="text-[10px] text-zinc-500 text-center font-bold px-4 pt-2">
                                                            Estamos sincronizando tu llave de acceso para esta red. Espera un momento.
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="mt-6 pt-4 border-t border-white/5">
                                                    <button onClick={() => setStep('fast_lane')} className="w-full py-3 rounded-xl border border-white/5 bg-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                                        Pago Tradicional (Wire / Transferencia) <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        {/* FAST LANE */}
                                        {step === 'fast_lane' && (
                                            <div className="space-y-6">
                                                {fastLaneStage === 'form' && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                        <div className="text-center mb-6">
                                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full mb-3">
                                                                <ShieldCheck className="w-3 h-3 text-[#D4AF37]" />
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Acceso Institucional</span>
                                                            </div>
                                                            <h3 className="text-xl font-bold text-white mb-2">Pago Tradicional</h3>
                                                            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed max-w-sm mx-auto">
                                                                Completa tus datos para recibir las instrucciones de transferencia bancaria (CLABE/Wire).
                                                            </p>
                                                        </div>
                                                        <div className="space-y-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Nombre Completo"
                                                                value={fastLaneName}
                                                                onChange={(e) => setFastLaneName(e.target.value)}
                                                                className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                                                            />
                                                            <input
                                                                type="email"
                                                                placeholder="Correo electrónico"
                                                                value={fastLaneEmail}
                                                                onChange={(e) => setFastLaneEmail(e.target.value)}
                                                                className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                                                            />
                                                            <input
                                                                type="tel"
                                                                placeholder="WhatsApp (Opcional)"
                                                                value={fastLanePhone}
                                                                onChange={(e) => setFastLanePhone(e.target.value)}
                                                                className="w-full h-12 bg-black/50 border border-white/10 rounded-xl px-5 text-sm text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                                                            />
                                                        </div>
                                                        <div className="pt-2">
                                                            <button
                                                                onClick={() => submitFastLane(false)}
                                                                disabled={isSubmittingFastLane}
                                                                className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-white/10 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                                            >
                                                                {isSubmittingFastLane ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generar Instrucciones"}
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => setStep('checkout')}
                                                            className="w-full py-3 text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white transition-colors"
                                                        >
                                                            Volver al checkout Web3
                                                        </button>
                                                    </div>
                                                )}

                                                {fastLaneStage === 'intent' && (
                                                    <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500 py-6">
                                                        <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/20">
                                                            <Zap className="text-[#D4AF37] w-8 h-8 fill-[#D4AF37]/20" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-black text-white italic">¿Confirmar Inversión?</h3>
                                                            <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed max-w-sm mx-auto">
                                                                Al confirmar, bloquearemos tu posición por un monto de <strong>{safeAmount} Unidades ({totalCostDisplay.toLocaleString()} USD)</strong> y generaremos tu referencia única de transferencia.
                                                            </p>
                                                        </div>
                                                        <div className="space-y-3 pt-4">
                                                            <button
                                                                onClick={() => submitFastLane(true)}
                                                                disabled={isSubmittingFastLane}
                                                                className="w-full h-14 bg-[#D4AF37] text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg shadow-[#D4AF37]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                                            >
                                                                {isSubmittingFastLane ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : "SÍ, ESTOY LISTO PARA INVERTIR"}
                                                            </button>
                                                            <button
                                                                onClick={() => setFastLaneStage('form')}
                                                                className="text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white transition-colors block w-full py-2"
                                                            >
                                                                Volver a editar datos
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {fastLaneStage === 'instructions' && bankInstructions && (
                                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-6 space-y-4">
                                                            <div className="text-center pb-3 border-b border-[#D4AF37]/10">
                                                                <p className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest">Instrucciones de Transferencia</p>
                                                            </div>
                                                            <div className="space-y-4 py-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] uppercase font-black text-zinc-500">Beneficiario</span>
                                                                    <span className="text-xs font-bold text-white text-right max-w-[60%]">{bankInstructions.beneficiary}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] uppercase font-black text-zinc-500">Banco</span>
                                                                    <span className="text-xs font-bold text-white">{bankInstructions.bank}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] uppercase font-black text-zinc-500">CLABE / IBAN</span>
                                                                    <span className="text-sm font-black font-mono text-[#D4AF37]">{bankInstructions.clabe}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
                                                                    <span className="text-[10px] uppercase font-black text-white/50">Referencia Obligatoria</span>
                                                                    <span className="text-sm font-black font-mono text-white select-all">{bankInstructions.reference}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                                                                    <span className="text-[10px] uppercase font-black text-zinc-500">Monto exacto</span>
                                                                    <div className="flex flex-col items-end">
                                                                        {mxnRate ? (
                                                                            <>
                                                                                <span className="text-xl font-black text-white italic">${(bankInstructions.amount * mxnRate).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MXN</span>
                                                                                <span className="text-[10px] text-zinc-400 font-medium">(${bankInstructions.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD)</span>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-xl font-black text-white italic">${bankInstructions.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-center space-y-5">
                                                            <p className="text-[10px] text-zinc-400 leading-relaxed italic bg-black/30 p-4 rounded-xl border border-white/5">
                                                                Tu posición aparecerá como <strong>"PENDIENTE"</strong> en tu portal hasta que validemos la transferencia. Por favor, asegúrate de incluir la referencia exacta para agilizar la validación.
                                                            </p>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await fetch(`/api/v1/external-commerce/${project.id}/fast-lane/confirm`, {
                                                                            method: 'POST',
                                                                            headers: { 'Content-Type': 'application/json' },
                                                                            body: JSON.stringify({ purchaseRef: bankInstructions.reference })
                                                                        });
                                                                    } catch (e) {} finally {
                                                                        setStep('success');
                                                                    }
                                                                }}
                                                                className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                                            >
                                                                YA REALICÉ MI TRANSFERENCIA
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {step === 'processing' && (
                                            <div className="py-16 flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="mb-8 relative">
                                                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" style={{ backgroundColor: brandColor }} />
                                                    <div className="w-20 h-20 border-[3px] rounded-full border-t-white border-r-white/30 border-b-white/10 border-l-white/10 relative z-10" style={{ borderTopColor: brandColor }}></div>
                                                </motion.div>
                                                <h3 className="text-2xl font-black text-white mb-3">Asegurando Participación</h3>
                                                <p className="text-sm font-medium text-zinc-400 max-w-xs mx-auto">Firmando transacción en la red descentralizada. Por favor aprueba en tu billetera si es requerido.</p>
                                            </div>
                                        )}

                                        {step === 'success' && (
                                            <div className="py-6 text-left animate-in fade-in zoom-in-95">
                                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-8 shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]">
                                                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                                                </div>

                                                {cameFromFastLane ? (
                                                    <>
                                                        <h2 className="text-3xl font-black text-white tracking-tight mb-3">Validación en Progreso</h2>
                                                        <p className="text-zinc-400 font-medium text-sm mb-6 leading-relaxed">
                                                            Tu intención de inversión está registrada. Un asesor del protocolo puede ayudarte a completar tu entrada prioritaria si tienes dudas con el pago.
                                                        </p>

                                                        <div className="space-y-3">
                                                            <a
                                                                href={`https://wa.me/${project.whatsappPhone || '523222741987'}?text=${encodeURIComponent(`Hola, acabo de reservar mi lugar en ${project.title} (${displayTierName}) y quiero coordinar el pago.`)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="w-full h-14 bg-[#25D366] text-white font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                                            >
                                                                <Zap className="w-4 h-4 fill-current" /> Hablar por WhatsApp
                                                            </a>
                                                            <a href="mailto:soporte@pandoras.finance" className="w-full py-4 text-center text-[10px] uppercase font-black tracking-widest text-zinc-400 hover:text-white transition-colors block border border-white/10 rounded-2xl bg-black/40">
                                                                Agendar asesoría privada
                                                            </a>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <h2 className="text-3xl font-black text-white tracking-tight mb-3">Acceso Confirmado</h2>
                                                        <p className="text-zinc-400 font-medium text-sm mb-6 leading-relaxed">
                                                            Tu posición ha sido registrada inmutablemente en la red.
                                                        </p>

                                                        <div className="bg-black/40 rounded-2xl p-5 border border-white/5 mb-6">
                                                            <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-4">Documentación Legal Vinculada:</h4>
                                                            <ul className="space-y-3">
                                                                <li className="flex items-center gap-3 text-xs text-emerald-400 font-bold"><CheckCircle className="w-4 h-4 text-emerald-500" /> Certificado de Participación Emitido</li>
                                                                <li className="flex items-center gap-3 text-xs text-zinc-300 font-medium"><button onClick={() => openLegalDoc('agreement')} className="hover:text-white transition-colors flex items-center gap-1.5"><FileText className="w-4 h-4 text-zinc-500" /> Acuerdo Marco Firmado</button></li>
                                                                <li className="flex items-center gap-3 text-xs text-zinc-300 font-medium"><button onClick={() => openLegalDoc('risk-disclosure')} className="hover:text-white transition-colors flex items-center gap-1.5"><FileText className="w-4 h-4 text-zinc-500" /> Aviso de Riesgos</button></li>
                                                            </ul>
                                                        </div>

                                                        <p className="text-[11px] font-black text-white mb-6 text-center uppercase tracking-widest bg-emerald-500/10 py-3 rounded-xl border border-emerald-500/20" style={{ color: brandColor }}>
                                                            Bienvenido al ecosistema {project.title}
                                                        </p>

                                                        <div className="space-y-3">
                                                            <button
                                                                onClick={() => {
                                                                    if (portalUrl) window.location.href = portalUrl;
                                                                    else router.push(`/projects/${project.slug}/dao`);
                                                                }}
                                                                className="w-full h-14 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px] shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 group"
                                                            >
                                                                {portalUrl ? "Ir a mi portal" : "Ver mi participación"} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                                            </button>
                                                            <button
                                                                onClick={() => window.open(portalUrl || `${window.location.origin}/projects/${project.slug}/dao`, '_blank')}
                                                                className="w-full py-4 text-center text-[10px] uppercase font-black tracking-widest text-zinc-500 hover:text-white transition-colors block border border-white/5 rounded-2xl hover:bg-white/5"
                                                            >
                                                                Abrir en nueva pestaña <ArrowRight className="w-3 h-3 inline ml-1 opacity-50" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </div>
    );
}

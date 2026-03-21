import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, CheckCircle, Loader2, HelpCircle, Copy, ExternalLink, AlertCircle } from 'lucide-react';
import { useActiveAccount, TransactionButton, useWalletBalance } from "thirdweb/react";
import { prepareContractCall, defineChain, getContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { toast } from "sonner";
import Link from 'next/link';

// Protocol Engine Imports
import { resolveExecution } from "@/lib/protocol-engine/execute";
import { resolveArtifactPrice } from "@/lib/protocol-engine/artifact/pricing";

interface ArtifactPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    utilityContract: any;
    phase: any;
}

export default function ArtifactPurchaseModal({ isOpen, onClose, project, utilityContract, phase }: ArtifactPurchaseModalProps) {
    const account = useActiveAccount();
    const [step, setStep] = useState<'review' | 'processing' | 'success'>('review');
    const [amount, setAmount] = useState<string>("1");
    const [isFauceting, setIsFauceting] = useState(false);
    const [needsFaucet, setNeedsFaucet] = useState(false);
    const [showFaucetGuide, setShowFaucetGuide] = useState(false);

    // New Engine States
    const [contractPrice, setContractPrice] = useState<bigint | undefined>(undefined);
    const [isPriceLoading, setIsPriceLoading] = useState(true);

    // Chain detection
    const rawChainId = Number((project as any).chainId);
    const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;
    const chain = defineChain(safeChainId);
    const isTestnet = safeChainId === 11155111 || safeChainId === 84532;

    // Balance check
    const { data: balanceData } = useWalletBalance({
        client,
        chain,
        address: account?.address,
    });

    // 1. Resolve Target Contract
    // Priority handled by the Engine Resolver
    const targetAddress = phase?.artifactAddress || 
                         project.licenseContractAddress || 
                         project.w2eConfig?.licenseToken?.address || 
                         (project as any).contractAddress || 
                         utilityContract?.address;
    
    const targetContract = getContract({ 
        client, 
        chain, 
        address: targetAddress || "0x0000000000000000000000000000000000000000" 
    });

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

    // 3. Calculation & Config Generation
    const decimals = safeChainId === 8453 ? 1e6 : 1e18;
    const effectivePriceInWei = contractPrice ?? BigInt(Math.round((phase?.tokenPrice || 0) * decimals));
    const totalCost = Number(amount) * (Number(effectivePriceInWei) / decimals);

    // Unified Transaction Configuration
    const txConfig = resolveExecution({
        type: 'BUY_ARTIFACT',
        payload: {
            project,
            phase,
            utilityContract,
            artifactType: (phase as any)?.artifactType || 'Access',
            quantity: BigInt(Math.floor(Number(amount) || 0)),
            account: account?.address || "",
            chainId: safeChainId,
            priceInWei: effectivePriceInWei
        }
    });

    const handleSuccess = async () => {
        try {
            await fetch('/api/gamification/track-event', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-wallet-address': account?.address || ""
                },
                body: JSON.stringify({
                    eventType: 'artifact_purchased',
                        metadata: {
                            amount: amount,
                            price: phase?.tokenPrice || 0,
                            project: project.slug,
                            phase: phase.name,
                            protocolId: project.id
                        }
                    })
            });
        } catch (e) {
            console.error("Failed to track gamification event", e);
        }

        setStep('success');
        toast.success("¡Artefactos adquiridos exitosamente!");
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
                                            className={`w-full bg-zinc-950 border rounded-xl p-4 text-white font-mono text-lg focus:outline-none transition-colors ${
                                                Number(amount) > (phase?.stats?.remainingTokens || 0) && (phase?.stats?.remainingTokens > 0)
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
                                                {project.ticker || 'TOKENS'}
                                            </span>
                                        </div>
                                    </div>
                                    {Number(amount) > (phase?.stats?.remainingTokens || 0) && (phase?.stats?.remainingTokens > 0) && (
                                        <p className="text-xs text-red-400 mt-1">
                                            Excedes la disponibilidad de esta fase ({phase?.stats?.remainingTokens?.toLocaleString()}).
                                        </p>
                                    )}
                                </div>

                                {/* Summary */}
                                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Precio por Unidad</span>
                                        <span className="text-white font-mono flex items-center gap-2">
                                            {isPriceLoading ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <>
                                                    {Number(effectivePriceInWei) / (safeChainId === 8453 ? 1e6 : 1e18)} {txConfig.token}
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-lime-400 font-bold font-mono text-lg">
                                            Total: {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {txConfig.token}
                                        </span>
                                    </div>
                                    
                                    {/* Low Balance Warning (Testnet Only) */}
                                    {isTestnet && account && balanceData && (
                                        (() => {
                                            const balanceInEth = Number(balanceData.displayValue);
                                            const totalWithGas = totalCost + 0.002;
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
                                                    <>Adquirir Ahora ({totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {txConfig.token})</>
                                                )}
                                            </TransactionButton>
                                        )
                                    )
                                ) : (
                                    <button disabled className="w-full bg-zinc-700 text-gray-400 font-bold py-4 rounded-xl">
                                        Conecta tu Wallet
                                    </button>
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
                            <div className="text-center py-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30"
                                >
                                    <CheckCircle className="w-8 h-8" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-white mb-2">¡Éxito!</h3>
                                <p className="text-gray-400 mb-6 text-sm">
                                    Has adquirido tus artefactos correctamente.
                                </p>
                                <div className="space-y-3">
                                    <Link href={`/projects/${project.slug}/dao`} onClick={onClose} className="block w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 rounded-xl">
                                        Ir al Panel de Participación (DAO)
                                    </Link>
                                    <button onClick={onClose} className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl">
                                        Cerrar
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

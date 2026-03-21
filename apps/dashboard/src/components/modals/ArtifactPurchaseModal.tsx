'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, ArrowRight, Wallet, CheckCircle, Loader2, ExternalLink, HelpCircle, Copy } from 'lucide-react';
import { useActiveAccount, TransactionButton, useReadContract, useWalletBalance } from "thirdweb/react";
import { prepareContractCall, prepareTransaction, defineChain, getContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { toast } from "sonner";
import Link from 'next/link';

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
    const [amount, setAmount] = useState<string>("1"); // Default amount 1 for License
    const [isFauceting, setIsFauceting] = useState(false);
    const [needsFaucet, setNeedsFaucet] = useState(false);
    const [showFaucetGuide, setShowFaucetGuide] = useState(false);

    // Chain detection
    const rawChainId = Number((project as any).chainId);
    const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;
    const chain = defineChain(safeChainId);
    
    // Faucet Gating: Only on Sepolia (11155111) or Base Sepolia (84532)
    const isTestnet = safeChainId === 11155111 || safeChainId === 84532;

    // Balance check
    const { data: balanceData, isLoading: isBalanceLoading } = useWalletBalance({
        client,
        chain,
        address: account?.address,
    });

    // License Price is usually in Wei or Native Token
    const price = phase?.tokenPrice || 0;

    // Robust contract address resolution
    const resolvedLicenseAddress = 
        project.licenseContractAddress || 
        project.w2eConfig?.licenseToken?.address || 
        (project as any).contractAddress || 
        project.utilityContractAddress || 
        undefined;

    const totalCost = Number(amount) * Number(price);

    const handleSuccess = async () => {
        // Track Gamification Event
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
                        price: price,
                        project: project.slug,
                        phase: phase.name,
                        protocolId: project.id // Added for action logs
                    }
                })
            });
        } catch (e) {
            console.error("Failed to track gamification event", e);
        }

        setStep('success');
        toast.success("¡Artefactos adquiridos exitosamente!");
        // Trigger generic confetti or sound if available (later)
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
            if (!res.ok) throw new Error(data.error || 'Error al solicitar fondos (Múltiples requests no autorizados)');
            
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
        <AnimatePresence>
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
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                const max = phase?.stats?.remainingTokens || 0;
                                                // Allow user to type, but visual warning. Or strict clamp? 
                                                // User asked: "if they try to acquire more ... don't let them"
                                                if (max > 0 && val > max) {
                                                    // Strict clamp or just warning? 
                                                    // "Don't let them" implies strict or disable button.
                                                    // Let's allow typing but show error.
                                                    setAmount(e.target.value);
                                                } else {
                                                    setAmount(e.target.value);
                                                }
                                            }}
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
                                        <span className="text-white font-mono">{price} {(() => {
                                            const rawChainId = Number((project as any).chainId);
                                            const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;
                                            return safeChainId === 8453 ? 'USDC' : 'ETH';
                                        })()}</span>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Total a Pagar</span>
                                        <span className="text-lime-400 font-bold font-mono text-lg">{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} {safeChainId === 8453 ? 'USDC' : 'ETH'}</span>
                                    </div>
                                    
                                    {/* Low Balance Warning (Testnet Only) */}
                                    {isTestnet && account && balanceData && (
                                        (() => {
                                            const balanceInEth = Number(balanceData.displayValue);
                                            const totalWithGas = totalCost + 0.002; // Reduced gas margin to 0.002 ETH for Sepolia
                                            const isLow = balanceInEth < totalWithGas;
                                            
                                            if (isLow && !needsFaucet) {
                                                // Automatically suggest faucet if low on testnet
                                                setNeedsFaucet(true);
                                            }
                                            
                                            return isLow ? (
                                                <div className="mt-2 p-2 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-2">
                                                    <span className="text-orange-400 mt-0.5">⚠️</span>
                                                    <div className="text-xs text-orange-200/80 leading-tight">
                                                        Tu saldo actual ({balanceInEth.toFixed(4)} {balanceData.symbol}) es insuficiente para el costo + gas.
                                                    </div>
                                                </div>
                                            ) : null;
                                        })()
                                    )}
                                </div>

                                {/* Action */}
                                {account ? (
                                    // Check if Treasury is Configured
                                    (!project.treasuryAddress || project.treasuryAddress === "0x0000000000000000000000000000000000000000") ? (
                                        <div className="text-center">
                                            <button disabled className="w-full bg-red-500/10 text-red-400 font-bold py-4 rounded-xl border border-red-500/20 cursor-not-allowed flex items-center justify-center gap-2">
                                                <span className="text-xl">⚠️</span> Configuración Incompleta
                                            </button>
                                            <p className="text-xs text-red-400/80 mt-2">
                                                El proyecto no tiene una Tesorería configurada para recibir fondos.
                                            </p>
                                        </div>
                                    ) : (
                                        // Validate Amount
                                        (Number(amount) > (phase?.stats?.remainingTokens || 0) && (phase?.stats?.remainingTokens > 0)) ? (
                                            <button disabled className="w-full bg-zinc-800 text-gray-500 font-bold py-4 rounded-xl cursor-not-allowed border border-red-500/20">
                                                Excede Disponibilidad
                                            </button>
                                        ) : (
                                            <TransactionButton
                                                transaction={() => {
                                                    // Determine Chain
                                                    const rawChainId = Number((project as any).chainId);
                                                    const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;

                                                    // Prepare Contract
                                                    const targetAddress = utilityContract?.address || resolvedLicenseAddress;
                                                    const targetContract = getContract({
                                                        client,
                                                        chain: defineChain(safeChainId),
                                                        address: targetAddress
                                                    });

                                                    const quantity = BigInt(Math.floor(Number(amount)));
                                                    // Use more precise BigInt math to avoid float issues causing reverts
                                                    const priceInWei = BigInt(Math.round(Number(price) * 1e18));
                                                    const costInWei = priceInWei * quantity;

                                                    return prepareContractCall({
                                                        contract: targetContract,
                                                        method: "function mintWithPayment(uint256 quantity) payable",
                                                        params: [quantity],
                                                        value: costInWei
                                                    });
                                                }}
                                                onTransactionSent={() => {
                                                    setStep('processing');
                                                }}
                                                theme="dark"
                                                onTransactionConfirmed={(tx) => {
                                                    console.log("Transaction confirmed:", tx);
                                                    handleSuccess();
                                                }}
                                                onError={(error) => {
                                                    console.error("Purchase failed", error);
                                                    if (error.message.includes('insufficient funds')) {
                                                        if (isTestnet) {
                                                            setNeedsFaucet(true);
                                                            toast.error("Fondos insuficientes para cubrir el gas y el costo del artefacto.");
                                                        } else {
                                                            toast.error("Fondos insuficientes en tu wallet principal.");
                                                        }
                                                    } else {
                                                        toast.error(`Error: ${error.message}`);
                                                    }
                                                    setStep('review');
                                                }}
                                                className="!w-full !bg-lime-400 hover:!bg-lime-500 !text-black !font-bold !py-4 !rounded-xl"
                                            >
                                                {(() => {
                                                    const rawChainId = Number((project as any).chainId);
                                                    const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;
                                                    const isBase = safeChainId === 8453;
                                                    return `Adquirir Ahora (${totalCost.toFixed(4)} ${isBase ? 'USDC' : 'ETH'})`;
                                                })()}
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
                                            className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold py-3 rounded-xl border border-blue-500/30 flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                        >
                                            {isFauceting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Obteniendo fondos...
                                                </>
                                            ) : (
                                                <>
                                                    <Coins className="w-5 h-5" />
                                                    Obtener Sepolia ETH de Prueba
                                                </>
                                            )}
                                        </button>
                                        
                                        <button 
                                            onClick={() => setShowFaucetGuide(true)}
                                            className="inline-flex items-center gap-1.5 text-xs text-blue-400/60 hover:text-blue-400 transition-colors mx-auto group"
                                        >
                                            <HelpCircle className="w-3.5 h-3.5 group-hover:animate-pulse" />
                                            ¿Necesitas aún más ETH Sepolia?
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
                                <div>
                                    <h3 className="text-xl font-bold text-white">Procesando Adquisición...</h3>
                                    <p className="text-sm text-zinc-400 mt-1">Confirmando transacción en la blockchain.</p>
                                </div>
                                <div className="max-w-xs mx-auto bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-500 font-mono border border-zinc-800">
                                    Por favor no cierres esta ventana.
                                </div>
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
                                <h3 className="text-2xl font-bold text-white mb-2">¡Adquisición Exitosa!</h3>
                                <p className="text-gray-400 mb-6 text-sm">
                                    Has adquirido tus artefactos correctamente. Ahora puedes participar en la gobernanza y utilidades del protocolo.
                                </p>

                                <div className="space-y-3">
                                    <Link href={`/projects/${project.slug}/dao`} onClick={onClose} className="block w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 rounded-xl transition-colors">
                                        Ir al Panel de Participación (DAO)
                                    </Link>
                                    <button onClick={onClose} className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors">
                                        Seguir en el Proyecto
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
                                className="relative w-full max-w-sm bg-zinc-900 border border-blue-500/30 rounded-2xl shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 space-y-5">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                <HelpCircle className="w-6 h-6 text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white leading-tight">Guía de Faucets Especializados</h3>
                                                <p className="text-xs text-blue-400">Obtén más Sepolia para tus pruebas</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setShowFaucetGuide(false)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors">
                                            <X className="w-4 h-4 text-gray-500" />
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-800">
                                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                                <span className="w-5 h-5 bg-blue-500 text-black rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
                                                Copia tu dirección
                                            </h4>
                                            <div className="flex items-center justify-between gap-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-700/50">
                                                <span className="text-[10px] font-mono text-gray-400 truncate">
                                                    {account?.address || "0x..."}
                                                </span>
                                                <button 
                                                    onClick={() => {
                                                        if (account?.address) {
                                                            navigator.clipboard.writeText(account.address);
                                                            toast.success("Dirección copiada");
                                                        }
                                                    }}
                                                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-blue-400"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <p className="text-[11px] text-gray-500 mt-2">
                                                Tu dirección empieza por "0x.." y puedes encontrarla también en el sidebar.
                                            </p>
                                        </div>

                                        <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-800">
                                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                                                <span className="w-5 h-5 bg-blue-500 text-black rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
                                                Visita Google Faucet
                                            </h4>
                                            <p className="text-[11px] text-gray-400 mb-3">
                                                Recomendamos el faucet oficial de Google Cloud por su velocidad y confiabilidad.
                                            </p>
                                            <a 
                                                href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia" 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-blue-900/20"
                                            >
                                                Ir a Google Faucet
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>

                                        <div className="bg-zinc-800/40 rounded-xl p-4 border border-zinc-800">
                                            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                                <span className="w-5 h-5 bg-blue-500 text-black rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
                                                Pega y Obtén
                                            </h4>
                                            <p className="text-[11px] text-gray-400 leading-relaxed">
                                                Pega tu dirección en el campo "Dirección de Billetera" y haz clic en "Receive ETH". ¡Eso es todo!
                                            </p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => setShowFaucetGuide(false)}
                                        className="w-full py-3 text-sm text-gray-400 hover:text-white transition-colors pt-2"
                                    >
                                        Entendido, volver
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div >
        </AnimatePresence >
    );
}

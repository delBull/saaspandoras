'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, ArrowRight, Wallet, CheckCircle, Loader2 } from 'lucide-react';
import { useActiveAccount, TransactionButton, useReadContract } from "thirdweb/react";
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
    const [amount, setAmount] = useState<string>("1000"); // Default amount

    const price = phase?.tokenPrice || 0;

    const totalCost = Number(amount) * Number(price);

    const handleSuccess = async () => {
        // Track Gamification Event
        try {
            await fetch('/api/gamification/track-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventType: 'artifact_purchased',
                    metadata: {
                        amount: amount,
                        price: price,
                        project: project.slug,
                        phase: phase.name
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
                                                    // Let's warn and disable button, but maybe strict clamp input too to be safe?
                                                    // Let's just set to max if they type more? No, that's annoying while typing "100".
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
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Total a Pagar</span>
                                        <span className="text-lime-400 font-bold font-mono text-lg">{totalCost.toLocaleString()} {(() => {
                                            const rawChainId = Number((project as any).chainId);
                                            const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;
                                            return safeChainId === 8453 ? 'USDC' : 'ETH';
                                        })()}</span>
                                    </div>
                                </div>

                                {/* Action */}
                                {account ? (
                                    // Check if Treasury is Configured
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
                                                    // Determine Chain and Currency
                                                    const rawChainId = Number((project as any).chainId);
                                                    const safeChainId = (!isNaN(rawChainId) && rawChainId > 0) ? rawChainId : 11155111;
                                                    const isBase = safeChainId === 8453;

                                                    if (isBase) {
                                                        // USDC on Base (ERC20 Transfer)
                                                        // Price is treated as USDC (e.g. 0.1 = 0.1 USDC)
                                                        // USDC has 6 decimals
                                                        const usdcAmount = BigInt(Math.floor(totalCost * 1e6));
                                                        const USDC_BASE_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

                                                        const usdcContract = getContract({
                                                            client,
                                                            chain: defineChain(safeChainId),
                                                            address: USDC_BASE_ADDRESS
                                                        });

                                                        return prepareContractCall({
                                                            contract: usdcContract,
                                                            method: "function transfer(address to, uint256 value)",
                                                            params: [project.treasuryAddress, usdcAmount]
                                                        });
                                                    } else {
                                                        // ETH on Sepolia/Other (Native Transfer)
                                                        // Price is treated as ETH (e.g. 0.1 = 0.1 ETH)
                                                        // ETH has 18 decimals
                                                        const weiAmount = BigInt(Math.floor(totalCost * 1e18));

                                                        return prepareTransaction({
                                                            to: project.treasuryAddress,
                                                            value: weiAmount,
                                                            chain: defineChain(safeChainId),
                                                            client: client
                                                        });
                                                    }
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
                                                    toast.error(`Error: ${error.message}`);
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
            </div >
        </AnimatePresence >
    );
}

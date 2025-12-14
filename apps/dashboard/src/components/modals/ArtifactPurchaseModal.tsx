'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, ArrowRight, Wallet, CheckCircle } from 'lucide-react';
import { useActiveAccount, TransactionButton, useReadContract } from "thirdweb/react";
import { prepareContractCall, prepareTransaction, defineChain } from "thirdweb";
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
    const [step, setStep] = useState<'review' | 'success'>('review');
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
                                    <label className="text-sm text-gray-400">Cantidad de Artefactos (Tokens)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white font-mono text-lg focus:outline-none focus:border-lime-500/50 transition-colors"
                                            placeholder="0"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                                            {project.ticker || 'TOKENS'}
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Precio por Unidad</span>
                                        <span className="text-white font-mono">${price}</span>
                                    </div>
                                    <div className="h-px bg-white/5" />
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Total a Pagar</span>
                                        <span className="text-lime-400 font-bold font-mono text-lg">${totalCost.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Action */}
                                {account ? (
                                    // Check if Treasury is Configured
                                    (!project.treasuryContractAddress || project.treasuryContractAddress === "0x0000000000000000000000000000000000000000") ? (
                                        <div className="text-center">
                                            <button disabled className="w-full bg-red-500/10 text-red-400 font-bold py-4 rounded-xl border border-red-500/20 cursor-not-allowed flex items-center justify-center gap-2">
                                                <span className="text-xl">⚠️</span> Configuración Incompleta
                                            </button>
                                            <p className="text-xs text-red-400/80 mt-2">
                                                El proyecto no tiene una Tesorería configurada para recibir fondos.
                                            </p>
                                        </div>
                                    ) : (
                                        <TransactionButton
                                            transaction={async () => {
                                                // HYBRID FLOW:
                                                // 1. User sends ETH/USDC to Project Treasury.
                                                // 2. Oracle (Server) detects deposit and calls 'mint' on Utility Token via W2ELoom or directly if authorized.
                                                // Since 'buy' doesn't exist on the ERC20 contract, we simulate the "Purchase" by sending funds to the Treasury.

                                                // Actual Logic for Demo:
                                                // Scale down: 1 USD displayed = 0.001 ETH for safety in testnet.
                                                const ethAmountToPay = totalCost * 0.001;
                                                const weiAmount = BigInt(Math.floor(ethAmountToPay * 1e18));

                                                // Prepare the Native Token Transfer (ETH)
                                                return prepareTransaction({
                                                    to: project.treasuryContractAddress,
                                                    value: weiAmount,
                                                    chain: defineChain(11155111), // Sepolia
                                                    client: client
                                                });
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
                                            Adquirir Ahora ({(totalCost * 0.001).toFixed(4)} ETH)
                                        </TransactionButton>
                                    )
                                ) : (
                                    <button disabled className="w-full bg-zinc-700 text-gray-400 font-bold py-4 rounded-xl">
                                        Conecta tu Wallet
                                    </button>
                                )}
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

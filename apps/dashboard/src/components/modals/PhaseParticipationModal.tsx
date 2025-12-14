'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, ShieldCheck, ArrowRight, Loader2, Coins, Calendar, Flag } from 'lucide-react';
import { useActiveAccount, TransactionButton } from "thirdweb/react";
import { toast } from "sonner";
import type { UtilityPhase } from '@/types/deployment';

interface PhaseParticipationModalProps {
    isOpen: boolean;
    onClose: () => void;
    phase: UtilityPhase | null;
    projectTitle: string;
}

export default function PhaseParticipationModal({ isOpen, onClose, phase, projectTitle }: PhaseParticipationModalProps) {
    const account = useActiveAccount();
    const [step, setStep] = useState<'review' | 'processing' | 'success'>('review');
    const [amount, setAmount] = useState<string>('1');

    if (!isOpen || !phase) return null;

    const price = phase.tokenPrice || 0;
    const currency = "USD"; // Simplification, usually ETH/Stable
    const totalCost = (Number(amount) * price).toFixed(6);

    const handleSuccess = () => {
        setStep('success');
        toast.success(`¡Has participado en la fase ${phase.name} exitosamente!`);
        setTimeout(() => {
            onClose();
            setStep('review');
        }, 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-zinc-900 border border-blue-500/30 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.1)] overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative h-32 bg-zinc-800 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900 z-10" />
                            {phase.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={phase.image} alt="" className="w-full h-full object-cover opacity-50" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-900/40 to-black" />
                            )}
                            <div className="absolute top-4 right-4 z-20">
                                <button onClick={onClose} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="absolute bottom-4 left-6 z-20 flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                                    <Coins className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{phase.name}</h2>
                                    <p className="text-blue-400 text-xs font-medium uppercase tracking-wider">{projectTitle}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {step === 'review' && (
                                <div className="space-y-6">
                                    {/* Phase Details */}
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                                <Calendar className="w-3 h-3" /> Duración
                                            </div>
                                            <div className="text-white font-medium text-sm">
                                                {phase.type === 'time' ? `${phase.limit} Días` : 'Hasta Agotar'}
                                            </div>
                                        </div>
                                        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                                            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                                                <Flag className="w-3 h-3" /> Soft Cap
                                            </div>
                                            <div className="text-white font-medium text-sm">
                                                {phase.isSoftCap ? 'Activado' : 'Sin Riesgo'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Input */}
                                    <div className="space-y-2">
                                        <label htmlFor="token-amount" className="text-sm text-gray-400">Cantidad de Tokens a Adquirir</label>
                                        <div className="relative">
                                            <input
                                                id="token-amount"
                                                type="number"
                                                min="1"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white text-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-bold">
                                                TOKENS
                                            </div>
                                        </div>
                                    </div>

                                    {/* Summary */}
                                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Precio Unitario</span>
                                            <span className="text-white font-mono">${price} {currency}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span className="text-white">Total a Pagar</span>
                                            <span className="text-blue-400 font-mono">${totalCost} {currency}</span>
                                        </div>
                                    </div>

                                    {/* Action */}
                                    <button
                                        onClick={handleSuccess} // TODO: Replace with real TransactionButton when Contract Logic is ready
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                                    >
                                        <span className="flex items-center gap-2 text-base">
                                            Participar Ahora <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </button>
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="text-center py-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"
                                    >
                                        <Coins className="w-10 h-10 text-white" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-white mb-2">¡Participación Exitosa!</h3>
                                    <p className="text-gray-400 mb-6">Has adquirido {amount} tokens de la fase {phase.name}.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

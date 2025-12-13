'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, ShieldCheck, ArrowRight } from 'lucide-react';
import { useActiveAccount, TransactionButton, useReadContract } from "thirdweb/react";
import { prepareContractCall, ContractOptions } from "thirdweb";
import { toast } from "sonner";

interface AccessCardPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    licenseContract: any;
}

export default function AccessCardPurchaseModal({ isOpen, onClose, project, licenseContract }: AccessCardPurchaseModalProps) {
    const account = useActiveAccount();
    const [step, setStep] = useState<'review' | 'processing' | 'success'>('review');

    // Read Price from Contract to ensure accuracy
    const { data: mintPrice } = useReadContract({
        contract: licenseContract,
        method: "function getPrice(uint256 quantity) view returns (uint256)",
        params: [BigInt(1)]
    });

    const handleSuccess = () => {
        setStep('success');
        toast.success("¡Access Card obtenida exitosamente!");
        setTimeout(() => {
            onClose();
            window.location.reload();
        }, 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
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
                        <div className="relative h-32 bg-zinc-800 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900 z-10" />
                            {project.w2eConfig?.accessCardImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={project.w2eConfig.accessCardImage} alt="" className="w-full h-full object-cover opacity-50" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-lime-900/40 to-black" />
                            )}
                            <div className="absolute top-4 right-4 z-20">
                                <button onClick={onClose} className="p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="absolute bottom-4 left-6 z-20 flex items-center gap-3">
                                <div className="w-12 h-12 bg-lime-400 rounded-xl flex items-center justify-center shadow-lg shadow-lime-900/50">
                                    <Ticket className="w-6 h-6 text-black" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-white">Access Card</h2>
                                        <span className="bg-lime-500/20 text-lime-400 text-xs font-bold px-2 py-0.5 rounded-full border border-lime-500/30">GRATIS</span>
                                    </div>
                                    <p className="text-lime-400 text-xs font-medium uppercase tracking-wider">{project.title}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {step === 'review' && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Type Row */}
                                        <div className="flex justify-between items-center py-3 border-b border-zinc-800">
                                            <span className="text-gray-400">Tipo</span>
                                            <span className="text-white flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-lime-400" />
                                                Licencia de Por Vida
                                            </span>
                                        </div>

                                        {/* Info Box */}
                                        <div className="bg-lime-500/5 border border-lime-500/20 rounded-lg p-3">
                                            <p className="text-xs text-lime-200/80 leading-relaxed text-center">
                                                Esta tarjeta te otorga acceso exclusivo a votaciones, utilidades y recompensas dentro del protocolo {project.title}.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    {licenseContract && account ? (
                                        <TransactionButton
                                            transaction={() =>
                                                prepareContractCall({
                                                    contract: licenseContract as any,
                                                    method: "function mintWithPayment(uint256 quantity) payable",
                                                    params: [BigInt(1)],
                                                    value: mintPrice ? BigInt(mintPrice) : (project.w2eConfig?.tokenomics?.price ? BigInt(project.w2eConfig.tokenomics.price * 1e18) : BigInt(0)), // Fallback to config or 0
                                                })
                                            }
                                            theme="dark"
                                            onTransactionConfirmed={handleSuccess}
                                            onError={(error) => toast.error(`Error: ${error.message}`)}
                                            className="!w-full !bg-lime-400 hover:!bg-lime-500 !text-black !font-bold !py-4 !rounded-xl !shadow-lg !shadow-lime-500/20"
                                        >
                                            <span className="flex items-center gap-2 text-base">
                                                Confirmar Adquisición <ArrowRight className="w-4 h-4" />
                                            </span>
                                        </TransactionButton>
                                    ) : (
                                        <button disabled className="w-full bg-zinc-700 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed">
                                            Conecta tu Wallet
                                        </button>
                                    )}
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="text-center py-8">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-6"
                                    >
                                        <Ticket className="w-10 h-10 text-black" />
                                    </motion.div>
                                    <h3 className="text-2xl font-bold text-white mb-2">¡Bienvenido a Bordo!</h3>
                                    <p className="text-gray-400 mb-6">Tu Access Card ha sido emitida exitosamente.</p>
                                    <div className="animate-pulse text-xs text-lime-500 uppercase tracking-widest">Redirigiendo...</div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, ShieldCheck, ArrowRight } from 'lucide-react';
import { useActiveAccount, TransactionButton, useReadContract } from "thirdweb/react";
import { prepareContractCall, ContractOptions, getContract, defineChain } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
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

    // Fallback contract to prevent hook crash when licenseContract is undefined
    const dummyContract = getContract({
        client,
        chain: defineChain(11155111),
        address: "0x0000000000000000000000000000000000000000"
    });

    // Read Price from Contract to ensure accuracy
    const { data: mintPrice } = useReadContract({
        contract: licenseContract || dummyContract,
        method: "function licensePrice() view returns (uint256)",
        params: [],
        queryOptions: { enabled: !!licenseContract }
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
                                        <span className="bg-lime-500/20 text-lime-400 text-xs font-bold px-2 py-0.5 rounded-full border border-lime-500/30">
                                            {mintPrice && Number(mintPrice) > 0 ? `${Number(mintPrice) / 1e18} ETH` : 'GRATIS'}
                                        </span>
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
                                                    // CRITICAL FIX: If mintPrice (on-chain) is not read, DEFAULT TO 0 (FREE).
                                                    // Do NOT fallback to tokenomics.price, as that is for the ERC20 token, not the Access Card.
                                                    value: mintPrice ? BigInt(mintPrice) : BigInt(0),
                                                })
                                            }
                                            theme="dark"
                                            onTransactionConfirmed={handleSuccess}
                                            onError={(error) => toast.error(`Error: ${error.message}`)}
                                            className="!w-full !bg-lime-400 hover:!bg-lime-500 !text-black !font-bold !py-4 !rounded-xl !shadow-lg !shadow-lime-500/20"
                                        >
                                            <span className="flex items-center gap-2 text-base">
                                                {mintPrice && Number(mintPrice) > 0
                                                    ? `Pagar ${Number(mintPrice) / 1e18} ETH`
                                                    : "Obtener Gratis"}
                                                <ArrowRight className="w-4 h-4" />
                                            </span>
                                        </TransactionButton>
                                    ) : (
                                        <button disabled className="w-full bg-zinc-700 text-gray-400 font-bold py-4 rounded-xl cursor-not-allowed">
                                            {licenseContract ? "Conecta tu Wallet" : "Contrato No Disponible"}
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
                                    <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 text-left space-y-3 border border-zinc-700/50">
                                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Próximos Pasos:</h4>
                                        <ul className="space-y-2 text-sm text-gray-300">
                                            <li className="flex items-start gap-2">
                                                <span className="text-lime-400 font-bold">1.</span>
                                                <span>Adquiere <strong>Artefactos (Tokens)</strong> en la pestaña de Estrategia para tener poder de voto.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-lime-400 font-bold">2.</span>
                                                <span>Accede a tu <strong>Panel de Control</strong> para gestionar tus activos.</span>
                                            </li>
                                        </ul>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="w-full bg-lime-400 hover:bg-lime-500 text-black font-bold py-3 rounded-xl transition-colors"
                                    >
                                        Continuar
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

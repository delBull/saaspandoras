'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnectModal } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";

interface RestrictedApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    isWalletConnected: boolean;
    hasAccess?: boolean;
}

export function RestrictedApplicationModal({ isOpen, onClose, isWalletConnected, hasAccess = false }: RestrictedApplicationModalProps) {
    const { connect } = useConnectModal();

    // Handle ESC key to close modal
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Auto-close if user connects and has access while modal is open
    useEffect(() => {
        if (isOpen && isWalletConnected && hasAccess) {
            onClose();
        }
    }, [isOpen, isWalletConnected, hasAccess, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
                    >
                        <div className="w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden relative">
                            {/* Radial gradient effect */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-red-500/10 blur-3xl pointer-events-none" />

                            <div className="p-8 text-center relative z-10">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                    <Lock className="w-8 h-8 text-red-500" />
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h2>
                                <p className="text-zinc-400 mb-8 leading-relaxed">
                                    Esta aplicación está protegida. Necesitas poseer el <strong className="text-white">Apply Pass NFT</strong> para acceder al formulario de creación de protocolos.
                                </p>

                                <div className="space-y-3">
                                    {!isWalletConnected ? (
                                        <Button
                                            onClick={() => connect({ client })}
                                            className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-6 rounded-xl"
                                        >
                                            Conectar Wallet para Verificar
                                        </Button>
                                    ) : hasAccess ? (
                                        <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                                            <p className="text-sm text-green-400 font-medium mb-2 text-center">
                                                ¡Pase Verificado!
                                            </p>
                                            <Button
                                                variant="ghost"
                                                onClick={onClose}
                                                className="w-full text-green-400 hover:text-green-300 hover:bg-green-500/20"
                                            >
                                                Continuar
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700">
                                            <p className="text-sm text-yellow-500 font-medium mb-2 flex items-center justify-center gap-2">
                                                <ShieldAlert className="w-4 h-4" />
                                                Acceso por Invitación
                                            </p>
                                            <p className="text-xs text-zinc-400">
                                                Este protocolo requiere una invitación previa. Contacta a un administrador para recibir tu <strong>Apply Pass</strong>.
                                            </p>
                                        </div>
                                    )}

                                    {!hasAccess && (
                                        <Button
                                            variant="ghost"
                                            onClick={onClose}
                                            className="w-full text-zinc-500 hover:text-white"
                                        >
                                            Cerrar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

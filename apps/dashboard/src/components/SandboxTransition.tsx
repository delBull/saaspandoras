'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RocketLaunchIcon, BeakerIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface SandboxTransitionProps {
    isVisible: boolean;
    targetMode: 'production' | 'sandbox';
    onComplete?: () => void;
}

const TIPS = [
    "En el Sandbox, todos los despliegues son gratuitos usando testnets.",
    "Puedes probar diferentes configuraciones de APY sin riesgo.",
    "Los puntos de gamificación se otorgan por completar pruebas exitosas.",
    "El Sandbox usa redes de prueba como Sepolia o Base Sepolia.",
    "Experimenta con la gobernanza DAO y el sistema de votación aquí."
];

export function SandboxTransition({ isVisible, targetMode, onComplete }: SandboxTransitionProps) {
    const [currentTip, setCurrentTip] = useState(0);

    useEffect(() => {
        if (isVisible) {
            const interval = setInterval(() => {
                setCurrentTip((prev) => (prev + 1) % TIPS.length);
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black overflow-hidden"
                >
                    {/* Animated Background Portal Effect */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.5, 1],
                                rotate: [0, 180, 360],
                                opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vw] rounded-full blur-[100px] ${targetMode === 'sandbox'
                                    ? 'bg-gradient-to-r from-purple-900/30 via-indigo-900/40 to-blue-900/30'
                                    : 'bg-gradient-to-r from-emerald-900/30 via-lime-900/40 to-green-900/30'
                                }`}
                        />

                        {/* Particles */}
                        {[...Array(20)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{
                                    x: Math.random() * 100 + "%",
                                    y: Math.random() * 100 + "%",
                                    opacity: 0,
                                    scale: 0
                                }}
                                animate={{
                                    x: [null, Math.random() * 100 + "%"],
                                    y: [null, Math.random() * 100 + "%"],
                                    opacity: [0, 1, 0],
                                    scale: [0, 1.5, 0]
                                }}
                                transition={{
                                    duration: Math.random() * 3 + 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2
                                }}
                                className={`absolute w-1 h-1 rounded-full ${targetMode === 'sandbox' ? 'bg-indigo-400' : 'bg-lime-400'}`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-md">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            {targetMode === 'sandbox' ? (
                                <div className="mb-6 relative">
                                    <BeakerIcon className="w-20 h-20 text-indigo-400 animate-pulse" />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -top-2 -right-2"
                                    >
                                        <SparklesIcon className="w-8 h-8 text-indigo-300" />
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="mb-6 relative">
                                    <RocketLaunchIcon className="w-20 h-20 text-lime-400 animate-pulse" />
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute -top-2 -right-2"
                                    >
                                        <SparklesIcon className="w-8 h-8 text-lime-300" />
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-3xl font-bold text-white mb-2"
                        >
                            {targetMode === 'sandbox' ? 'Entrando al Sandbox' : 'Volviendo a Producción'}
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="text-zinc-400 mb-12"
                        >
                            {targetMode === 'sandbox'
                                ? 'Preparando entorno de simulación seguro...'
                                : 'Conectando con la infraestructura principal...'}
                        </motion.p>

                        {/* Tip Slider */}
                        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 w-full min-h-[120px] flex flex-col justify-center">
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">Pro Tip</p>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={currentTip}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="text-sm text-zinc-300 leading-relaxed font-medium"
                                >
                                    {TIPS[currentTip]}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-8 w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 4, ease: "easeInOut" }}
                                onAnimationComplete={onComplete}
                                className={`h-full ${targetMode === 'sandbox' ? 'bg-indigo-500' : 'bg-lime-500'}`}
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

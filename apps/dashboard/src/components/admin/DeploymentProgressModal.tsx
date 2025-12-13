import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircleIcon,
    XCircleIcon,
    RocketLaunchIcon,
    ServerStackIcon,
    ShieldCheckIcon,
    CurrencyDollarIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DeploymentProgressModalProps {
    isOpen: boolean;
    status: 'idle' | 'deploying' | 'success' | 'error';
    error?: string;
    onClose: () => void;
    projectTitle: string;
    txHash?: string; // Optional: to show transaction hash if available
}

const STEPS = [
    { id: 1, label: 'Validando Configuración', icon: ShieldCheckIcon, duration: 1500 },
    { id: 2, label: 'Desplegando Contratos (W2E Core)', icon: ServerStackIcon, duration: 4000 },
    { id: 3, label: 'Configurando Tokenomics & Fases', icon: CurrencyDollarIcon, duration: 3000 },
    { id: 4, label: 'Finalizando Integración', icon: RocketLaunchIcon, duration: 2000 },
];

export default function DeploymentProgressModal({
    isOpen,
    status,
    error,
    onClose,
    projectTitle
}: DeploymentProgressModalProps) {
    const [currentStep, setCurrentStep] = useState(0);

    // Simulated Progress Animation
    useEffect(() => {
        if (status === 'deploying' && isOpen) {
            setCurrentStep(0);
            let step = 0;

            const nextStep = () => {
                if (step < STEPS.length - 1) {
                    step++;
                    setCurrentStep(step);
                    // Randomize duration slightly for realism
                    const stepData = STEPS[step];
                    if (stepData) {
                        const duration = stepData.duration * (0.8 + Math.random() * 0.4);
                        setTimeout(nextStep, duration);
                    }
                }
            };

            // Start first step
            const firstStep = STEPS[0];
            if (firstStep) {
                setTimeout(nextStep, firstStep.duration);
            }
        } else if (status === 'success') {
            setCurrentStep(STEPS.length); // All complete
        }
    }, [status, isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/90 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-32 h-32 bg-lime-500/20 rounded-full blur-3xl"></div>

                    <div className="p-8 relative z-10">

                        {/* Status: DEPLOYING */}
                        {status === 'deploying' && (
                            <div className="text-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                    className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-zinc-800 border-t-emerald-500"
                                />
                                <h2 className="text-2xl font-bold text-white mb-2">Desplegando Protocolo</h2>
                                <p className="text-gray-400 mb-8 max-w-[250px] mx-auto">
                                    Configurando contratos inteligentes para <span className="text-emerald-400 font-semibold">{projectTitle}</span>...
                                </p>

                                <div className="space-y-4 text-left">
                                    {STEPS.map((step, index) => {
                                        const Icon = step.icon;
                                        const isCompleted = currentStep > index;
                                        const isCurrent = currentStep === index;

                                        return (
                                            <div key={step.id} className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500
                                                    ${isCompleted ? 'bg-emerald-500 text-black' : isCurrent ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/30' : 'bg-zinc-900 text-zinc-700'}
                                                `}>
                                                    {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-sm font-medium transition-colors duration-300 ${isCurrent || isCompleted ? 'text-white' : 'text-zinc-600'}`}>
                                                        {step.label}
                                                    </p>
                                                    {isCurrent && (
                                                        <motion.div
                                                            layoutId="active-step-bar"
                                                            className="h-1 bg-emerald-500/50 rounded-full mt-1 w-full overflow-hidden"
                                                        >
                                                            <motion.div
                                                                initial={{ x: '-100%' }}
                                                                animate={{ x: '100%' }}
                                                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                                className="h-full w-1/2 bg-emerald-400"
                                                            />
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Status: SUCCESS */}
                        {status === 'success' && (
                            <div className="text-center py-4">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-20 h-20 mx-auto mb-6 bg-gradient-to-tr from-emerald-500 to-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                >
                                    <CheckCircleIcon className="w-10 h-10 text-black/80" />
                                </motion.div>
                                <h2 className="text-3xl font-bold text-white mb-2">¡Despliegue Exitoso!</h2>
                                <p className="text-gray-400 mb-8">
                                    El protocolo <span className="text-white font-bold">{projectTitle}</span> ha sido lanzado a la red.
                                </p>

                                <div className="space-y-3">
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 px-4 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
                                    >
                                        Continuar al Dashboard
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Status: ERROR */}
                        {status === 'error' && (
                            <div className="text-center py-4">
                                <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                    <XCircleIcon className="w-10 h-10 text-red-500" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Error en Despliegue</h2>
                                <p className="text-red-300/80 mb-6 text-sm bg-red-950/30 p-3 rounded-lg border border-red-900/50 border-dashed">
                                    {error || 'Ocurrió un error desconocido. Por favor intenta de nuevo.'}
                                </p>

                                <button
                                    onClick={onClose}
                                    className="w-full py-3 px-4 bg-zinc-800 text-white font-medium rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700"
                                >
                                    Cerrar e Intentar de Nuevo
                                </button>
                            </div>
                        )}

                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

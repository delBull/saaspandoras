import React, { useState } from 'react';
import { 
    XMarkIcon, 
    RocketLaunchIcon, 
    PlayIcon,
    ChatBubbleLeftEllipsisIcon,
    SparklesIcon,
    ChevronRightIcon,
    ChevronLeftIcon
} from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandCenterGuideModalProps {
    onClose: () => void;
}

export function CommandCenterGuideModal({ onClose }: CommandCenterGuideModalProps) {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Bienvenido a tu Command Center",
            subtitle: "El Cockpit del Founder",
            icon: <RocketLaunchIcon className="w-12 h-12 text-emerald-400" />,
            description: "Este no es un simple tablero de tareas. Es tu centro de operaciones diseñado para la Etapa Cero. Aquí mides exclusivamente lo que importa para levantar capital y traccionar.",
            highlight: "Regla 90/10: Pasa el 90% de tu tiempo hablando con personas, y usa esta herramienta para el 10% restante."
        },
        {
            title: "Tu North Star & Mission",
            subtitle: "Foco Diario",
            icon: <PlayIcon className="w-12 h-12 text-emerald-400" />,
            description: "Tu 'North Star' es el objetivo principal (Acceso Habilitado). Tu 'Mission' son los pasos diarios para alcanzarlo. Vigila tus métricas de Reuniones y Seguimientos. Si están en verde, vas por buen camino.",
            highlight: "Completa tus 5 reuniones y 10 seguimientos diarios. La disciplina vence a la genialidad."
        },
        {
            title: "El Timeline y el Botón Mágico",
            subtitle: "Nunca pierdas contexto",
            icon: <ChatBubbleLeftEllipsisIcon className="w-12 h-12 text-emerald-400" />,
            description: "En tu Pipeline, al hacer clic en un Lead, verás su Timeline. Usa el botón 'Finalizar Reunión' inmediatamente después de hablar con un prospecto.",
            highlight: "Solo te tomará 30 segundos: responde cómo salió y qué preguntó. La IA hará el resto."
        },
        {
            title: "Founder Copilot",
            subtitle: "Tu Asistente Táctico",
            icon: <SparklesIcon className="w-12 h-12 text-emerald-400" />,
            description: "En la esquina inferior derecha tienes a tu Copilot. Úsalo para saber qué hacer hoy, resumir tu semana o generar borradores de seguimiento sin esfuerzo.",
            highlight: "No pienses, ejecuta. Pídele al Copilot que prepare tu próxima reunión."
        }
    ];

    const currentStep = steps[step]!;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-950 border border-emerald-500/30 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col relative"
            >
                {/* Decorative background element */}
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                {/* Header */}
                <div className="flex justify-end p-4 relative z-10">
                    <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-10 pb-8 flex-1 flex flex-col relative z-10">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-500/20 shadow-inner">
                            {currentStep.icon}
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-2">{currentStep.subtitle}</h2>
                        <h3 className="text-2xl font-bold text-white mb-4">{currentStep.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed">
                            {currentStep.description}
                        </p>
                    </div>

                    <div className="mt-auto bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4 text-center">
                        <p className="text-xs font-bold text-emerald-400 italic">
                            💡 {currentStep.highlight}
                        </p>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-zinc-900/50 border-t border-zinc-800 flex justify-between items-center relative z-10">
                    {/* Dots indicator */}
                    <div className="flex gap-2">
                        {steps.map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-emerald-400 w-4' : 'bg-zinc-700'}`}
                            />
                        ))}
                    </div>

                    <div className="flex gap-3">
                        {step > 0 && (
                            <button 
                                onClick={() => setStep(s => s - 1)}
                                className="p-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition-colors flex items-center justify-center border border-zinc-800"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                        )}
                        
                        <button 
                            onClick={() => {
                                if (step < steps.length - 1) {
                                    setStep(s => s + 1);
                                } else {
                                    onClose();
                                }
                            }}
                            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black font-black uppercase tracking-widest text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                        >
                            {step < steps.length - 1 ? (
                                <>Siguiente <ChevronRightIcon className="w-4 h-4" /></>
                            ) : (
                                'Comenzar a Ejecutar'
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

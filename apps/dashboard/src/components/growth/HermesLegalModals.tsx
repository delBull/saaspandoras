"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, ScrollText } from "lucide-react";
import { useState } from "react";

interface LegalModalsProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy' | null;
}

export function HermesLegalModals({ isOpen, onClose, type }: LegalModalsProps) {
    if (!isOpen || !type) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                >
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                            {type === 'terms' ? (
                                <ScrollText className="w-6 h-6 text-amber-500" />
                            ) : (
                                <Shield className="w-6 h-6 text-emerald-500" />
                            )}
                            <h2 className="text-xl font-bold text-white uppercase tracking-widest">
                                {type === 'terms' ? 'Términos y Condiciones de Uso' : 'Aviso de Privacidad'}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar text-zinc-300 text-sm font-light space-y-6 leading-relaxed">
                        {type === 'terms' && (
                            <>
                                <p className="font-mono text-xs text-zinc-500 mb-6">Última actualización: 16 de Agosto de 2026. Al adquirir y utilizar Hermes Growth OS, usted acepta los siguientes términos.</p>
                                
                                <h3 className="text-white font-bold text-base">1. Naturaleza del Servicio (Software as a Service)</h3>
                                <p>Hermes Growth OS ("Hermes") es una infraestructura cognitiva (Inteligencia Artificial) proveída en formato de suscripción (SaaS) por Pandoras Finance S.A. ("Pandoras"). Hermes no es un empleado, asesor financiero registrado, ni representante legal de su compañía. Actúa exclusivamente bajo los flujos de instrucción (Blueprints) que el usuario (el "Cliente") configure o apruebe.</p>

                                <h3 className="text-white font-bold text-base">2. Responsabilidad de la Ejecución Autónoma</h3>
                                <p>El motor cognitivo de Hermes tiene la capacidad de tomar decisiones operativas, aprobar transacciones menores y comunicarse con clientes finales del Cliente. <strong>El Cliente asume toda responsabilidad comercial, financiera y legal</strong> sobre los mensajes emitidos por Hermes y las acciones ejecutadas por este. Pandoras provee la infraestructura, pero no audita las instrucciones finales dadas por el Cliente al motor.</p>

                                <h3 className="text-white font-bold text-base">3. Licenciamiento y "White-Label"</h3>
                                <p>El Cliente recibe el derecho de utilizar Hermes bajo su propia marca e identidad (White-labeling). Sin embargo, el código fuente, la arquitectura de procesamiento (Growth OS), los algoritmos de LLMs propietarios y la topología de red siguen siendo propiedad intelectual exclusiva e intransferible de Pandoras.</p>

                                <h3 className="text-white font-bold text-base">4. Política de Pagos y Suscripciones</h3>
                                <p>Las tarifas aplicables a la licencia (Mensual o Anual) deben ser liquidadas por adelantado. En caso de impago, Hermes otorgará automáticamente un periodo de gracia de tres (3) días calendario. Una vez expirado este periodo, el servicio se suspenderá (Estado: Suspended) bloqueando el acceso al Centro de Comando y paralizando todas las funciones operativas del agente hasta que se regularice la facturación. Los pagos procesados en criptoactivos u on-chain no son reembolsables.</p>

                                <h3 className="text-white font-bold text-base">5. Límite de Responsabilidad (Liability Cap)</h3>
                                <p>Bajo ninguna circunstancia, Pandoras será responsable por lucro cesante, daños indirectos, pérdida de clientes o fallos en negociaciones causados por el uso de Hermes. La responsabilidad máxima de Pandoras ante cualquier incidente técnico queda estrictamente limitada al monto pagado por el Cliente en los últimos tres (3) meses de servicio.</p>
                            </>
                        )}

                        {type === 'privacy' && (
                            <>
                                <p className="font-mono text-xs text-zinc-500 mb-6">Aviso de Privacidad en cumplimiento de normativas internacionales (GDPR / LFPDPPP).</p>

                                <h3 className="text-white font-bold text-base">1. Aislamiento de Datos (Tenant Isolation)</h3>
                                <p>Toda la información inyectada a Hermes (bases de datos de clientes, historiales de chat, proyecciones financieras y métricas) se almacena bajo políticas estrictas de aislamiento a nivel fila (Row-Level Security) en la infraestructura de Pandoras. Los datos de su empresa <strong>jamás son utilizados para entrenar modelos base globales</strong> ni compartidos con otros inquilinos (tenants).</p>

                                <h3 className="text-white font-bold text-base">2. Procesamiento Cognitivo Temporal</h3>
                                <p>Para dotar a Hermes de capacidades conversacionales, fragmentos de información (contextos) se envían transitoriamente a los motores de lenguaje natural de Pandoras. Estos envíos están anonimizados y se purgan de la memoria RAM del motor de inferencia de manera inmediata (Zero-Retention Policy en LLM providers).</p>

                                <h3 className="text-white font-bold text-base">3. Datos de Clientes Finales</h3>
                                <p>Al utilizar a Hermes para contactar a sus propios leads o clientes vía WhatsApp o Telegram, el Cliente actúa como <strong>Controlador de Datos</strong> (Data Controller), y Pandoras como <strong>Procesador de Datos</strong> (Data Processor). Es obligación exclusiva del Cliente recabar los consentimientos correspondientes (Opt-in) de sus usuarios finales antes de que Hermes interactúe con ellos. Pandoras se reserva el derecho de suspender la cuenta si se detectan violaciones masivas de spam.</p>

                                <h3 className="text-white font-bold text-base">4. Uso de la Información del Cliente</h3>
                                <p>Los correos electrónicos y wallets registradas por el Cliente al momento de adquirir su licencia serán utilizados estrictamente para: (a) Facturación y control de la suscripción, (b) Notificaciones críticas de infraestructura (vencimientos, suspensiones), (c) Entregar recompensas del programa de embajadores (Reputation Points).</p>

                                <h3 className="text-white font-bold text-base">5. Criptografía y Transacciones On-Chain</h3>
                                <p>Las transacciones realizadas mediante billeteras Web3 para el pago de licencias (USDC/USDT) son inherentemente públicas por la naturaleza de la blockchain. Pandoras no controla ni puede ocultar el historial on-chain de las wallets utilizadas por los clientes para interactuar con nuestros contratos inteligentes (Smart Contracts).</p>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

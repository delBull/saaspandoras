"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Rocket,
    Users,
    Shield,
    ArrowRight,
    Phone,
    Mail,
    CheckCircle,
    XCircle,
    Zap,
    Crown,
    Layout,
    Database,
    Lock,
    Globe,
    Terminal,
    X,
    AlertTriangle,
    Server
} from "lucide-react";

import { ModernBackground } from "@/components/ui/modern-background";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGoogleAnalytics, trackEvent, trackPageView } from "@/lib/analytics";

// Configuración whatsapp default
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE || "5213221374392";
const WHATSAPP_PRE_MESSAGE = encodeURIComponent(
    "Hola, leí su propuesta de Protocolo. Quiero validar si mi proyecto califica para el lanzamiento."
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_PRE_MESSAGE}`;

// --- SECCIONES ---

function Hero({ onMethodSelect }: { onMethodSelect: (method: 'whatsapp' | 'email') => void }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 pt-0"
        >
            <div className="max-w-4xl mx-auto px-4">
                {/* Badge superior */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-8">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                        Infraestructura Operativa
                    </span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight text-white">
                    Lanza un protocolo real en días. <br />
                    <span className="text-zinc-500">No una idea. No un whitepaper.</span>
                </h1>

                <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Pandora’s W2E es infraestructura operativa para proyectos que <strong className="text-white">ya quieren ejecutar</strong>, no experimentar. Tokenización, gobernanza y ventas, sin ruido fintech.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button
                        size="lg"
                        className="bg-white text-black hover:bg-zinc-200 w-full sm:w-auto px-8 h-14 text-lg font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                        onClick={() => onMethodSelect('whatsapp')}
                    >
                        Aplicar para lanzar →
                    </Button>

                    <Button
                        size="lg"
                        variant="ghost"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-900 w-full sm:w-auto h-14"
                        onClick={() => {
                            const el = document.getElementById('how-it-works');
                            el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        Ver cómo funciona
                    </Button>
                </div>

                <p className="mt-4 text-xs text-zinc-600 uppercase tracking-widest font-semibold">
                    Solo proyectos con capital y visión clara
                </p>
            </div>
        </motion.section>
    );
}

function FilterSection() {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-24"
        >
            <div className="max-w-5xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Lado Negativo */}
                    <div className="p-8 rounded-2xl bg-red-950/10 border border-red-900/20 backdrop-blur-sm">
                        <h3 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
                            <XCircle className="w-5 h-5" /> Pandora NO es para ti si:
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'Buscas "levantar capital" sin tener producto',
                                'Quieres tokens solo para especular',
                                'No tienes claridad mínima de tu modelo de negocio',
                                'Necesitas validación externa constante'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-red-200/60 text-sm">
                                    <X className="w-4 h-4 mt-0.5 shrink-0 opacity-50" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Lado Positivo */}
                    <div className="p-8 rounded-2xl bg-green-950/10 border border-green-900/20 backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <CheckCircle className="w-24 h-24 text-green-500" />
                        </div>
                        <h3 className="text-xl font-bold text-green-500 mb-6 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Pandora SÍ es para ti si:
                        </h3>
                        <ul className="space-y-4">
                            {[
                                'Tienes un proyecto real (Real Estate, Startup, Comunidad)',
                                'Quieres convertir acceso y trabajo en ingresos medibles',
                                'Valoras la velocidad y la estructura sobre la improvisación',
                                'Estás dispuesto a pagar por criterio experto, no solo código'
                            ].map((item, i) => (
                                <li key={i} className="flex items-start gap-3 text-green-200/80 text-sm font-medium">
                                    <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <p className="text-center text-zinc-500 text-sm mt-6 italic">
                    (Esto nos ahorra horas de llamadas a ambos)
                </p>
            </div>
        </motion.section>
    );
}

function PositioningSection() {
    return (
        <motion.section
            id="how-it-works"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-24 text-center"
        >
            <div className="max-w-4xl mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
                    Pandora no es una plataforma.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        Es un sistema operativo económico.
                    </span>
                </h2>

                <p className="text-lg text-zinc-400 mb-12 max-w-2xl mx-auto">
                    No digitalizamos dinero mágico. Digitalizamos <strong>sistemas que generan valor</strong>.
                    Transformamos interacción real (acceso, votos, tareas) en activos financieros.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                    {[
                        { icon: Database, title: "DAO Factory", desc: "Lista para producción" },
                        { icon: Users, title: "Identidad", desc: "Wallets invisibles" },
                        { icon: Shield, title: "Gobernanza", desc: "Híbrida Off/On-Chain" },
                        { icon: Zap, title: "Work-to-Earn", desc: "Operativo día 1" },
                    ].map((feature, i) => (
                        <GlassCard key={i} className="p-4 bg-zinc-900/50 hover:bg-zinc-900 transition-colors">
                            <feature.icon className="w-8 h-8 text-zinc-500 mb-3" />
                            <h4 className="font-bold text-white text-sm">{feature.title}</h4>
                            <p className="text-xs text-zinc-500 mt-1">{feature.desc}</p>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </motion.section>
    );
}

function ComparisonSection() {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-24 bg-zinc-900/30 py-16"
        >
            <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-2">La alternativa real a Pandora</h2>
                    <p className="text-zinc-500">¿Cuánto cuesta realmente hacerlo por tu cuenta?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8 relative">
                    <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800 -translate-x-1/2 z-0"></div>

                    {/* Alternativa Tradicional */}
                    <div className="p-8 relative z-10">
                        <h3 className="text-xl font-bold text-zinc-400 mb-6 text-center">Hazlo por tu cuenta</h3>
                        <ul className="space-y-6">
                            <li className="flex justify-between items-center text-zinc-400 border-b border-zinc-800 pb-2">
                                <span>Tiempo de desarrollo</span>
                                <span className="font-mono text-red-500">4 – 6 meses</span>
                            </li>
                            <li className="flex justify-between items-center text-zinc-400 border-b border-zinc-800 pb-2">
                                <span>Equipo requerido</span>
                                <span className="font-mono text-red-500">3 – 5 seniors</span>
                            </li>
                            <li className="flex justify-between items-center text-zinc-400 border-b border-zinc-800 pb-2">
                                <span>Integración</span>
                                <span className="font-mono text-zinc-500">Fragmentada</span>
                            </li>
                            <li className="flex justify-between items-center text-zinc-400 border-b border-zinc-800 pb-2">
                                <span>Riesgo Legal</span>
                                <span className="font-mono text-red-500">Alto / Desconocido</span>
                            </li>
                            <li className="flex justify-between items-center pt-2">
                                <span className="font-bold text-white">Costo Real</span>
                                <span className="font-mono text-2xl font-bold text-red-500">$50,000+ USD</span>
                            </li>
                        </ul>
                    </div>

                    {/* Solución Pandora */}
                    <div className="p-8 rounded-2xl bg-gradient-to-b from-blue-900/10 to-purple-900/10 border border-blue-500/20 relative z-10">
                        <div className="absolute top-0 right-0 bg-blue-500 text-xs font-bold px-2 py-1 rounded-bl-lg text-white">SMART CHOICE</div>
                        <h3 className="text-xl font-bold text-white mb-6 text-center">Con Pandora</h3>
                        <ul className="space-y-6">
                            <li className="flex justify-between items-center text-white border-b border-blue-500/20 pb-2">
                                <span>Tiempo de despliegue</span>
                                <span className="font-mono text-green-400">24 – 72 horas</span>
                            </li>
                            <li className="flex justify-between items-center text-white border-b border-blue-500/20 pb-2">
                                <span>Proveedor</span>
                                <span className="font-mono text-green-400">1 Partner</span>
                            </li>
                            <li className="flex justify-between items-center text-white border-b border-blue-500/20 pb-2">
                                <span>Sistema</span>
                                <span className="font-mono text-white">All-in-One OS</span>
                            </li>
                            <li className="flex justify-between items-center text-white border-b border-blue-500/20 pb-2">
                                <span>Framework Legal</span>
                                <span className="font-mono text-green-400">Incluido (Base)</span>
                            </li>
                            <li className="flex justify-between items-center pt-2">
                                <span className="font-bold text-white">Inversión</span>
                                <span className="font-mono text-2xl font-bold text-blue-400">Desde $4,500 USD</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

function PricingSection({ onApply }: { onApply: (plan: string) => void }) {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-24"
        >
            <div className="max-w-6xl mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-16 text-white">Elige tu velocidad de ejecución</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* PAQUETE 1 */}
                    <GlassCard className="flex flex-col border-zinc-800 bg-zinc-950/50 hover:border-zinc-700 transition-colors p-6 md:p-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-zinc-400">Despliegue Rápido</h3>
                            <p className="text-sm text-zinc-500 mt-2 h-10">Para equipos que solo quieren la infraestructura técnica.</p>
                        </div>
                        <div className="mb-8">
                            <div className="text-3xl font-bold text-white">$7,600 <span className="text-sm font-normal text-zinc-500">USD setup</span></div>
                            <div className="text-sm text-zinc-500">+ $149 USD / mes</div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            {['DAO Factory Deployment', 'Access Card + Token', 'Dashboard Base', 'Social Login + Wallets', 'Landing Estándar'].map(f => (
                                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                                    <CheckCircle className="w-4 h-4 text-zinc-600 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                            <li className="pt-4 mt-4 border-t border-zinc-800 text-xs text-zinc-500 flex gap-2">
                                <X className="w-3 h-3" /> Sin CRM ni Soporte Estratégico
                            </li>
                        </ul>

                        <Button
                            variant="outline"
                            className="w-full border-zinc-700 hover:bg-zinc-800 text-white justify-center"
                            onClick={() => onApply('Pack 1: Despliegue Rápido')}
                        >
                            Comenzar Básico
                        </Button>
                    </GlassCard>

                    {/* PAQUETE 2 - RECOMENDADO */}
                    <GlassCard className="flex flex-col relative border-blue-500/50 bg-gradient-to-b from-blue-950/20 to-zinc-950 p-6 md:p-8 transform md:-translate-y-4 shadow-[0_0_40px_rgba(59,130,246,0.1)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-blue-500/20 z-10">Recomendado</div>

                        <div className="mb-6 mt-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                Partner de Crecimiento
                            </h3>
                            <p className="text-sm text-zinc-400 mt-2 h-10">Para proyectos que quieren vender, no solo lanzar.</p>
                        </div>
                        <div className="mb-8 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <div className="text-3xl font-bold text-white">$4,500 <span className="text-sm font-normal text-blue-200/60">USD setup</span></div>
                            <div className="text-sm font-bold text-blue-400 mt-1">+ 10% sobre ingresos</div>
                            <div className="text-xs text-zinc-500 mt-1 italic">Si tú no vendes, no cobramos variable.</div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="text-sm font-bold text-white flex gap-2">
                                <CheckCircle className="w-4 h-4 text-blue-500" /> Todo el Paquete Básico
                            </li>
                            {['CRM (WhatsApp + Shortlinks)', 'Funnel de Ventas Diseñado', 'Gamificación Configurada', 'Listado Destacado en Pandora', 'Sesión Semanal de Optimización'].map(f => (
                                <li key={f} className="flex items-start gap-2 text-sm text-blue-100">
                                    <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
                            onClick={() => onApply('Pack 2: Partner Crecimiento')}
                        >
                            Aplicar como Partner
                        </Button>
                    </GlassCard>

                    {/* PAQUETE 3 */}
                    <GlassCard className="flex flex-col border-yellow-500/30 bg-zinc-950/50 p-6 md:p-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-yellow-500 flex items-center gap-2">
                                <Crown className="w-4 h-4" /> Ecosystem Builder
                            </h3>
                            <p className="text-sm text-zinc-500 mt-2 h-10">Incubación real. Uno a uno. Sin excusas.</p>
                        </div>
                        <div className="mb-8">
                            <div className="text-3xl font-bold text-white">$35,000 <span className="text-sm font-normal text-zinc-500">USD setup</span></div>
                            <div className="text-sm text-zinc-500">+ $500/mo + 5% RevShare</div>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                            <li className="text-sm font-bold text-zinc-300 flex gap-2">
                                <CheckCircle className="w-4 h-4 text-yellow-600" /> Todo el Paquete Partner
                            </li>
                            {['Diseño W2E a medida', 'Labores y Gobernanza Custom', 'Acompañamiento del Arquitecto', 'Prioridad Total en Roadmap'].map(f => (
                                <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                                    <CheckCircle className="w-4 h-4 text-yellow-600/60 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                            <li className="pt-4 mt-4 border-t border-zinc-800 text-xs text-yellow-500 flex gap-2 font-bold">
                                ⚠️ Acceso Limitado - Solo con Entrevista
                            </li>
                        </ul>

                        <Button
                            variant="outline"
                            className="w-full border-yellow-600 text-yellow-500 hover:bg-yellow-900/20"
                            onClick={() => onApply('Pack 3: Ecosystem Builder')}
                        >
                            Aplicar al Inner Circle
                        </Button>
                    </GlassCard>

                </div>
            </div>
        </motion.section>
    );
}

function LegalBlock() {
    return (
        <div className="max-w-3xl mx-auto text-center mb-24 px-4">
            <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <h4 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wide">Claridad Legal</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                    Pandora’s Finance es un proveedor de infraestructura tecnológica (SaaS). Los tokens y artefactos creados son herramientas utilitarias de coordinación y gobernanza, no valores financieros ni productos de inversión regulados por Pandora. No prometemos rendimientos ni retornos pasivos. Cada proyecto es responsable legal y fiscalmente de su propio modelo de negocio y emisión.
                </p>
            </div>
        </div>
    );
}

function FinalCTA({ onAction }: { onAction: () => void }) {
    return (
        <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16 px-4"
        >
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                Si estás listo para ejecutar, aplica.<br />
                <span className="text-zinc-600">Si no, no pierdas tu tiempo… ni el nuestro.</span>
            </h2>

            <Button
                size="lg"
                className="bg-white text-black hover:bg-zinc-200 px-10 py-6 text-xl font-bold"
                onClick={onAction}
            >
                Aplicar para lanzar un protocolo
            </Button>

            <p className="mt-4 text-xs text-zinc-600">
                Aplicaciones revisadas manualmente. No todos los proyectos son aceptados.
            </p>
        </motion.section>
    );
}


// --- PÁGINA PRINCIPAL ---

export default function ProtocolLandingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>}>
            <ProtocolContent />
        </Suspense>
    );
}

function ProtocolContent() {
    useGoogleAnalytics();
    trackPageView('Protocol Launch Landing');

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        type: 'email' | 'whatsapp';
        plan?: string;
    }>({ isOpen: false, type: 'whatsapp' });

    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const openWhatsApp = (plan: string = 'General') => {
        // En un futuro aqui va el flujo especifico. Por ahora link directo.
        const message = encodeURIComponent(`Hola, estoy interesado en aplicar para lanzar un protocolo (${plan}). Tengo capital y proyecto listo.`);
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
        trackEvent('protocol_apply', 'click', `whatsapp_${plan}`);
    };

    const handleApply = (plan: string) => {
        // Para aplicar siempre vamos a WhatsApp en este flujo high-ticket
        openWhatsApp(plan);
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulacion de envio
        await new Promise(r => setTimeout(r, 1000));
        setIsSuccess(true);
        setIsSubmitting(false);
        trackEvent('protocol_lead', 'submit', 'email_modal');
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 selection:text-blue-200 font-sans">
            <div className="fixed inset-0 z-0">
                <ModernBackground />
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/50 to-black pointer-events-none" />
            </div>

            <div className="relative z-10 pt-20 pb-20">

                <Hero onMethodSelect={(method) => {
                    if (method === 'whatsapp') openWhatsApp('Hero CTA');
                    else setModalState({ isOpen: true, type: 'email' });
                }} />

                <FilterSection />
                <PositioningSection />
                <ComparisonSection />
                <PricingSection onApply={handleApply} />
                <LegalBlock />
                <FinalCTA onAction={() => openWhatsApp('Final CTA')} />

            </div>

            {/* Modal para Email (Placeholder de funcionalidad) */}
            <AnimatePresence>
                {modalState.isOpen && modalState.type === 'email' && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        onClick={() => setModalState({ ...modalState, isOpen: false })}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full relative"
                        >
                            <button
                                onClick={() => setModalState({ ...modalState, isOpen: false })}
                                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {!isSuccess ? (
                                <>
                                    <h3 className="text-xl font-bold mb-2">Recibe el Breakdown del Programa</h3>
                                    <p className="text-zinc-400 text-sm mb-6">Te enviaremos los detalles técnicos de los paquetes y requisitos de aplicación.</p>

                                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                                        <div>
                                            <input
                                                type="email"
                                                required
                                                placeholder="tu@email.com"
                                                className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none"
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="w-full bg-white text-black hover:bg-zinc-200 font-bold"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Enviando...' : 'Enviar Información'}
                                        </Button>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-2">¡Recibido!</h3>
                                    <p className="text-zinc-400 text-sm">Revisa tu bandeja de entrada en unos minutos.</p>
                                    <Button
                                        className="mt-6 w-full bg-zinc-800"
                                        onClick={() => setModalState({ ...modalState, isOpen: false })}
                                    >
                                        Cerrar
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* WhatsApp Floating */}
            <a
                href={WHATSAPP_LINK}
                target="_blank"
                className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20bd5a] text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110"
                onClick={() => trackEvent('protocol_floating', 'click', 'whatsapp')}
            >
                <Phone className="w-6 h-6" />
            </a>
        </div>
    );
}

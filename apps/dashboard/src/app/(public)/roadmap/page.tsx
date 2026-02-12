"use client";

import { motion } from "framer-motion";
import {
    RocketLaunchIcon,
    GlobeAltIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    ChatBubbleLeftRightIcon,
    CalendarIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    CpuChipIcon,
    TicketIcon
} from "@heroicons/react/24/outline";

export default function RoadmapPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-lime-500/30">
            {/* HERO SECTION */}
            <section className="relative py-20 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="z-10 text-center px-4"
                >
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-lime-200 to-emerald-400 mb-6 font-display">
                        Roadmap Global
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                        Nuestra visión para el futuro de las comunidades descentralizadas.
                    </p>
                </motion.div>

                {/* Animated Background Grid */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </section>

            {/* ROADMAP CONTENT */}
            <section className="pb-24 px-4 bg-zinc-950/50">
                <div className="max-w-6xl mx-auto">
                    <div className="relative">
                        {/* Central Line */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-lime-500 via-emerald-500 to-purple-500 rounded-full opacity-30 hidden md:block" />

                        <div className="space-y-20">
                            <TimelineItem
                                phase="Fase 1: Fundación"
                                year="2024"
                                title="Core Infrastructure"
                                description="Construcción de los pilares del ecosistema. Dashboard administrativo, gestión de DAOs segura y herramientas operativas."
                                features={["Dashboard V1", "Tesorería Multi-Sig", "Ops Metrics V2", "Votación Gasless"]}
                                align="left"
                                color="border-lime-500"
                                icon={RocketLaunchIcon}
                            />

                            <TimelineItem
                                phase="Fase 2: Expansión (Actual)"
                                year="2025"
                                title="Marketing Suite & Automation"
                                description="Herramientas para escalar comunidades y automatizar operaciones de growth."
                                features={["WhatsApp Lead Manager", "Newsletter Integrado", "Shortlinks Dinámicos", "Agenda Soberana"]}
                                align="right"
                                color="border-emerald-500"
                                icon={ChatBubbleLeftRightIcon}
                            />

                            <TimelineItem
                                phase="Fase 3: Optimización"
                                year="Q3 2025"
                                title="NFT Lab & Monetization"
                                description="Potenciando la economía de creadores con activos digitales avanzados y pagos fluidos."
                                features={["NFT Lab (Access, Identity)", "Smart QR Codes", "Payment Gateway (Fiat/Crypto)", "Client Management (SOW/MSA)"]}
                                align="left"
                                color="border-cyan-500"
                                icon={CurrencyDollarIcon}
                            />

                            <TimelineItem
                                phase="Fase 4: Futuro"
                                year="2026+"
                                title="Phygital & Global Governance"
                                description="Conexión total entre el mundo físico y digital. Escalabilidad masiva de DAOs."
                                features={["Physical Twins (NFC)", "Smart Actions Protocol", "Global DAO Federation", "AI Governance Assistants"]}
                                align="right"
                                color="border-purple-500"
                                icon={GlobeAltIcon}
                            />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Sub-components
function TimelineItem({ phase, year, title, description, features, align, color, icon: Icon }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, x: align === 'left' ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`flex flex-col md:flex-row items-center gap-8 ${align === 'right' ? 'md:flex-row-reverse' : ''}`}
        >
            <div className="w-full md:w-1/2 p-6">
                <div className={`bg-zinc-900 border ${color} border-l-4 p-6 rounded-xl shadow-2xl hover:shadow-lime-500/10 transition-shadow`}>
                    <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${color.replace('border', 'bg').replace('500', '500/20')} ${color.replace('border', 'text')}`}>
                            {phase}
                        </span>
                        <span className="text-zinc-500 font-mono text-sm">{year}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${color.replace('border', 'bg').replace('500', '500/10')}`}>
                            <Icon className={`w-6 h-6 ${color.replace('border', 'text')}`} />
                        </div>
                        <h3 className="text-2xl font-bold">{title}</h3>
                    </div>
                    <p className="text-gray-400 mb-6 text-sm leading-relaxed">{description}</p>
                    <ul className="space-y-2">
                        {features.map((feat: string, i: number) => (
                            <li key={i} className="flex items-center text-sm text-gray-300">
                                <div className={`w-1.5 h-1.5 rounded-full mr-3 ${color.replace('border', 'bg')}`} />
                                {feat}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="w-1/2 hidden md:flex justify-center">
                {/* Connection Point */}
                <div className={`w-4 h-4 rounded-full ${color.replace('border', 'bg')} shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
            </div>
        </motion.div>
    )
}

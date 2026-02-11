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

export default function WhitepaperPage() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-lime-500/30">
            {/* HEROS SECTION */}
            <section className="relative h-[80vh] flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-lime-900/20 via-black to-black" />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="z-10 text-center px-4"
                >
                    <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-lime-200 to-emerald-400 mb-6 font-display">
                        PANDORAS
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light">
                        El Sistema Operativo Definitivo para Comunidades, DAOs y Startups.
                        <br />
                        <span className="text-lime-400 font-normal">Escalabilidad. Gobernanza. Monetización.</span>
                    </p>
                </motion.div>

                {/* Animated Background Grid */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </section>

            {/* ROADMAP SECTION (VISUAL) */}
            <section className="py-24 px-4 bg-zinc-950/50">
                <div className="max-w-6xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-4xl font-bold text-center mb-16 text-white"
                    >
                        Roadmap Global <span className="text-lime-400">2024-2026</span>
                    </motion.h2>

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

            {/* WHITE PAPER CONTENT (A-Z) */}
            <section className="py-24 px-4 bg-black">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">El Ecosistema Pandoras <span className="text-gray-500">A-Z</span></h2>
                        <p className="text-gray-400">Una suite completa de herramientas integradas para operar tu organización Web3.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FeatureCard
                            title="DAO & Gobernanza"
                            icon={UserGroupIcon}
                            description="El núcleo del sistema. Permite la creación y gestión descentralizada de organizaciones."
                            items={[
                                "Votación On-Chain & Gasless (Off-chain)",
                                "Delegación de Poder de Voto",
                                "Tesorería Multi-Firma (Seguridad)",
                                "Propuestas de Transferencia & Ejecución"
                            ]}
                        />

                        <FeatureCard
                            title="NFT Lab"
                            icon={TicketIcon}
                            description="Fábrica de activos digitales para accesos, identidad y recompensas."
                            items={[
                                "Access Passes & Membresías",
                                "Digital Identity (Soulbound Tokens)",
                                "Smart QR Codes (Phygital Links)",
                                "Airdrops Masivos & Claims"
                            ]}
                        />

                        <FeatureCard
                            title="Marketing Suite"
                            icon={ChatBubbleLeftRightIcon}
                            description="Herramientas de crecimiento para captar y retener usuarios."
                            items={[
                                "WhatsApp Lead Manager & Flows",
                                "Newsletter Builder & Sender",
                                "Shortlinks Dinámicos & Analytics",
                                "Campañas Automatizadas"
                            ]}
                        />

                        <FeatureCard
                            title="Infraestructura Enterprise"
                            icon={CpuChipIcon}
                            description="Seguridad y operabilidad de grado institucional."
                            items={[
                                "Ops Dashboard (Métricas en tiempo real)",
                                "Kill Switches & Circuit Breakers",
                                "Webhooks Seguros (Firmados)",
                                "Alertas de Seguridad (Discord/Email)"
                            ]}
                        />

                        <FeatureCard
                            title="Finanzas & Pagos"
                            icon={CurrencyDollarIcon}
                            description="Infraestructura financiera para operar en fiat y crypto."
                            items={[
                                "Pasarela de Pagos Híbrida",
                                "Facturación y Recibos",
                                "Gestión de Presupuestos",
                                "Link de Cobro Rápido"
                            ]}
                        />

                        <FeatureCard
                            title="Gestión de Clientes"
                            icon={DocumentTextIcon}
                            description="Administración profesional de relaciones comerciales."
                            items={[
                                "SOW (Scope of Work) Builder",
                                "MSA (Master Service Agreements)",
                                "Client Tiers & Segmentation",
                                "Portal de Cliente"
                            ]}
                        />

                        <FeatureCard
                            title="Productividad"
                            icon={CalendarIcon}
                            description="Organización operativa del día a día."
                            items={[
                                "Agenda Soberana (Booking System)",
                                "Gestor de Tareas y Misiones",
                                "Documentación Interna (Wiki)",
                                "Resource Hub"
                            ]}
                        />
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="py-20 text-center border-t border-zinc-900">
                <h3 className="text-2xl font-bold mb-6">¿Listo para escalar tu comunidad?</h3>
                <div className="flex justify-center gap-4">
                    <a href="/dashboard" className="inline-flex h-12 items-center justify-center rounded-md bg-zinc-800 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-zinc-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime-700">
                        Ir al Dashboard
                    </a>
                    <a href="/whitepaper/apply" className="inline-flex h-12 items-center justify-center rounded-md bg-gradient-to-r from-lime-500 to-emerald-600 px-8 text-sm font-bold text-black shadow-lg shadow-lime-500/20 transition-all hover:scale-105 hover:from-lime-400 hover:to-emerald-500">
                        Aplicar para Iniciar Protocolo
                    </a>
                </div>
            </section>
        </div>
    );
}

// Sub-components for clean code

function TimelineItem({ phase, year, title, description, features, align, color, icon: Icon }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, x: align === 'left' ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
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

function FeatureCard({ title, description, items, icon: Icon }: any) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:border-lime-500/30 transition-colors group">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center group-hover:bg-lime-500/10 transition-colors">
                    <Icon className="w-6 h-6 text-white group-hover:text-lime-400 transition-colors" />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
            </div>
            <p className="text-gray-400 mb-6 min-h-[50px]">{description}</p>
            <div className="space-y-3">
                {items.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-black/20 border border-zinc-800/50">
                        <ShieldCheckIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span className="text-sm font-medium text-gray-300">{item}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

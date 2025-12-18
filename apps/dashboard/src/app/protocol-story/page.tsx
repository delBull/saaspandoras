"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, X } from "lucide-react"; // Using Lucide icons for consistency
import { cn } from "@/lib/utils";
import { PreFilterModal } from "@/components/apply/PreFilterModal";
// Assuming we can reuse the PreFilterModal or a similar mechanism for the application flow
// If not, I will mock the interaction for now or reuse the one from /protocol

// --- COMPONENTS ---

const FadeIn = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
        className={className}
    >
        {children}
    </motion.div>
);

const Signature = () => (
    <div className="font-serif italic text-2xl text-lime-400 opacity-80 mt-8">
        Pablo
    </div>
);

export default function ProtocolStoryPage() {
    const [showPreFilterModal, setShowPreFilterModal] = useState(false);
    const [selectedTier, setSelectedTier] = useState<string | null>(null);

    const openApplication = (tier: string) => {
        setSelectedTier(tier);
        // In a real implementation, we might pass the tier to the modal context
        setShowPreFilterModal(true);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-lime-500/30 selection:text-lime-200 overflow-x-hidden">

            {/* --- BACKGROUND ART --- */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
                <div className="relative w-full h-full">
                    <Image
                        src="/images/chaos_struct.png"
                        alt="Chaos into Order"
                        fill
                        className="object-cover object-center opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-[#050505]/80 to-[#050505]" />
                </div>
            </div>

            {/* --- CONTENT CONTAINER --- */}
            <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 md:py-32">

                {/* --- HEADER --- */}
                <header className="flex justify-between items-center mb-24 opacity-50 hover:opacity-100 transition-opacity">
                    <Link href="/" className="text-xs tracking-[0.2em] font-medium uppercase">Pandora&apos;s</Link>
                    <span className="text-xs font-mono text-lime-500/50">EST. 2024</span>
                </header>

                {/* --- TITLE --- */}
                <section className="mb-32">
                    <FadeIn>
                        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.1] text-white tracking-tight mb-8">
                            La mentira de la <br />
                            <span className="text-lime-500 italic">descentralización</span>.
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <p className="text-lg md:text-xl leading-relaxed text-zinc-400 font-serif max-w-xl border-l-2 border-lime-500/30 pl-6 my-12">
                            &quot;No necesitas un smart contract. Necesitas un sistema operativo económico.&quot;
                        </p>
                    </FadeIn>
                </section>

                {/* --- THE LETTER: PART 1 (THE STRUGGLE) --- */}
                <article className="prose prose-invert prose-lg max-w-none font-serif text-zinc-300 space-y-12">
                    <FadeIn>
                        <p>
                            <span className="text-4xl float-left mr-3 mt-[-6px] text-white font-bold">H</span>
                            ola. Soy Pablo.
                        </p>
                        <p>
                            Llevo años construyendo en esta industria. Y he visto la misma historia repetirse tantas veces que ha dejado de ser una tragedia para convertirse en una estadística.
                        </p>
                        <p>
                            Un founder brillante tiene una visión. Quiere tokenizar una comunidad, un activo inmobiliario, o crear una DAO.
                        </p>
                    </FadeIn>

                    <FadeIn>
                        <h3 className="text-white font-sans text-xs tracking-widest uppercase mb-4 mt-16 font-bold text-red-400">El Error Común</h3>
                        <p>
                            Lo primero que hace es buscar un desarrollador. <br />
                            <em className="text-zinc-500">&quot;¿Cuánto me cobras por un token?&quot;</em>
                        </p>
                        <p>
                            El desarrollador dice: &quot;$5,000 USD y 3 meses&quot;. <br />
                            El founder paga. Espera. Suda.
                        </p>
                        <p>
                            Seis meses después (porque siempre son seis), recibe un contrato desplegado en Etherscan. Y entonces se da cuenta de la brutal verdad:
                        </p>
                        <p className="text-white text-xl border-l border-white pl-4 italic">
                            Un token sin un sistema económico es solo un número en una base de datos.
                        </p>
                    </FadeIn>

                    {/* --- VISUAL BREAK --- */}
                    <div className="my-24 h-px w-full bg-gradient-to-r from-transparent via-lime-900/50 to-transparent" />

                    {/* --- THE SHIFT (SOLUTION) --- */}
                    <FadeIn>
                        <h2 className="font-sans text-2xl md:text-3xl font-bold text-white mb-8">
                            El código es un <i>commodity</i>. <br />
                            <span className="text-lime-400">La ejecución es el arte.</span>
                        </h2>
                        <p>
                            Dejé de construir DAOs &quot;a medida&quot; porque entendí que estábamos reinventando la rueda cuadrada.
                        </p>
                        <p>
                            Pandora no es un software que te &quot;ayuda&quot;. <br />
                            Es la infraestructura completa que hubieras tardado 8 meses y $80,000 USD en construir mal.
                        </p>
                        <p>
                            Es un <strong>Sistema Operativo Económico</strong>.
                        </p>
                    </FadeIn>

                    <FadeIn className="grid grid-cols-1 md:grid-cols-2 gap-8 my-16 font-sans text-sm">
                        <div className="bg-zinc-900/30 p-6 border border-zinc-800 backdrop-blur-sm">
                            <h4 className="text-gray-500 uppercase tracking-widest text-xs mb-2">Lo que crees que necesitas</h4>
                            <ul className="space-y-2 text-zinc-400">
                                <li className="flex gap-2"><X className="w-4 h-4 text-red-500" /> Un developer Solidity</li>
                                <li className="flex gap-2"><X className="w-4 h-4 text-red-500" /> Una auditoría de $10k</li>
                                <li className="flex gap-2"><X className="w-4 h-4 text-red-500" /> Un whitepaper de 40 páginas</li>
                            </ul>
                        </div>
                        <div className="bg-lime-900/10 p-6 border border-lime-500/20 backdrop-blur-sm">
                            <h4 className="text-lime-500 uppercase tracking-widest text-xs mb-2">Lo que realmente necesitas</h4>
                            <ul className="space-y-2 text-zinc-200">
                                <li className="flex gap-2"><Check className="w-4 h-4 text-lime-500" /> Gobernanza lista para usar</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-lime-500" /> Work-to-Earn activo</li>
                                <li className="flex gap-2"><Check className="w-4 h-4 text-lime-500" /> Cashflow desde el Día 1</li>
                            </ul>
                        </div>
                    </FadeIn>

                    {/* --- THE OFFER (NARRATIVE) --- */}
                    <FadeIn>
                        <p className="mb-12">
                            No vendo software barato. Vendo velocidad y certeza. <br />
                            He diseñado tres caminos para trabajar juntos. Elige el que resuene con tu nivel de ambición.
                        </p>
                    </FadeIn>

                </article>

                {/* --- CARDS SECTION (Offers) --- */}
                <section className="grid grid-cols-1 gap-8 mt-12 mb-24">

                    {/* TIER 1 */}
                    <FadeIn delay={0.1} className="group relative border border-zinc-800 bg-[#0A0A0A] p-8 hover:border-zinc-600 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl font-serif font-bold">01</span>
                        </div>
                        <h3 className="text-lg font-sans font-bold text-white mb-2">Despliegue Rápido</h3>
                        <p className="text-zinc-500 text-sm mb-6  font-serif italic">&quot;Dame las llaves del coche, yo sé conducir.&quot;</p>
                        <div className="space-y-4 mb-8 text-zinc-400 text-sm">
                            <p>Tecnología pura. Te entrego el sistema completo: DAO, Token, Dashboard, Accesos. Tú te encargas de la estrategia y la venta.</p>
                        </div>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-2xl text-white font-bold">$7,600</span>
                            <span className="text-xs text-zinc-500">setup + $149/mo</span>
                        </div>
                        <button
                            onClick={() => openApplication('tier-1')}
                            className="w-full py-3 border border-zinc-700 text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-colors text-xs uppercase tracking-widest"
                        >
                            Aplicar — Tier 1
                        </button>
                    </FadeIn>

                    {/* TIER 2 - HIGHLIGHTED */}
                    <FadeIn delay={0.2} className="group relative border border-lime-500/30 bg-[#0C0C0C] p-10 ring-1 ring-lime-500/10 hover:ring-lime-500/30 transition-all duration-500 shadow-2xl shadow-lime-900/10">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            <span className="text-6xl font-serif font-bold text-lime-900">02</span>
                        </div>
                        <div className="absolute -top-3 left-10 px-3 py-1 bg-lime-500 text-black text-[10px] uppercase font-bold tracking-widest">
                            Recomendado
                        </div>
                        <h3 className="text-xl font-sans font-bold text-white mb-2">Partner de Crecimiento</h3>
                        <p className="text-lime-400 text-sm mb-6 font-serif italic">&quot;Quiero un copiloto que sepa la ruta.&quot;</p>
                        <div className="space-y-4 mb-8 text-zinc-400 text-sm">
                            <p>
                                Aquí compartimos riesgo. <br />
                                Bajo el costo de entrada porque confío en que vamos a facturar. Te doy las herramientas de venta, el CRM y estrategia semanal.
                            </p>
                            <p className="text-white">Si tú no ganas, yo no gano.</p>
                        </div>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-2xl text-white font-bold">$4,500</span>
                            <span className="text-xs text-zinc-500">setup + 10% revenue</span>
                        </div>
                        <button
                            onClick={() => openApplication('tier-2')}
                            className="w-full py-4 bg-lime-500 text-black font-bold hover:bg-lime-400 transition-colors text-xs uppercase tracking-widest shadow-lg shadow-lime-500/20"
                        >
                            Aplicar — Tier 2
                        </button>
                    </FadeIn>

                    {/* TIER 3 */}
                    <FadeIn delay={0.3} className="group relative border border-zinc-800 bg-[#0A0A0A] p-8 hover:border-zinc-600 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl font-serif font-bold">03</span>
                        </div>
                        <h3 className="text-lg font-sans font-bold text-white mb-2">Ecosystem Builder</h3>
                        <p className="text-zinc-500 text-sm mb-6 font-serif italic">&quot;Construyamos un imperio juntos.&quot;</p>
                        <div className="space-y-4 mb-8 text-zinc-400 text-sm">
                            <p>Incubación total. Me siento en tu mesa. Diseñamos la tokenomics, la gobernanza y la estrategia go-to-market desde cero.</p>
                            <p className="text-red-400 text-xs mt-2 uppercase tracking-wide">⚠️ Solo 2 plazas por trimestre</p>
                        </div>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-2xl text-white font-bold">$35,000</span>
                            <span className="text-xs text-zinc-500">setup + 5% equity/rev</span>
                        </div>
                        <button
                            onClick={() => openApplication('tier-3')}
                            className="w-full py-3 border border-zinc-700 text-zinc-300 hover:bg-white hover:text-black hover:border-white transition-colors text-xs uppercase tracking-widest"
                        >
                            Aplicar — Tier 3
                        </button>
                    </FadeIn>

                </section>

                {/* --- CLOSING --- */}
                <section className="text-center md:text-left mb-32">
                    <FadeIn>
                        <p className="font-serif text-lg text-zinc-400 mb-8 italic">
                            &quot;Si estás listo para dejar de jugar a la startup y empezar a operar una economía real, te espero dentro.&quot;
                        </p>
                        <Signature />
                    </FadeIn>
                </section>

                {/* --- FOOTER --- */}
                <footer className="border-t border-zinc-900 pt-12 pb-24 text-center md:text-left">
                    <div className="flex flex-col md:flex-row justify-between items-center text-xs text-zinc-600 font-mono">
                        <p>© 2024 PANDORA&apos;S LABS. ALL RIGHTS RESERVED.</p>
                        <div className="flex gap-6 mt-4 md:mt-0">
                            <Link href="/terms" className="hover:text-zinc-400 transition-colors">PRIVACY</Link>
                            <Link href="/terms" className="hover:text-zinc-400 transition-colors">TERMS</Link>
                            <a href="https://twitter.com/pandoras_w2e" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-400 transition-colors">TWITTER</a>
                        </div>
                    </div>
                </footer>

            </div>

            {/* --- MODAL --- */}
            <PreFilterModal
                isOpen={showPreFilterModal}
                onClose={() => setShowPreFilterModal(false)}
                onProceed={() => window.location.href = '/apply'}
                formType="conversational"
            />

        </div>
    );
}


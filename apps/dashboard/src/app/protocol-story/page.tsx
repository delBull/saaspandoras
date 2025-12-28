"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplyFormProtocol } from "@/components/apply/ApplyFormProtocol";

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

const FAQItem = ({ question, answer }: { question: string, answer: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-zinc-800">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex justify-between items-center text-left focus:outline-none group"
            >
                <span className="font-serif text-lg text-zinc-200 group-hover:text-lime-400 transition-colors pr-8">
                    {question}
                </span>
                {isOpen ? <ChevronUp className="w-5 h-5 text-lime-500" /> : <ChevronDown className="w-5 h-5 text-zinc-600 group-hover:text-lime-500" />}
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <div className="pb-8 text-zinc-400 font-sans leading-relaxed text-sm md:text-base border-l-2 border-lime-500/20 pl-6 ml-2">
                    {answer}
                </div>
            </motion.div>
        </div>
    );
};

export default function ProtocolStoryPage() {
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [selectedTier, setSelectedTier] = useState<string | null>(null);

    const openApplication = (tier: string) => {
        setSelectedTier(tier);
        setShowApplyModal(true);
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
                        priority
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

                {/* --- TITLE (THE HOOK) --- */}
                <section className="mb-24">
                    <FadeIn>
                        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.1] text-white tracking-tight mb-8">
                            La mentira de la <br />
                            <span className="text-lime-500 italic">descentralización</span>
                            <span className="block text-2xl md:text-3xl mt-4 text-zinc-500 font-normal">y el cementerio silencioso de founders con capital.</span>
                        </h1>
                    </FadeIn>
                    <FadeIn delay={0.2}>
                        <p className="text-lg md:text-xl leading-relaxed text-zinc-400 font-serif max-w-xl border-l-2 border-lime-500/30 pl-6 my-12">
                            &quot;Tu Smart Contract no va a salvar tu negocio. La parálisis técnica sí puede matarlo.&quot;
                        </p>
                    </FadeIn>
                </section>

                {/* --- THE STORY (VILLAIN: TECHNICAL COMPLEXITY) --- */}
                <article className="prose prose-invert prose-lg max-w-none font-serif text-zinc-300 space-y-12 mb-32">
                    <FadeIn>
                        <p>
                            He visto demasiados founders con capital perder meses —y cientos de miles— construyendo infraestructura que nunca monetiza.
                        </p>
                        <p>
                            No por falta de talento. Por construir tecnología antes de construir economía.
                        </p>
                    </FadeIn>

                    <FadeIn>
                        <p>
                            La trampa no es contratar devs caros. La trampa es creer que el código es el negocio.
                        </p>
                        <p>
                            Un token sin sistema de pagos, gobernanza y ejecución no es innovación. Es deuda técnica con marketing bonito.
                        </p>
                    </FadeIn>
                </article>

                {/* --- VISUAL BREAK --- */}
                <div className="my-24 h-px w-full bg-gradient-to-r from-transparent via-lime-900/50 to-transparent" />

                {/* --- THE SHIFT (SOLUTION) --- */}
                <section className="mb-32">
                    <FadeIn>
                        <h2 className="font-sans text-2xl md:text-3xl font-bold text-white mb-8">
                            Dejé de construir DAOs &quot;a medida&quot; porque <span className="text-lime-400">me cansé de ver founders agotados.</span>
                        </h2>
                        <p className="font-serif text-zinc-400 text-lg mb-6">
                            Entendí que estábamos intentando construir una ciudad diseñando cada ladrillo desde cero. Es ineficiente. Es caro. Es lento.
                        </p>
                        <p className="font-serif text-lg mb-12">
                            <strong className="text-white">Pandora no es un software. Es un Sistema Operativo Económico.</strong>
                        </p>

                        <div className="bg-zinc-900/30 p-8 border-l-4 border-lime-500 backdrop-blur-sm mb-12">
                            <p className="font-serif text-zinc-300 italic mb-4">&quot;Construir una DAO desde cero es como fabricar tu propia cocina industrial antes de abrir un restaurante.&quot;</p>
                            <p className="text-lime-400 font-bold">Pandora es llegar, encender y empezar a vender hoy.</p>
                        </div>
                    </FadeIn>

                    {/* --- THE CONTRAST TABLE --- */}
                    <FadeIn className="overflow-hidden border border-zinc-800 rounded-lg bg-[#0A0A0A]">
                        <div className="grid grid-cols-2 text-xs md:text-sm">
                            {/* Header */}
                            <div className="bg-zinc-900/50 p-4 border-b border-r border-zinc-800 font-bold text-zinc-500 uppercase tracking-wider">El Camino Tradicional <br /><span className="text-[10px] text-red-500/80 font-normal normal-case">(Lento y Caro)</span></div>
                            <div className="bg-lime-900/20 p-4 border-b border-zinc-800 font-bold text-lime-500 uppercase tracking-wider">El Camino Pandora <br /><span className="text-[10px] text-lime-400/80 font-normal normal-case">(Veloz y Cierto)</span></div>

                            {/* Row 1 */}
                            <div className="p-4 border-b border-r border-zinc-800 text-zinc-400">6-8 meses de desarrollo de Smart Contracts.</div>
                            <div className="p-4 border-b border-zinc-800 text-white font-medium bg-lime-500/5">Despliegue en 72 horas.</div>

                            {/* Row 2 */}
                            <div className="p-4 border-b border-r border-zinc-800 text-zinc-400">$20k - $50k en salarios de devs y auditorías.</div>
                            <div className="p-4 border-b border-zinc-800 text-white font-medium bg-lime-500/5">Fracción del costo con tecnología probada.</div>

                            {/* Row 3 */}
                            <div className="p-4 border-b border-r border-zinc-800 text-zinc-400">Caos administrativo y Excel para pagos.</div>
                            <div className="p-4 border-b border-zinc-800 text-white font-medium bg-lime-500/5">Gobernanza y Work-to-Earn automatizado.</div>

                            {/* Row 4 */}
                            <div className="p-4 border-r border-zinc-800 text-zinc-400">El token es un gasto.</div>
                            <div className="p-4 text-white font-medium bg-lime-500/5">El sistema es un generador de Cashflow.</div>

                            {/* Row 5 - The Contrast */}
                            <div className="p-4 border-t border-r border-zinc-800 text-red-400 font-serif italic text-xs">Miedo a invertir mal.</div>
                            <div className="p-4 border-t border-zinc-800 text-lime-400 font-serif italic text-xs">La diferencia no es técnica. Es si lanzas este trimestre… o no.</div>
                        </div>
                    </FadeIn>
                </section>

                {/* --- THE OFFER INTRO --- */}
                <FadeIn className="mb-16">
                    <h2 className="font-serif text-3xl font-medium text-white mb-6">
                        No vendo software. <br />
                        Vendo velocidad con <span className="text-lime-500">control</span>.
                    </h2>
                    <p className="font-serif text-zinc-400">
                        He diseñado tres niveles de ambición. No busco clientes, busco economías que merezcan ser escaladas.
                    </p>
                </FadeIn>

                {/* --- CARDS SECTION (Offers) --- */}
                <section className="grid grid-cols-1 gap-8 mb-32">

                    {/* TIER 1 */}
                    <FadeIn delay={0.1} className="group relative border border-zinc-800 bg-[#0A0A0A] p-8 hover:border-zinc-600 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="text-6xl font-serif font-bold">01</span>
                        </div>
                        <h3 className="text-lg font-sans font-bold text-white mb-2">Despliegue Rápido</h3>
                        <p className="text-zinc-500 text-sm mb-6  font-serif italic">&quot;Dame las llaves del coche, yo sé conducir.&quot;</p>
                        <div className="space-y-4 mb-8 text-zinc-400 text-sm">
                            <p className="text-white font-bold mb-2">Ideal si ya sabes vender y solo necesitas infraestructura ahora.</p>
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

                    {/* TIER 2 - OPTIMIZED */}
                    <FadeIn delay={0.2} className="group relative border border-lime-500/30 bg-[#0C0C0C] p-10 ring-1 ring-lime-500/10 hover:ring-lime-500/30 transition-all duration-500 shadow-2xl shadow-lime-900/10">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                            <span className="text-6xl font-serif font-bold text-lime-900">02</span>
                        </div>
                        <div className="absolute -top-3 left-10 px-3 py-1 bg-lime-500 text-black text-[10px] uppercase font-bold tracking-widest">
                            El Salto Cuántico
                        </div>
                        <h3 className="text-xl font-sans font-bold text-white mb-2">Partner de Crecimiento</h3>
                        <p className="text-lime-400 text-sm mb-6 font-serif italic">&quot;No quiero un proveedor, quiero un socio de infraestructura.&quot;</p>
                        <div className="space-y-4 mb-8 text-zinc-400 text-sm">
                            <p className="text-white font-bold mb-2">Ideal si quieres ejecutar sin cargar todo el riesgo tú solo.</p>
                            <p>
                                Este es el camino para quienes ya tienen tracción o una comunidad real. Aquí yo absorbo parte del riesgo porque sé que el sistema funciona.
                            </p>
                            <p className="text-white">
                                Te entrego el CRM Web3, el motor de ventas y mi estrategia de Go-to-Market.
                            </p>
                        </div>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-2xl text-white font-bold">$4,500</span>
                            <span className="text-xs text-zinc-500">setup + 10% revenue</span>
                        </div>
                        <div className="text-[10px] text-lime-500/70 uppercase tracking-widest mb-6 border-l border-lime-500/30 pl-2">
                            Solo para proyectos con validación previa
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
                            <p className="text-white font-bold mb-2">Ideal si buscas un socio técnico con piel en el juego.</p>
                            <p>Incubación total. Me siento en tu mesa. Diseñamos la tokenomics, la gobernanza y la estrategia go-to-market desde cero.</p>
                            <p className="text-red-400 text-xs mt-2 uppercase tracking-wide">⚠️ Acepto máximo 2 proyectos por trimestre. Si no hay encaje, no avanzamos.</p>
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

                {/* --- KILLER FAQS --- */}
                <section className="mb-32">
                    <FadeIn>
                        <h2 className="font-serif text-3xl text-white mb-12 border-b border-zinc-800 pb-6">
                            Preguntas Incómodas <br />
                            <span className="text-zinc-500 text-xl">(Que nadie más te responde)</span>
                        </h2>
                    </FadeIn>
                    <div className="space-y-2">
                        <FadeIn delay={0.1}>
                            <FAQItem
                                question="¿Y si la regulación cambia mañana? ¿Es esto legal?"
                                answer={
                                    <>
                                        <p className="mb-4 text-white font-bold">La tecnología es neutral; la implementación es la clave.</p>
                                        <p className="mb-4">La mayoría de los proyectos fallan legalmente no por el token, sino porque no tienen un &quot;Espejo Legal&quot; en el mundo real.</p>
                                        <p>Pandora no es solo código. Nuestros sistemas están diseñados para integrarse con estructuras de <strong>&quot;Legal Wrappers&quot; (SPVs, Fideicomisos, LLCs)</strong>. Te damos la infraestructura técnica para que tus abogados puedan conectar activos reales (Inmuebles, Facturas, Equity) a la Blockchain sin que parezca un esquema Ponzi. No vendemos consejos legales, vendemos la herramienta que los equipos legales <em>aman</em> usar porque todo es trazable.</p>
                                    </>
                                }
                            />
                        </FadeIn>
                        <FadeIn delay={0.2}>
                            <FAQItem
                                question="¿Por qué debería confiar en tu sistema en lugar de tener mi propio código?"
                                answer={
                                    <>
                                        <p className="mb-4 text-white font-bold">Porque el &quot;código propio&quot; es el más inseguro de todos.</p>
                                        <p className="mb-4">Cuando contratas a un desarrollador para que haga algo desde cero, eres el conejillo de indias. Nadie ha probado ese código antes.</p>
                                        <p>Pandora es un estándar. Nuestros contratos han procesado transacciones y gobernanza repetidamente. Al usar nuestro sistema operativo, te beneficias de la seguridad colectiva. No estás pagando por un experimento, estás pagando por una infraestructura blindada que ya ha cometido los errores por ti.</p>
                                    </>
                                }
                            />
                        </FadeIn>
                        <FadeIn delay={0.3}>
                            <FAQItem
                                question="¿Si uso Pandora, pierdo el control de mi proyecto?"
                                answer={
                                    <>
                                        <p className="mb-4 text-white font-bold">Al contrario. Por fin tomas el control.</p>
                                        <p className="mb-4">Ahora mismo, si tu desarrollador desaparece, tu proyecto muere. Eso es perder el control.</p>
                                        <p>Con Pandora, tú tienes las llaves. Eres dueño de la configuración, de la tesorería y de la comunidad. Nosotros somos el motor, pero tú eres el conductor. Si mañana decides migrar, la Blockchain es pública y los datos son tuyos. No te encadenamos con contratos, te retenemos con resultados.</p>
                                    </>
                                }
                            />
                        </FadeIn>
                        <FadeIn delay={0.4}>
                            <FAQItem
                                question="¿No es mejor pagar una sola vez a un desarrollador que un fee mensual o revenue share?"
                                answer={
                                    <>
                                        <p className="mb-4 text-white font-bold">Esa mentalidad es la razón por la que el 90% de las Startups Web3 quiebran en 6 meses.</p>
                                        <p className="mb-4">Un desarrollador freelance cobra y se va. Su incentivo es terminar rápido, no que tú factures.</p>
                                        <p>Nuestro modelo de <strong>Partner de Crecimiento (Tier 2)</strong> alinea mis intereses con los tuyos. Si tú no facturas, yo no gano. Si el sistema se cae, yo pierdo. ¿Prefieres pagar $5,000 USD una vez por algo que nadie mantendrá, o compartir el éxito con un socio tecnológico que necesita que ganes dinero?</p>
                                    </>
                                }
                            />
                        </FadeIn>
                    </div>
                </section>

                {/* --- CLOSING / FINAL CTA --- */}
                <section className="text-center md:text-left mb-32 relative">
                    <div className="absolute -left-10 -top-10 w-32 h-32 bg-lime-500/10 rounded-full blur-3xl pointer-events-none" />
                    <FadeIn>
                        <h2 className="font-serif text-4xl text-white mb-8">
                            Cada mes que no lanzas, tu idea pierde ventaja.
                        </h2>
                        <p className="font-serif text-lg text-zinc-400 mb-12 italic leading-relaxed max-w-xl">
                            &quot;Otros founders no están esperando. Si tu proyecto tiene capital y urgencia, aplica. Si no, guarda esta página y vuelve cuando estés listo.&quot;
                        </p>

                        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg max-w-xl">
                            <p className="font-sans text-sm text-zinc-400 mb-6 font-bold uppercase tracking-wider">Tienes dos opciones:</p>
                            <ul className="space-y-3 mb-8 text-zinc-300 font-serif">
                                <li className="flex gap-3"><X className="w-5 h-5 text-zinc-600" /> Seguir buscando al &quot;desarrollador perfecto&quot; en LinkedIn.</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-lime-500" /> Agendar una llamada y ver cómo se ve tu economía funcionando en tiempo real.</li>
                            </ul>
                            <button
                                onClick={() => openApplication('general')}
                                className="w-full bg-white text-black font-bold py-4 text-sm uppercase tracking-[0.2em] hover:bg-lime-400 transition-colors shadow-2xl shadow-white/5"
                            >
                                Aplicar Ahora
                            </button>
                            <p className="text-center text-xs text-zinc-600 mt-4">No es una venta. Es un filtro.</p>
                        </div>
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
            {/* --- MODAL --- */}
            <AnimatePresence>
                {showApplyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto"
                        onClick={() => setShowApplyModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl"
                        >
                            <ApplyFormProtocol onClose={() => setShowApplyModal(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Pandora's Finance | Litepaper Técnico",
    description: "Documento oficial de infraestructura y utilidad.",
    robots: {
        index: false,
        follow: false,
    },
};

export default function LitepaperPage() {
    return (
        <main className="min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
            {/* Navigation / Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 max-w-screen-xl items-center">
                    <Link
                        href="/"
                        className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Volver a Pandora's</span>
                    </Link>
                    <div className="ml-auto flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground hidden md:inline-block mr-2">
                            Literal Técnico Oficial v1.0
                        </span>
                        <a
                            href="/docs/pandoras-litepaper-v1.pdf"
                            target="_blank"
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                        >
                            Descargar PDF
                        </a>
                        <div className="h-4 w-[1px] bg-border hidden sm:block"></div>
                        <span className="font-bold tracking-tight">Pandora's Finance</span>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container max-w-3xl pt-12 pb-8 md:pt-20 md:pb-12 text-center">
                <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium text-primary mb-6">
                    📄 Documento Canónico v1.0
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                    Litepaper Técnico Oficial
                </h1>
                <p className="text-xl text-muted-foreground font-light mb-8">
                    Infraestructura de Utilidad Inmutable
                </p>
                <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
            </section>

            {/* Content Container */}
            <article className="container max-w-3xl pb-24">
                <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline">

                    {/* 1. Propósito */}
                    <section className="mt-12">
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">01</span>
                            Propósito del Documento
                        </h2>
                        <p>
                            Este Litepaper define el marco técnico, conceptual y operativo bajo el cual <strong>Pandora’s Finance</strong> diseña, valida y despliega protocolos de utilidad on-chain.
                        </p>
                        <div className="my-6 border-l-4 border-primary/50 bg-muted/40 p-4 pl-6 rounded-r-lg">
                            <ul className="list-none pl-0 space-y-2 mt-0 mb-0">
                                <li className="flex items-start">
                                    <span className="mr-2 text-destructive font-bold">✕</span> No es un documento de marketing.
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2 text-destructive font-bold">✕</span> No constituye asesoría financiera, legal o de inversión.
                                </li>
                            </ul>
                            <p className="mt-2 text-sm text-muted-foreground mb-0">
                                Su función es alinear expectativas, reducir ambigüedad y establecer principios técnicos inmutables previos a cualquier ejecución contractual.
                            </p>
                        </div>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 2. Qué es Pandora's */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">02</span>
                            Qué es Pandora’s Finance
                        </h2>
                        <p>
                            Pandora’s Finance es una plataforma de infraestructura Web3 que permite a creadores, comunidades y organizaciones convertir acciones reales en valor verificable, mediante protocolos de utilidad programables.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6 my-8 not-prose">
                            <div className="rounded-lg border p-6 bg-card">
                                <h3 className="text-lg font-semibold mb-3 flex items-center text-primary">
                                    <span className="mr-2">✅</span> Pandora’s SÍ hace:
                                </h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center">🔹 Diseña arquitectura económica</li>
                                    <li className="flex items-center">🔹 Implementa lógica Work-to-Earn (W2E)</li>
                                    <li className="flex items-center">🔹 Despliega infraestructura on-chain soberana</li>
                                </ul>
                            </div>
                            <div className="rounded-lg border p-6 bg-card border-destructive/20">
                                <h3 className="text-lg font-semibold mb-3 flex items-center text-destructive">
                                    <span className="mr-2">🚫</span> Pandora’s NO hace:
                                </h3>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center">• No emite instrumentos financieros</li>
                                    <li className="flex items-center">• No promete retornos</li>
                                    <li className="flex items-center">• No recauda capital</li>
                                    <li className="flex items-center">• No lanza tokens especulativos</li>
                                    <li className="flex items-center">• No opera como custodio</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 3. El problema */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">03</span>
                            El Problema Fundamental en Web3
                        </h2>
                        <p>
                            La mayoría de los proyectos Web3 fallan por una razón estructural: <strong>La utilidad nunca fue definida con claridad técnica.</strong>
                        </p>

                        <h4 className="font-semibold mt-4">Errores comunes:</h4>
                        <ul className="grid sm:grid-cols-2 gap-2 mt-2">
                            <li>❌ Acciones no medibles</li>
                            <li>❌ Recompensas arbitrarias</li>
                            <li>❌ Incentivos pasivos</li>
                            <li>❌ Tesorerías mezcladas</li>
                            <li>❌ Ambigüedad legal implícita</li>
                        </ul>

                        <blockquote className="not-italic font-medium border-l-4 border-primary pl-4 py-1 my-6 bg-muted/20 rounded-r">
                            <p className="m-0">Cuando la relación <code>acción → validación → recompensa</code> no es explícita, el protocolo colapsa.</p>
                        </blockquote>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 4. Principio Inmutable */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">04</span>
                            Principio Inmutable: Utilidad Verificable
                        </h2>
                        <p>Pandora’s opera bajo un principio no negociable:</p>
                        <div className="text-center my-8 p-6 bg-secondary/30 rounded-lg border border-secondary">
                            <span className="text-xl md:text-2xl font-bold text-primary">"Solo se recompensa lo que puede verificarse."</span>
                        </div>
                        <p>Esto implica:</p>
                        <ul>
                            <li>No hay recompensas pasivas</li>
                            <li>No hay “holding rewards”</li>
                            <li>No hay promesas implícitas de ROI</li>
                            <li>No hay utilidad ambigua</li>
                        </ul>
                        <p>
                            Toda recompensa debe derivar de una acción concreta, medible y validada.
                        </p>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 5. W2E */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">05</span>
                            Work-to-Earn (W2E) — Definición Operativa
                        </h2>
                        <p>En Pandora’s, Work-to-Earn significa:</p>
                        <ol className="list-decimal pl-6 space-y-1 marker:text-primary marker:font-bold">
                            <li>El usuario ejecuta una acción definida</li>
                            <li>El sistema valida dicha acción</li>
                            <li>La recompensa se libera conforme a reglas programadas</li>
                        </ol>
                        <h4 className="mt-6 font-semibold">Ejemplos de acciones:</h4>
                        <div className="flex flex-wrap gap-2 not-prose my-4">
                            {['Moderación', 'Validación', 'Creación', 'Curaduría', 'Resolución de tareas', 'Participación operativa'].map((item) => (
                                <span key={item} className="px-3 py-1 rounded-full bg-muted text-sm border font-medium">
                                    {item}
                                </span>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <em>W2E no es un modelo financiero, es un modelo operativo.</em>
                        </p>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 6. Loom */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">06</span>
                            Loom Protocol (Motor Económico)
                        </h2>
                        <p>
                            El <strong>Loom Protocol</strong> es el motor lógico que implementa la relación:
                        </p>
                        <div className="flex items-center justify-center space-x-4 my-6 font-mono text-sm md:text-base font-bold bg-muted/50 p-4 rounded-lg">
                            <span>Acción</span>
                            <span className="text-muted-foreground">→</span>
                            <span>Validación</span>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-primary">Recompensa</span>
                        </div>
                        <ul>
                            <li><strong>Determinístico:</strong> Siempre produce el mismo resultado bajo las mismas condiciones.</li>
                            <li><strong>Auditable:</strong> Transparente en la cadena de bloques.</li>
                            <li><strong>Parametrizable:</strong> Ajustable según las necesidades del protocolo.</li>
                            <li><strong>Inmutable:</strong> Una vez desplegado, las reglas base no cambian arbitrariamente.</li>
                        </ul>
                        <p className="font-medium text-foreground">
                            El Loom Protocol no es un token. Es una capa económica programable.
                        </p>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 7. Dual Treasury */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">07</span>
                            Arquitectura Dual-Treasury
                        </h2>
                        <p>Pandora’s implementa una separación estricta entre dos tesorerías para reducir riesgos financieros y legales:</p>

                        <div className="grid md:grid-cols-2 gap-8 my-8 not-prose">
                            <div className="p-5 border rounded-xl bg-card shadow-sm">
                                <h3 className="font-bold text-lg mb-2">🏛️ Tesorería Operativa</h3>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• Costos</li>
                                    <li>• Servicios</li>
                                    <li>• Infraestructura</li>
                                    <li>• Mantenimiento</li>
                                </ul>
                            </div>
                            <div className="p-5 border rounded-xl bg-card shadow-sm">
                                <h3 className="font-bold text-lg mb-2 text-primary">💎 Tesorería de Recompensas</h3>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li>• Incentivos W2E</li>
                                    <li>• Emisiones controladas</li>
                                    <li>• Reglas estrictas de uso</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 8. ModularFactory */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">08</span>
                            ModularFactory
                        </h2>
                        <p>
                            Pandora’s utiliza un sistema de despliegue modular basado en plantillas predefinidas y contratos reutilizables cuya lógica ha sido validada por diseño.
                        </p>
                        <p>
                            <strong>Beneficio clave:</strong> El cliente no desarrolla desde cero. Instancia infraestructura validada y parametrizada, reduciendo costos y tiempos de auditoría.
                        </p>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 9. Process */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">09</span>
                            Proceso Pandora’s (Journey Técnico)
                        </h2>

                        <div className="space-y-6 mt-6 not-prose">
                            <div className="flex">
                                <div className="mr-4 flex flex-col items-center">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">1</div>
                                    <div className="h-full w-px bg-border my-2"></div>
                                </div>
                                <div className="pb-6">
                                    <h4 className="text-lg font-bold">Fase 1 — Viabilidad (Tier 1)</h4>
                                    <p className="text-muted-foreground text-sm mt-1">Definición exacta de utilidad, acción W2E, flujo operativo y dictamen técnico.</p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="mr-4 flex flex-col items-center">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground border border-input font-bold text-sm">2</div>
                                    <div className="h-full w-px bg-border my-2"></div>
                                </div>
                                <div className="pb-6">
                                    <h4 className="text-lg font-bold">Fase 2 — Arquitectura (Tier 2)</h4>
                                    <p className="text-muted-foreground text-sm mt-1">Diseño técnico completo, tokenomics funcional, tesorería dual y blueprint de smart contracts.</p>
                                </div>
                            </div>

                            <div className="flex">
                                <div className="mr-4 flex flex-col items-center">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground border border-input font-bold text-sm">3</div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold">Fase 3 — Deployment (Tier 3)</h4>
                                    <p className="text-muted-foreground text-sm mt-1">Parametrización final, despliegue on-chain y activación de dashboard.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 10. NO hace */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center">
                            <span className="mr-3 text-muted-foreground/30 text-3xl">10</span>
                            Lo Que Pandora’s NO Hace (Explícito)
                        </h2>
                        <ul className="space-y-2">
                            <li><strong>No garantiza resultados económicos:</strong> El éxito depende de la comunidad y la ejecución del cliente.</li>
                            <li><strong>No promete valorización:</strong> El valor es subjetivo y determinado por el mercado.</li>
                            <li><strong>No ofrece asesoría legal formal:</strong> Proveemos tecnología, no servicios legales.</li>
                            <li><strong>No desarrolla código custom fuera del marco modular:</strong> Mantenemos la seguridad a través de la estandarización.</li>
                            <li><strong>No participa como socio del proyecto:</strong> Somos proveedores de infraestructura.</li>
                        </ul>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 11 & 12. Soberanía & Riesgos */}
                    <div className="grid md:grid-cols-2 gap-12">
                        <section>
                            <h2 className="text-xl font-bold flex items-center mb-4">
                                <span className="mr-2 text-muted-foreground/30">11</span> Soberanía del Cliente
                            </h2>
                            <p className="text-sm">Una vez desplegado:</p>
                            <ul className="text-sm space-y-1">
                                <li>✅ Los contratos pertenecen al cliente</li>
                                <li>✅ Pandora’s <strong>no custodia fondos</strong></li>
                                <li>✅ Pandora’s no controla llaves</li>
                                <li>✅ El protocolo es independiente</li>
                            </ul>
                            <p className="text-xs text-muted-foreground mt-4 font-medium uppercase tracking-wider">Esta soberanía es irreversible.</p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold flex items-center mb-4">
                                <span className="mr-2 text-muted-foreground/30">12</span> Riesgos y Responsabilidad
                            </h2>
                            <p className="text-sm">Blockchain implica riesgos inherentes:</p>
                            <ul className="text-sm space-y-1">
                                <li>⚠️ Volatilidad de mercado</li>
                                <li>⚠️ Cambios regulatorios</li>
                                <li>⚠️ Riesgos operativos externos</li>
                            </ul>
                            <p className="text-sm mt-4 italic">Pandora’s mitiga riesgos técnicos, no riesgos de negocio, mercado o adopción.</p>
                        </section>
                    </div>

                    <hr className="my-12 border-muted" />

                    {/* 13. Relación con Documentos */}
                    <section className="bg-muted/30 p-6 rounded-lg border">
                        <h2 className="text-xl font-bold flex items-center mt-0">
                            <span className="mr-3 text-muted-foreground/30 text-2xl">13</span>
                            Relación con Documentos Contractuales
                        </h2>
                        <p className="mb-4">Este Litepaper complementa:</p>
                        <ul className="mb-4">
                            <li>Terms & Conditions</li>
                            <li>Master Services Agreement (MSA)</li>
                            <li>Statements of Work (SOW)</li>
                        </ul>
                        <p className="text-sm font-medium mb-0">
                            En caso de conflicto, <strong>prevalecen los documentos contractuales firmados.</strong>
                        </p>
                    </section>

                    <hr className="my-12 border-muted" />

                    {/* 14. Contacto */}
                    <section className="text-center">
                        <h2 className="text-xl font-bold mb-6">Contacto Oficial</h2>
                        <div className="inline-block text-left bg-card border p-6 rounded-lg shadow-sm">
                            <p className="font-bold text-lg mb-1">Pandora’s Finance</p>
                            <p className="text-muted-foreground mb-4 text-sm">Infraestructura Web3</p>

                            <div className="space-y-2">
                                <a href="mailto:legal@pandoras.finance" className="flex items-center hover:text-primary transition-colors">
                                    <span className="mr-2">📩</span> legal@pandoras.finance
                                </a>
                                <a href="https://pandoras.finance" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary transition-colors">
                                    <span className="mr-2">🌐</span> https://pandoras.finance
                                </a>
                            </div>
                        </div>
                    </section>

                </div>
            </article>

            {/* Footer */}
            <footer className="border-t py-12 bg-muted/20">
                <div className="container text-center text-sm text-muted-foreground max-w-2xl">
                    <p className="mb-4">
                        © {new Date().getFullYear()} Pandora’s Finance. Todos los derechos reservados.
                    </p>
                    <p className="text-xs">
                        Este documento es de carácter informativo y técnico. No constituye una oferta pública de venta ni una solicitud de oferta de compra de valores.
                    </p>
                </div>
            </footer>
        </main>
    );
}

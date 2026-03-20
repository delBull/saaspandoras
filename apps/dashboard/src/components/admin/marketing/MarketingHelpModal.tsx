
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen, GitBranch, FileText, Zap } from "lucide-react";

export function MarketingHelpModal() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <HelpCircle className="h-4 w-4" />
                    ¿Cómo usar Marketing Suite?
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        Marketing Suite: Guía Rápida
                    </DialogTitle>
                    <DialogDescription>
                        Entiende cómo operar los flujos, tiers y campañas en Pandora's.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-8 mt-4">

                    {/* Section 1: Conceptos */}
                    <section className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                            <GitBranch className="h-5 w-5 text-blue-500" />
                            1. Estructura de Flujos
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-medium text-sm mb-1">Legacy vs Dinámico</h4>
                                <p className="text-sm text-muted-foreground">
                                    El sistema opera en modo <strong>Híbrido</strong>.
                                    Los flujos "Legacy" (Utility, Founders, etc.) se importaron desde código.
                                    Si los editas aquí, se convierten en "Dinámicos" y usan el contenido que guardes en la base de datos.
                                </p>
                            </div>
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-medium text-sm mb-1">Triggers (Disparadores)</h4>
                                <p className="text-sm text-muted-foreground">
                                    Las campañas no inician solas. Requieren un "Trigger".
                                    Por ejemplo, cuando alguien llena el filtro de Utility, el sistema busca la campaña llamada "Utility Protocol Follow-up" y la inicia.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Tiers & SOWs */}
                    <section className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                            <FileText className="h-5 w-5 text-green-500" />
                            2. Tiers y SOWs (Propuestas)
                        </h3>
                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                            <li>
                                <strong>Tier 1 (Client Activation):</strong> Ocurre cuando se confirma el primer pago (Stripe/Cripto). El proyecto pasa a estado <code>Active Client</code> automáticamente.
                            </li>
                            <li>
                                <strong>SOW Creation:</strong> Los administradores crean el "Scope of Work" en el Dashboard. Esto no es automático, es una negociación humana.
                            </li>
                            <li>
                                <strong>Newsletter & Nurture:</strong> Estos correos son para "calentar" leads (Tier 0). No les envíes SOWs todavía.
                            </li>
                        </ul>
                    </section>

                    {/* Section 3: Buenas Prácticas */}
                    <section className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                            <Zap className="h-5 w-5 text-yellow-500" />
                            3. Editor de Campañas
                        </h3>
                        <div className="space-y-2 text-sm">
                            <p>Al editar una campaña:</p>
                            <div className="flex gap-4">
                                <div className="border p-3 rounded bg-background w-1/2">
                                    <span className="font-mono text-xs block mb-1 text-primary">{`{{name}}`}</span>
                                    Usa esta variable para insertar el nombre del lead automáticamente.
                                </div>
                                <div className="border p-3 rounded bg-background w-1/2">
                                    <span className="font-mono text-xs block mb-1 text-primary">{`{{project}}`}</span>
                                    Usa esta para referirte a "tu proyecto" de forma genérica pero personal.
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Módulos del Marketing Hub */}
                    <section className="space-y-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2">
                            <Zap className="h-5 w-5 text-purple-500" />
                            4. Módulos y Sub-pestañas
                        </h3>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="border p-2 rounded bg-background/50 transition-colors hover:border-primary/50">
                                <h5 className="font-bold text-[10px] uppercase px-1 mb-1 text-primary">WA Leads</h5>
                                <p className="text-[11px] leading-tight text-muted-foreground">Captura y calificación automática de leads mediante flujos conversacionales de WhatsApp.</p>
                            </div>
                            <div className="border p-2 rounded bg-background/50 transition-colors hover:border-primary/50">
                                <h5 className="font-bold text-[10px] uppercase px-1 mb-1 text-primary">Pay & Finance</h5>
                                <p className="text-[11px] leading-tight text-muted-foreground">Generación de links de pago Cripto/Stripe y seguimiento de ingresos por protocolo.</p>
                            </div>
                            <div className="border p-2 rounded bg-background/50 transition-colors hover:border-primary/50">
                                <h5 className="font-bold text-[10px] uppercase px-1 mb-1 text-primary">Shortlinks</h5>
                                <p className="text-[11px] leading-tight text-muted-foreground">URLs inteligentes con tracking de atribución para medir qué canales traen más conversión.</p>
                            </div>
                            <div className="border p-2 rounded bg-background/50 transition-colors hover:border-primary/50">
                                <h5 className="font-bold text-[10px] uppercase px-1 mb-1 text-primary">Newsletter</h5>
                                <p className="text-[11px] leading-tight text-muted-foreground">Gestión de audiencias y envío de campañas de correo para nutrición de prospectos.</p>
                            </div>
                            <div className="border p-2 rounded bg-background/50 transition-colors hover:border-primary/50">
                                <h5 className="font-bold text-[10px] uppercase px-1 mb-1 text-primary">Growth OS</h5>
                                <p className="text-[11px] leading-tight text-muted-foreground">Sistema de puntuación (Lead Scoring) y gestión avanzada de comunidad y whitelists.</p>
                            </div>
                            <div className="border p-2 rounded bg-background/50 transition-colors hover:border-primary/50">
                                <h5 className="font-bold text-[10px] uppercase px-1 mb-1 text-primary">Campañas</h5>
                                <p className="text-[11px] leading-tight text-muted-foreground">Automatización de flujos multi-paso (Email, WhatsApp, Discord) por eventos.</p>
                            </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground italic mt-3 text-center border-t pt-2 border-dashed">
                            Nota: Los módulos de Discord, Agenda y Cursos están en fase de integración continua.
                        </p>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}

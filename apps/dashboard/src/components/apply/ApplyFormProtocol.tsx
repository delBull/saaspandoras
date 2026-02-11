"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@saasfly/ui/use-toast";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

// --- Types ---

interface FormData {
    // Step 1: Basics
    projectName: string;
    projectUrl: string;
    vertical: string; // "Tecnología / SaaS", "Servicios / Agencia", "Tradicional / Físico"

    // Step 2: State & Team
    stage: string; // "Solo Idea", "MVP / Prototipo", "En el mercado (Early)", "Escalando"
    teamSize: string; // "Solo Founder (Yo)", "2-3 Co-founders", "Equipo completo (Dev + Mkt)"
    isDoxxed: boolean; // LinkedIn/Socials check

    // Step 3: Traction
    users: string; // "0", "1-100", "100-1000", "1000+"
    revenue: string; // "$0", "$1k - $5k", "$5k - $20k", "$20k+"

    // Step 4: Infra & Tech
    budget: string; // "$5k-$10k", "$10k-$25k", "$25k-$50k", "$50k+"

    // Step 5: Model
    model: string; // "Pago directo", "Sociedad / RevShare", "Híbrido", "Recomendación"

    // Step 6: Risk & Speed
    acceptsRisk: boolean;
    timeline: string; // "Inmediato", "1-3 meses", "3-6 meses", "Explorando"

    // Step 7: The Golden Question & Contact
    whyPandora: string;
    contactEmail: string;
    contactHandle: string; // Discord/Telegram
}

const INITIAL_DATA: FormData = {
    projectName: "",
    projectUrl: "",
    vertical: "",
    stage: "",
    teamSize: "",
    isDoxxed: false,
    users: "",
    revenue: "",
    budget: "",
    model: "",
    acceptsRisk: false,
    timeline: "",
    whyPandora: "",
    contactEmail: "",
    contactHandle: "",
};

export function ApplyFormProtocol({ onClose }: { onClose?: () => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [data, setData] = useState<FormData>(INITIAL_DATA);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isRejected, setIsRejected] = useState(false);

    const totalSteps = 7;
    const progress = ((step + 1) / totalSteps) * 100;

    const updateData = (fields: Partial<FormData>) => {
        setData((prev) => ({ ...prev, ...fields }));
    };

    const nextStep = () => {
        // Validation Logic per step
        if (step === 0 && (!data.projectName || !data.vertical)) {
            toast({ title: "Requerido", description: "Por favor completa los campos básicos.", variant: "destructive" });
            return;
        }
        if (step === 1 && (!data.stage || !data.teamSize)) {
            toast({ title: "Requerido", description: "Selecciona el estado del proyecto y el tamaño del equipo.", variant: "destructive" });
            return;
        }
        if (step === 2 && (!data.users || !data.revenue)) {
            toast({ title: "Requerido", description: "Selecciona el rango de usuarios e ingresos (o 0 si no tienes).", variant: "destructive" });
            return;
        }
        if (step === 3 && !data.budget) {
            toast({ title: "Requerido", description: "Por favor indica un rango de presupuesto.", variant: "destructive" });
            return;
        }
        if (step === 4 && !data.model) {
            toast({ title: "Requerido", description: "Selecciona un modelo de trabajo.", variant: "destructive" });
            return;
        }
        if (step === 5 && !data.timeline) {
            toast({ title: "Requerido", description: "Indica tu plazo de lanzamiento.", variant: "destructive" });
            return;
        }
        setStep((prev) => prev + 1);
    };

    const prevStep = () => setStep((prev) => prev - 1);

    const handleSubmit = async () => {
        // Final Validation
        if (!data.contactEmail || !data.whyPandora) {
            toast({ title: "Requerido", description: "El email y tu respuesta final son obligatorios.", variant: "destructive" });
            return;
        }

        // Auto-Rejection Logic
        if (data.acceptsRisk === false) {
            setIsRejected(true);
            return;
        }

        // Low Priority / Soft Reject logic could go here (e.g. "Explorando" + "Trdicional")

        setIsSubmitting(true);
        try {
            // POST to our new backend API
            const response = await fetch('/api/leads/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error('Submission failed');

            const result = await response.json();

            setIsSuccess(true);
            setTimeout(() => {
                toast({
                    title: "Aplicación Recibida",
                    description: "Revisa tu email y WhatsApp para siguientes pasos.",
                });
                if (onClose) setTimeout(onClose, 2000);
            }, 500);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Hubo un problema enviando tu aplicación. Intenta de nuevo.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">¡Aplicación Recibida!</h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-8">
                    Tu proyecto <strong>{data.projectName}</strong> ha entrado en nuestro sistema de revisión.
                    Si eres seleccionado, recibirás un correo en <strong>{data.contactEmail}</strong> en las próximas 48 horas para agendar tu llamada estratégica.
                </p>
                <Button
                    onClick={() => {
                        if (onClose) {
                            onClose();
                        } else {
                            router.push('/dashboard'); // Or home if dashboard not accessible
                        }
                    }}
                    className="bg-white text-black hover:bg-zinc-200"
                >
                    {onClose ? "Continuar" : "Volver al Inicio"}
                </Button>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Aplicación No Procesada</h2>
                <p className="text-zinc-400 max-w-md mx-auto mb-8">
                    Lo sentimos, pero en Pandora buscamos founders dispuestos a asumir el riesgo inherente de construir el futuro.
                    Sin compromiso total, no podemos invertir nuestros recursos.
                </p>
                <Button onClick={onClose} variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">
                    Entendido
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px] md:h-auto min-h-[500px]">

            {/* Header / Progress */}
            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                        Protocol Application
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                        Paso {step + 1} de {totalSteps}
                    </span>
                </div>
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Step 0: Basics */}
                        {step === 0 && (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-white">Cuéntanos sobre tu proyecto</h3>
                                    <div className="space-y-2">
                                        <Label>Nombre del Proyecto</Label>
                                        <Input
                                            placeholder="Ej. Nova Protocol"
                                            value={data.projectName}
                                            onChange={(e) => updateData({ projectName: e.target.value })}
                                            className="bg-zinc-900 border-zinc-700"
                                        // autoFocus removed
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Website / Link (Opcional)</Label>
                                        <Input
                                            placeholder="https://..."
                                            value={data.projectUrl}
                                            onChange={(e) => updateData({ projectUrl: e.target.value })}
                                            className="bg-zinc-900 border-zinc-700"
                                        />
                                    </div>
                                    <div className="space-y-3 pt-2">
                                        <Label>Categoría / Vertical</Label>
                                        <RadioGroup value={data.vertical} onValueChange={(v: string) => updateData({ vertical: v })}>
                                            <div
                                                onClick={() => updateData({ vertical: "Tecnología / SaaS" })}
                                                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.vertical === "Tecnología / SaaS" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                            >
                                                <RadioGroupItem value="Tecnología / SaaS" id="v1" />
                                                <Label htmlFor="v1" className="cursor-pointer flex-1">Tecnología / SaaS / Crypto</Label>
                                            </div>
                                            <div
                                                onClick={() => updateData({ vertical: "Servicios / Agencia" })}
                                                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.vertical === "Servicios / Agencia" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                            >
                                                <RadioGroupItem value="Servicios / Agencia" id="v2" />
                                                <Label htmlFor="v2" className="cursor-pointer flex-1">Servicios / Agencia / Coaching</Label>
                                            </div>
                                            <div
                                                onClick={() => updateData({ vertical: "Tradicional / Físico" })}
                                                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.vertical === "Tradicional / Físico" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                            >
                                                <RadioGroupItem value="Tradicional / Físico" id="v3" />
                                                <Label htmlFor="v3" className="cursor-pointer flex-1">Tradicional / E-commerce / Físico</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 1: Stage & Team */}
                        {step === 1 && (
                            <>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-bold text-white">Estado y Equipo</h3>
                                    <div className="space-y-3">
                                        <Label>Estado actual del desarrollo</Label>
                                        <RadioGroup value={data.stage} onValueChange={(v: string) => updateData({ stage: v })}>
                                            <div
                                                onClick={() => updateData({ stage: "Solo Idea" })}
                                                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.stage === "Solo Idea" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                            >
                                                <RadioGroupItem value="Solo Idea" id="s1" />
                                                <Label htmlFor="s1" className="cursor-pointer flex-1">Solo Idea (Pre-Product)</Label>
                                            </div>
                                            <div
                                                onClick={() => updateData({ stage: "MVP / Prototipo" })}
                                                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.stage === "MVP / Prototipo" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                            >
                                                <RadioGroupItem value="MVP / Prototipo" id="s2" />
                                                <Label htmlFor="s2" className="cursor-pointer flex-1">MVP / Prototipo (En construcción)</Label>
                                            </div>
                                            <div
                                                onClick={() => updateData({ stage: "En el mercado" })}
                                                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.stage === "En el mercado" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                            >
                                                <RadioGroupItem value="En el mercado" id="s3" />
                                                <Label htmlFor="s3" className="cursor-pointer flex-1">En el mercado (Con usuarios)</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <Label>Estructura del Equipo</Label>
                                        <RadioGroup value={data.teamSize} onValueChange={(v: string) => updateData({ teamSize: v })}>
                                            <div
                                                onClick={() => updateData({ teamSize: "Solo Founder" })}
                                                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.teamSize === "Solo Founder" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                            >
                                                <RadioGroupItem value="Solo Founder" id="t1" />
                                                <Label htmlFor="t1" className="cursor-pointer flex-1">Solo Founder (Yo)</Label>
                                            </div>
                                            <div
                                                onClick={() => updateData({ teamSize: "2-3 Co-founders" })}
                                                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.teamSize === "2-3 Co-founders" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                            >
                                                <RadioGroupItem value="2-3 Co-founders" id="t2" />
                                                <Label htmlFor="t2" className="cursor-pointer flex-1">2-3 Co-founders</Label>
                                            </div>
                                            <div
                                                onClick={() => updateData({ teamSize: "Equipo Completo" })}
                                                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.teamSize === "Equipo Completo" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                            >
                                                <RadioGroupItem value="Equipo Completo" id="t3" />
                                                <Label htmlFor="t3" className="cursor-pointer flex-1">Equipo Completo (+5 personas)</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-2">
                                        <Checkbox id="doxxed" checked={data.isDoxxed} onCheckedChange={(c: boolean) => updateData({ isDoxxed: c === true })} />
                                        <Label htmlFor="doxxed" className="text-sm text-zinc-400 font-normal">
                                            Somos un equipo público (Doxxed / LinkedIn Visible)
                                        </Label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 2: Metrics */}
                        {step === 2 && (
                            <>
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-white">Tracción y Números</h3>

                                    <div className="space-y-3">
                                        <Label>Usuarios Activos / Comunidad</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {["0", "1-100", "100-1k", "+1k"].map((opt) => (
                                                <div key={opt}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => updateData({ users: opt })}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') updateData({ users: opt }); }}
                                                    className={`border rounded-lg p-3 text-center cursor-pointer transition-all ${data.users === opt ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-zinc-800 hover:border-zinc-600 text-zinc-400'}`}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label>Ingresos Mensuales (MRR / Ventas)</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {["$0 (Pre-revenue)", "$1k - $5k", "$5k - $20k", "$20k +"].map((opt) => (
                                                <div key={opt}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => updateData({ revenue: opt })}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') updateData({ revenue: opt }); }}
                                                    className={`border rounded-lg p-3 text-center cursor-pointer transition-all ${data.revenue === opt ? 'border-green-500 bg-green-500/10 text-white' : 'border-zinc-800 hover:border-zinc-600 text-zinc-400'}`}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 3: Infra & Tech */}
                        {step === 3 && (
                            <>
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-white">Capacidad de Inversión</h3>
                                    <p className="text-zinc-400 text-sm">
                                        Para construir infraestructura de calidad institucional, se requiere capital.
                                        ¿Cuál es el rango de presupuesto disponible para desarrollo y tecnología?
                                    </p>

                                    <div className="space-y-2">
                                        {["$5,000 – $10,000", "$10,000 – $25,000", "$25,000 – $50,000", "$50,000+"].map((opt) => (
                                            <div key={opt}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => updateData({ budget: opt })}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') updateData({ budget: opt }); }}
                                                className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${data.budget === opt ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-800 hover:bg-zinc-900'}`}
                                            >
                                                <span className={data.budget === opt ? 'text-white font-medium' : 'text-zinc-400'}>{opt}</span>
                                                {data.budget === opt && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                                            </div>
                                        ))}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => updateData({ budget: "Aún no definido" })}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') updateData({ budget: "Aún no definido" }); }}
                                            className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all ${data.budget === "Aún no definido" ? 'border-zinc-500' : 'border-zinc-800 hover:bg-zinc-900'}`}
                                        >
                                            <span className="text-zinc-500">Aún no definido / Buscando Inversión</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 4: Business Model */}
                        {step === 4 && (
                            <>
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-white">Modelo de Trabajo</h3>
                                    <p className="text-zinc-400 text-sm">¿Cómo prefieres estructurar la colaboración con Pandora?</p>

                                    <RadioGroup value={data.model} onValueChange={(v: string) => updateData({ model: v })}>
                                        <div
                                            onClick={() => updateData({ model: "Pago directo" })}
                                            className={`border p-4 rounded-xl cursor-pointer space-y-2 transition-colors ${data.model === "Pago directo" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900/50"}`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Pago directo" id="m1" />
                                                <Label htmlFor="m1" className="cursor-pointer font-bold text-white">Pago Directo (Service Provider)</Label>
                                            </div>
                                            <p className="text-xs text-zinc-500 pl-6">Contratas servicios específicos. Sin equity share. Mayor control.</p>
                                        </div>

                                        <div
                                            onClick={() => updateData({ model: "Sociedad / RevShare" })}
                                            className={`border p-4 rounded-xl cursor-pointer space-y-2 transition-colors ${data.model === "Sociedad / RevShare" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900/50"}`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Sociedad / RevShare" id="m2" />
                                                <Label htmlFor="m2" className="cursor-pointer font-bold text-white">Partnership / Revenue Share</Label>
                                            </div>
                                            <p className="text-xs text-zinc-500 pl-6">Pandora invierte tecnología a cambio de % de éxito. Requiere alta validación.</p>
                                        </div>

                                        <div
                                            onClick={() => updateData({ model: "Recomendación" })}
                                            className={`border p-4 rounded-xl cursor-pointer space-y-2 transition-colors ${data.model === "Recomendación" ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900/50"}`}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="Recomendación" id="m3" />
                                                <Label htmlFor="m3" className="cursor-pointer font-bold text-white">No lo tengo claro</Label>
                                            </div>
                                            <p className="text-xs text-zinc-500 pl-6">Buscando asesoría para definir la mejor estructura.</p>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </>
                        )}

                        {/* Step 5: Risk */}
                        {step === 5 && (
                            <>
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                                        <ShieldCheck className="text-yellow-500" /> Riesgo y Compromiso
                                    </h3>

                                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                                        <p className="text-yellow-200 text-sm">
                                            <strong>Importante:</strong> Pandora no garantiza resultados financieros.
                                            Construir un protocolo o startup conlleva riesgos inherentes.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-white text-lg font-medium">¿Estás de acuerdo en asumir el riesgo del negocio?</p>
                                        <div className="flex gap-4">
                                            <Button
                                                onClick={() => updateData({ acceptsRisk: true })}
                                                className={`flex-1 h-14 text-lg border ${data.acceptsRisk === true ? 'bg-white text-black hover:bg-zinc-200' : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-white hover:text-white'}`}
                                            >
                                                Sí, asumo el riesgo
                                            </Button>
                                            <Button
                                                onClick={() => updateData({ acceptsRisk: false })}
                                                className={`flex-1 h-14 text-lg border ${data.acceptsRisk === false ? 'bg-red-500/20 text-red-500 border-red-500' : 'bg-transparent border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-500'}`}
                                            >
                                                No
                                            </Button>
                                        </div>
                                        {data.acceptsRisk === false && (
                                            <p className="text-red-500 text-sm text-center">Debes aceptar el riesgo para continuar.</p>
                                        )}
                                    </div>

                                    <hr className="border-zinc-800" />

                                    <div className="space-y-3">
                                        <Label>¿En qué plazo te gustaría lanzar?</Label>
                                        <RadioGroup value={data.timeline} onValueChange={(v: string) => updateData({ timeline: v })}>
                                            <div className="flex flex-col gap-2">
                                                {["Inmediatamente (0-30 días)", "1-3 meses", "3-6 meses", "Solo explorando"].map((t) => (
                                                    <div
                                                        key={t}
                                                        onClick={() => updateData({ timeline: t })}
                                                        className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${data.timeline === t ? "border-purple-500 bg-purple-500/10" : "border-zinc-800 hover:bg-zinc-900"}`}
                                                    >
                                                        <RadioGroupItem value={t} id={t} />
                                                        <Label htmlFor={t} className="cursor-pointer flex-1">{t}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </RadioGroup>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Step 6: Golden Question & Contact */}
                        {step === 6 && (
                            <>
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-bold text-white">Últimos Pasos</h3>

                                    <div className="space-y-3">
                                        <Label className="text-lg text-purple-400">¿Por qué crees que tu proyecto debería ser aceptado por Pandora?</Label>
                                        <p className="text-xs text-zinc-500">Esta respuesta es la más importante de toda la aplicación.</p>
                                        <Textarea
                                            placeholder="Vélenos tu visión..."
                                            className="bg-zinc-900 border-zinc-700 min-h-[120px]"
                                            value={data.whyPandora}
                                            onChange={(e) => updateData({ whyPandora: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Tu Email Profesional</Label>
                                            <Input
                                                type="email"
                                                placeholder="founder@startup.com"
                                                className="bg-zinc-900 border-zinc-700"
                                                value={data.contactEmail}
                                                onChange={(e) => updateData({ contactEmail: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>WhatsApp / Telegram / Discord</Label>
                                            <Input
                                                placeholder="@handle o +52..."
                                                className="bg-zinc-900 border-zinc-700"
                                                value={data.contactHandle}
                                                onChange={(e) => updateData({ contactHandle: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer / Controls */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                <Button
                    variant="ghost"
                    onClick={step === 0 ? onClose : prevStep}
                    disabled={isSubmitting}
                    className="text-zinc-400 hover:text-white"
                >
                    {step === 0 ? "Cancelar" : "Atrás"}
                </Button>

                {step < 6 ? (
                    <Button
                        onClick={nextStep}
                        className="bg-white text-black hover:bg-zinc-200 font-bold"
                    >
                        Siguiente <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !data.whyPandora || !data.contactEmail || !data.acceptsRisk}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold px-8"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                        Enviar Aplicación
                    </Button>
                )}
            </div>
        </div>
    );
}

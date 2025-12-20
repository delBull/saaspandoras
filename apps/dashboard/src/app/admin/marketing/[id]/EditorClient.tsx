
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Import Badge
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash2, Clock, Mail, MessageSquare, Edit } from "lucide-react"; // Import Icons
import { toast } from "sonner";

interface CampaignStep {
    day: number;
    type: 'whatsapp' | 'email';
    body?: string;
    subject?: string;
    // Legacy
    contentId?: string;
    message?: string;
}

interface Campaign {
    id: number;
    name: string;
    isActive: boolean | null;
    triggerType: string | null;
    config: any;
}

export function CampaignEditorClient({ campaign }: { campaign: Campaign }) {
    const router = useRouter();
    const [steps, setSteps] = useState<CampaignStep[]>((campaign.config?.steps as CampaignStep[]) || []);
    const [name, setName] = useState(campaign.name);
    const [isActive, setIsActive] = useState(campaign.isActive || false);
    const [saving, setSaving] = useState(false);
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/marketing/update`, {
                method: 'POST',
                body: JSON.stringify({
                    id: campaign.id,
                    name,
                    isActive,
                    config: { steps }
                })
            });

            if (res.ok) {
                toast.success("Campaña guardada");
                router.refresh();
            } else {
                toast.error("Error al guardar");
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setSaving(false);
        }
    };

    const addStep = () => {
        const lastDay = steps.length > 0 ? steps[steps.length - 1]?.day || 0 : 0;
        const newStep: CampaignStep = {
            day: lastDay + 1,
            type: 'email',
            subject: 'Nuevo Correo',
            body: 'Hola {{name}},...'
        };
        const newSteps = [...steps, newStep];
        setSteps(newSteps);
        setSelectedStepIndex(newSteps.length - 1);
    };

    const updateStep = (index: number, field: keyof CampaignStep, value: any) => {
        const newSteps = [...steps];
        if (!newSteps[index]) return;
        newSteps[index] = { ...newSteps[index], [field]: value } as CampaignStep;
        setSteps(newSteps);
    };

    const removeStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
        setSelectedStepIndex(null);
    };

    return (
        <div className="flex h-full gap-6">
            {/* Left: Metadata & Step List */}
            <div className="w-1/3 flex flex-col gap-4 border-r pr-6 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="font-bold text-lg border-transparent hover:border-input focus:border-input"
                    />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                    <span className="text-sm font-medium">Estado</span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${isActive ? "text-green-500" : "text-gray-500"}`}>
                            {isActive ? "ACTIVA" : "PAUSADA"}
                        </span>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                </div>

                <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Secuencia ({steps.length})</span>
                        <Button size="sm" variant="ghost" onClick={addStep}>
                            <Plus className="h-4 w-4 mr-1" /> Agregar
                        </Button>
                    </div>

                    {steps.map((step, idx) => (
                        <div
                            key={idx}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedStepIndex(idx); }}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedStepIndex === idx ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                            onClick={() => setSelectedStepIndex(idx)}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                                    <Clock className="h-3 w-3" /> Día {step.day}
                                </Badge>
                                {step.type === 'email' ? <Mail className="h-3 w-3 text-blue-500" /> : <MessageSquare className="h-3 w-3 text-green-500" />}
                            </div>
                            <div className="text-sm font-medium truncate">
                                {step.subject || step.message || "Sin título"}
                            </div>
                            {step.contentId && <div className="text-[10px] text-yellow-600 mt-1">⚠️ Legacy Map</div>}
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-4">
                    <Button className="w-full" onClick={handleSave} disabled={saving}>
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </div>

            {/* Right: Step Editor */}
            <div className="w-2/3 pl-2 overflow-y-auto">
                {selectedStepIndex !== null && steps[selectedStepIndex] ? (() => {
                    const currentStep = steps[selectedStepIndex];
                    if (!currentStep) return null;
                    return (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center pb-4 border-b">
                                <h2 className="text-xl font-semibold">Editar Paso {selectedStepIndex + 1}</h2>
                                <Button variant="destructive" size="sm" onClick={() => removeStep(selectedStepIndex)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="step-type">Tipo</label>
                                    <Select
                                        value={currentStep.type}
                                        onValueChange={(v: any) => updateStep(selectedStepIndex, 'type', v)}
                                    >
                                        <SelectTrigger id="step-type">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium" htmlFor="step-day">Día de ejecución</label>
                                    <Input
                                        id="step-day"
                                        type="number"
                                        value={currentStep.day}
                                        onChange={(e) => updateStep(selectedStepIndex, 'day', parseInt(e.target.value))}
                                    />
                                    <p className="text-xs text-muted-foreground">Días después del inicio (0 = inmediato)</p>
                                </div>
                            </div>

                            {currentStep.type === 'email' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium" htmlFor="step-subject">Asunto</label>
                                        <Input
                                            id="step-subject"
                                            value={currentStep.subject || ''}
                                            onChange={(e) => updateStep(selectedStepIndex, 'subject', e.target.value)}
                                            placeholder="Asunto del correo..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium" htmlFor="step-body">Contenido (HTML/Texto)</label>
                                        <div className="relative">
                                            <Textarea
                                                id="step-body"
                                                value={currentStep.body || ''}
                                                onChange={(e) => updateStep(selectedStepIndex, 'body', e.target.value)}
                                                className="min-h-[300px] font-mono text-sm leading-relaxed"
                                                placeholder="Hola {{name}},..."
                                            />
                                            <div className="absolute top-2 right-2 flex gap-1">
                                                <Badge variant="secondary" className="cursor-pointer" onClick={() => {
                                                    const val = currentStep.body || '';
                                                    updateStep(selectedStepIndex, 'body', val + ' {{name}}');
                                                }}>+ Nombre</Badge>
                                                <Badge variant="secondary" className="cursor-pointer" onClick={() => {
                                                    const val = currentStep.body || '';
                                                    updateStep(selectedStepIndex, 'body', val + ' {{project}}');
                                                }}>+ Proyecto</Badge>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Variables disponibles:{"{{name}}"}, {"{{project}}"}</p>
                                    </div>
                                </div>
                            )}

                            {currentStep.type === 'whatsapp' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium" htmlFor="wa-message">Mensaje</label>
                                        <Textarea
                                            id="wa-message"
                                            value={currentStep.body || currentStep.message || ''}
                                            onChange={(e) => updateStep(selectedStepIndex, 'body', e.target.value)}
                                            className="min-h-[150px]"
                                            placeholder="Hola {{name}},..."
                                        />
                                        <p className="text-xs text-muted-foreground">Variables disponibles: {"{{name}}"}, {"{{project}}"}</p>
                                    </div>
                                </div>
                            )}

                            {currentStep.contentId && (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                                    <h4 className="font-semibold text-yellow-600 text-sm">Modo Legacy Activo</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Este paso usa contenido hardcodeado ({currentStep.contentId}). Al editar y guardar el contenido arriba, se sobrescribirá y pasará a modo Dinámico.</p>
                                </div>
                            )}
                        </div>
                    );
                })() : (
                    <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-4">
                        <Edit className="h-12 w-12 opacity-20" />
                        <p>Selecciona un paso para editar</p>
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Plus, Trash2, Clock, Mail, MessageSquare, Edit, Layers, Settings, Workflow } from "lucide-react";
import { toast } from "sonner";
import { CampaignTiersEditor, Tier, SOW } from "./CampaignTiersEditor";

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
    // Default config values
    const [steps, setSteps] = useState<CampaignStep[]>((campaign.config?.steps as CampaignStep[]) || []);
    const [tiers, setTiers] = useState<Tier[]>((campaign.config?.tiers as Tier[]) || []);
    const [sows, setSows] = useState<SOW[]>((campaign.config?.sows as SOW[]) || []);

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
                    config: {
                        steps,
                        tiers,
                        sows
                    }
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
        <div className="h-full flex flex-col gap-4">
            {/* Header Area */}
            <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="font-bold text-xl border-transparent hover:border-input focus:border-input h-8 px-0"
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant={isActive ? "default" : "secondary"} className="text-[10px]">
                                {isActive ? "ACTIVA" : "PAUSADA"}
                            </Badge>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Trigger: {campaign.triggerType || 'Manual'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-400">Estado</span>
                        <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="sequence" className="flex-1 flex flex-col overflow-hidden">
                <div className="border-b border-zinc-800 bg-zinc-900/30 px-4">
                    <TabsList className="bg-transparent h-12 gap-6 p-0">
                        <TabsTrigger value="sequence" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none h-full px-2 text-zinc-400 data-[state=active]:text-white">
                            <Workflow className="w-4 h-4 mr-2" /> Secuencia
                        </TabsTrigger>
                        <TabsTrigger value="tiers" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none h-full px-2 text-zinc-400 data-[state=active]:text-white">
                            <Layers className="w-4 h-4 mr-2" /> Oferta & SOW
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none h-full px-2 text-zinc-400 data-[state=active]:text-white">
                            <Settings className="w-4 h-4 mr-2" /> Configuración
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden p-0 pt-4">
                    {/* SEQUENCE EDITOR TAB */}
                    <TabsContent value="sequence" className="h-full m-0 data-[state=active]:flex gap-6">
                        {/* Step List */}
                        <div className="w-1/3 flex flex-col gap-4 border-r border-zinc-800 pr-6 overflow-y-auto h-full">
                            <div className="flex justify-between items-center text-sm text-muted-foreground px-2">
                                <span>Pasos ({steps.length})</span>
                                <Button size="sm" variant="ghost" onClick={addStep}>
                                    <Plus className="h-4 w-4 mr-1" /> Agregar
                                </Button>
                            </div>

                            <div className="space-y-2 pb-4">
                                {steps.map((step, idx) => (
                                    <div
                                        key={idx}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedStepIndex(idx); }}
                                        className={`p-4 rounded-lg border group cursor-pointer transition-all ${selectedStepIndex === idx
                                            ? 'border-purple-500 bg-purple-500/5'
                                            : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}`}
                                        onClick={() => setSelectedStepIndex(idx)}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <Badge variant="outline" className="text-[10px] h-5 gap-1 border-zinc-700 text-zinc-400">
                                                <Clock className="h-3 w-3" /> Día {step.day}
                                            </Badge>
                                            {step.type === 'email' ?
                                                <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"><Mail className="h-3 w-3 mr-1" /> Email</Badge> :
                                                <Badge variant="secondary" className="bg-green-500/10 text-green-400 hover:bg-green-500/20"><MessageSquare className="h-3 w-3 mr-1" /> WhatsApp</Badge>}
                                        </div>
                                        <div className="text-sm font-medium truncate text-zinc-200">
                                            {step.subject || step.message || "Sin título"}
                                        </div>
                                        <div className="text-xs text-zinc-500 mt-1 truncate">
                                            {step.body ? stripHtml(step.body).substring(0, 50) + '...' : 'Sin contenido'}
                                        </div>
                                        {step.contentId && <div className="text-[10px] text-yellow-600 mt-2 flex items-center gap-1"><Workflow className="w-3 h-3" /> Legacy Map</div>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Step Editor Detail */}
                        <div className="w-2/3 pl-2 overflow-y-auto h-full pb-20">
                            {selectedStepIndex !== null && steps[selectedStepIndex] ? (() => {
                                const currentStep = steps[selectedStepIndex];
                                if (!currentStep) return null;
                                return (
                                    <div className="space-y-6 max-w-3xl">
                                        <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                                            <h2 className="text-xl font-semibold text-white">Editar Paso {selectedStepIndex + 1}</h2>
                                            <Button variant="destructive" size="sm" onClick={() => removeStep(selectedStepIndex)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar Paso
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-400">Canal de Envío</label>
                                                <Select
                                                    value={currentStep.type}
                                                    onValueChange={(v: any) => updateStep(selectedStepIndex, 'type', v)}
                                                >
                                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="email">Email Marketing</SelectItem>
                                                        <SelectItem value="whatsapp">WhatsApp Business</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-400">Timing (Días desde inicio)</label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={currentStep.day}
                                                        onChange={(e) => updateStep(selectedStepIndex, 'day', parseInt(e.target.value))}
                                                        className="bg-zinc-950 border-zinc-800 w-24"
                                                    />
                                                    <span className="text-xs text-zinc-500">0 = Inmediato</span>
                                                </div>
                                            </div>
                                        </div>

                                        {currentStep.type === 'email' && (
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-zinc-400">Asunto del Correo</label>
                                                    <Input
                                                        value={currentStep.subject || ''}
                                                        onChange={(e) => updateStep(selectedStepIndex, 'subject', e.target.value)}
                                                        placeholder="Ej: Bienvenido al futuro de la inversión..."
                                                        className="bg-zinc-950 border-zinc-800 text-lg font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <label className="text-sm font-medium text-zinc-400">Contenido HTML</label>
                                                        <div className="flex gap-2">
                                                            <Badge variant="outline" className="cursor-pointer hover:bg-zinc-800" onClick={() => updateStep(selectedStepIndex, 'body', (currentStep.body || '') + ' {{name}}')}>+ Nombre</Badge>
                                                            <Badge variant="outline" className="cursor-pointer hover:bg-zinc-800" onClick={() => updateStep(selectedStepIndex, 'body', (currentStep.body || '') + ' {{project}}')}>+ Proyecto</Badge>
                                                        </div>
                                                    </div>
                                                    <Textarea
                                                        value={currentStep.body || ''}
                                                        onChange={(e) => updateStep(selectedStepIndex, 'body', e.target.value)}
                                                        className="min-h-[400px] font-mono text-sm leading-relaxed bg-zinc-950 border-zinc-800"
                                                        placeholder="<html>...</html>"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {currentStep.type === 'whatsapp' && (
                                            <div className="space-y-4">
                                                <div className="bg-green-500/5 p-4 rounded-lg border border-green-500/20">
                                                    <h4 className="text-green-400 font-medium text-sm mb-2 flex items-center"><MessageSquare className="w-4 h-4 mr-2" /> WhatsApp Template</h4>
                                                    <Textarea
                                                        value={currentStep.body || currentStep.message || ''}
                                                        onChange={(e) => updateStep(selectedStepIndex, 'body', e.target.value)}
                                                        className="min-h-[150px] bg-zinc-950 border-zinc-800"
                                                        placeholder="Hola {{name}},..."
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })() : (
                                <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-4">
                                    <div className="p-6 rounded-full bg-zinc-900 border border-zinc-800">
                                        <Edit className="h-8 w-8 opacity-50" />
                                    </div>
                                    <p>Selecciona un paso de la izquierda para editarlo</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* TIERS & SOW TAB */}
                    <TabsContent value="tiers" className="h-full overflow-y-auto pb-20">
                        <div className="max-w-6xl mx-auto py-6">
                            <CampaignTiersEditor
                                tiers={tiers}
                                sows={sows}
                                onChangeTiers={setTiers}
                                onChangeSOWs={setSows}
                            />
                        </div>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings" className="h-full">
                        <div className="max-w-2xl mx-auto py-12 space-y-8">
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardContent className="pt-6 space-y-4">
                                    <h3 className="text-lg font-medium text-white">Configuración General</h3>
                                    <div className="grid gap-4">
                                        <div className="flex flex-col space-y-1.5">
                                            <label className="text-sm text-zinc-400">Trigger Type</label>
                                            <Select value={campaign.triggerType || 'manual'} disabled>
                                                <SelectTrigger className="bg-zinc-950 border-zinc-800"><SelectValue /></SelectTrigger>
                                                <SelectContent><SelectItem value={campaign.triggerType || 'manual'}>{campaign.triggerType || 'Manual'}</SelectItem></SelectContent>
                                            </Select>
                                            <p className="text-xs text-zinc-600">El trigger se define al crear la campaña.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function stripHtml(html: string) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

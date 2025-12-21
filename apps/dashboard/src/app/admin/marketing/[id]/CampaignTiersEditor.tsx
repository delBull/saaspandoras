"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check, GripVertical } from "lucide-react";

export interface Tier {
    name: string;
    price: number;
    description: string;
    features: string[];
}

export interface SOW {
    tierId: string; // Links to Tier Name for now
    deliverables: string; // Multiline text
    timeline: string;
    terms: string;
}

interface CampaignTiersEditorProps {
    tiers: Tier[];
    sows: SOW[];
    onChangeTiers: (tiers: Tier[]) => void;
    onChangeSOWs: (sows: SOW[]) => void;
}

export function CampaignTiersEditor({ tiers, sows, onChangeTiers, onChangeSOWs }: CampaignTiersEditorProps) {
    const [activeTab, setActiveTab] = useState("tiers");

    const addTier = () => {
        onChangeTiers([...tiers, { name: "Nuevo Tier", price: 0, description: "", features: [] }]);
    };

    const updateTier = (index: number, field: keyof Tier, value: any) => {
        const newTiers = [...tiers];
        if (newTiers[index]) {
            newTiers[index] = { ...newTiers[index], [field]: value };
            onChangeTiers(newTiers);
        }
    };

    const removeTier = (index: number) => {
        const newTiers = [...tiers];
        newTiers.splice(index, 1);
        onChangeTiers(newTiers);
    };

    const addFeature = (tierIndex: number) => {
        const newTiers = [...tiers];
        if (newTiers[tierIndex]) {
            // Create a new array for features to avoid mutation issues if strict
            const features = [...newTiers[tierIndex].features, "Nueva característica"];
            newTiers[tierIndex] = { ...newTiers[tierIndex], features };
            onChangeTiers(newTiers);
        }
    };

    const updateFeature = (tierIndex: number, featureIndex: number, value: string) => {
        const newTiers = [...tiers];
        if (newTiers[tierIndex]) {
            const features = [...newTiers[tierIndex].features];
            features[featureIndex] = value;
            newTiers[tierIndex] = { ...newTiers[tierIndex], features };
            onChangeTiers(newTiers);
        }
    };

    const removeFeature = (tierIndex: number, featureIndex: number) => {
        const newTiers = [...tiers];
        if (newTiers[tierIndex]) {
            const features = [...newTiers[tierIndex].features];
            features.splice(featureIndex, 1);
            newTiers[tierIndex] = { ...newTiers[tierIndex], features };
            onChangeTiers(newTiers);
        }
    };

    // Helper to get or create SOW for a tier
    const getSOW = (tierName: string) => {
        return sows.find(s => s.tierId === tierName) || { tierId: tierName, deliverables: "", timeline: "", terms: "" };
    };

    const updateSOW = (tierName: string, field: keyof SOW, value: string) => {
        const existingIndex = sows.findIndex(s => s.tierId === tierName);
        let newSOWs = [...sows];

        if (existingIndex >= 0) {
            newSOWs[existingIndex] = {
                ...newSOWs[existingIndex],
                [field]: value
            } as SOW;
        } else {
            // Create new
            const newItem: SOW = {
                tierId: tierName,
                deliverables: "",
                timeline: "",
                terms: "",
                [field]: value
            };
            newSOWs.push(newItem);
        }
        onChangeSOWs(newSOWs);
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-zinc-800">
                    <TabsTrigger value="tiers">Oferta Comercial (Tiers)</TabsTrigger>
                    <TabsTrigger value="sow">Scope of Work (SOW)</TabsTrigger>
                </TabsList>

                <TabsContent value="tiers" className="space-y-6 mt-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-white">Niveles de Servicio</h3>
                        <Button onClick={addTier} variant="secondary" size="sm">
                            <Plus className="w-4 h-4 mr-2" /> Agregar Tier
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {tiers.length === 0 && (
                            <div className="col-span-3 text-center py-12 border border-dashed rounded-lg text-muted-foreground">
                                No hay tiers definidos. Comienza agregando uno.
                            </div>
                        )}
                        {tiers.map((tier, idx) => (
                            <Card key={idx} className="bg-zinc-900 border-zinc-700 relative group">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => removeTier(idx)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                                <CardHeader className="pb-2">
                                    <Input
                                        value={tier.name}
                                        onChange={(e) => updateTier(idx, 'name', e.target.value)}
                                        className="font-bold text-lg bg-transparent border-none p-0 focus-visible:ring-0 mb-2"
                                        placeholder="Nombre del Tier"
                                    />
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-zinc-400">$</span>
                                        <Input
                                            type="number"
                                            value={tier.price}
                                            onChange={(e) => updateTier(idx, 'price', parseFloat(e.target.value))}
                                            className="pl-6 bg-zinc-950/50 border-zinc-800"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Textarea
                                        value={tier.description}
                                        onChange={(e) => updateTier(idx, 'description', e.target.value)}
                                        className="text-xs min-h-[60px] bg-zinc-950/50 border-zinc-800 resize-none"
                                        placeholder="Descripción corta para la landing..."
                                    />

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                                            <span>Features</span>
                                            <Button variant="ghost" size="sm" className="h-4 p-0" onClick={() => addFeature(idx)}>
                                                <Plus className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <ul className="space-y-1">
                                            {tier.features.map((feat, fIdx) => (
                                                <li key={fIdx} className="flex gap-2 items-center">
                                                    <Check className="w-3 h-3 text-green-500 shrink-0" />
                                                    <Input
                                                        value={feat}
                                                        onChange={(e) => updateFeature(idx, fIdx, e.target.value)}
                                                        className="h-6 text-xs bg-transparent border-transparent hover:border-zinc-800 focus:border-zinc-700 p-0"
                                                    />
                                                    <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0 text-zinc-600 hover:text-red-400" onClick={() => removeFeature(idx, fIdx)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="sow" className="space-y-6 mt-6">
                    <p className="text-sm text-zinc-400 mb-4">Define los detalles operativos (Scope of Work) para cada nivel, que se usarán en los contratos.</p>

                    {tiers.map((tier, idx) => {
                        const sow = getSOW(tier.name);
                        return (
                            <Card key={idx} className="bg-zinc-900 border-zinc-700">
                                <CardHeader>
                                    <CardTitle className="text-base text-white">{tier.name} - SOW Definition</CardTitle>
                                </CardHeader>
                                <CardContent className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold uppercase text-zinc-500">Entregables (Deliverables)</label>
                                        <Textarea
                                            value={sow.deliverables}
                                            onChange={(e) => updateSOW(tier.name, 'deliverables', e.target.value)}
                                            className="min-h-[150px] bg-zinc-950 font-mono text-xs"
                                            placeholder="- Deployment smart contracts...&#10;- Auditoría básica...&#10;- Dashboard access..."
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase text-zinc-500">Timeline Estimado</label>
                                            <Input
                                                value={sow.timeline}
                                                onChange={(e) => updateSOW(tier.name, 'timeline', e.target.value)}
                                                className="bg-zinc-950"
                                                placeholder="Ej: 4-6 Semanas"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase text-zinc-500">Términos Clave</label>
                                            <Textarea
                                                value={sow.terms}
                                                onChange={(e) => updateSOW(tier.name, 'terms', e.target.value)}
                                                className="min-h-[80px] bg-zinc-950 text-xs"
                                                placeholder="Pago 50% anticipo, 50% contra entrega..."
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {tiers.length === 0 && <p className="text-zinc-500">Crea Tiers primero para definir sus SOWs.</p>}
                </TabsContent>
            </Tabs>
        </div>
    );
}

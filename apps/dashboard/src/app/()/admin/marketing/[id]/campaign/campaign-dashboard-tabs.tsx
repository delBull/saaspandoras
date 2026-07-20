"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Link as LinkIcon, FileText, Video, Presentation, Calendar, Search, ArrowRight, Mic, Users, Layout } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCampaignTracker } from "@/actions/campaigns";
import { linkResourceToCampaign } from "@/actions/resources";

export function CampaignDashboardTabs({ 
    campaign, 
    stats, 
    projectEvents, 
    demandEvents,
    trackers = [],
    platformAssets = [],
    allProjectResources = []
}: { 
    campaign: any, 
    stats: any, 
    projectEvents: any[], 
    demandEvents: any[],
    trackers?: any[],
    platformAssets?: any[],
    allProjectResources?: any[]
}) {
    const router = useRouter();
    const [openTracker, setOpenTracker] = useState(false);
    const [openLinker, setOpenLinker] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [linking, setLinking] = useState(false);

    const handleGenerateTracker = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setGenerating(true);
        const formData = new FormData(e.currentTarget);
        
        try {
            const assetId = formData.get("assetId") as string;
            let destinationUrl = formData.get("destinationUrl") as string;

            if (assetId && assetId !== "none") {
                const asset = allProjectResources.find(a => a.id.toString() === assetId);
                if (asset && asset.url) {
                    destinationUrl = asset.url; // Auto-inherit URL
                }
            }

            const res = await createCampaignTracker({
                campaignId: campaign.id,
                slug: formData.get("slug") as string,
                title: formData.get("title") as string,
                destinationUrl: destinationUrl || 'https://pandoras.finance',
                source: formData.get("source") as string,
                medium: formData.get("medium") as string,
                assetId: assetId && assetId !== "none" ? parseInt(assetId) : undefined
            });

            if (res.success) {
                toast.success("Tracker generado con éxito");
                setOpenTracker(false);
                router.refresh(); // Reload to show new tracker
            } else {
                toast.error(res.error || "Error al generar tracker");
            }
        } catch(err) {
            toast.error("Error de conexión");
        } finally {
            setGenerating(false);
        }
    };

    const handleLinkResource = async (assetId: number) => {
        setLinking(true);
        try {
            const res = await linkResourceToCampaign({
                campaignId: campaign.id,
                assetId: assetId
            });
            if (res.success) {
                toast.success("Recurso vinculado a la campaña.");
                setOpenLinker(false);
                router.refresh();
            } else {
                toast.error(res.error || "No se pudo vincular");
            }
        } catch(err) {
            toast.error("Error al vincular recurso");
        } finally {
            setLinking(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Enlace copiado al portapapeles");
    };

    return (
        <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activations">Activations</TabsTrigger>
                <TabsTrigger value="telemetry">Telemetry</TabsTrigger>
                <TabsTrigger value="trackers">Trackers</TabsTrigger>
                <TabsTrigger value="assets">Platform Assets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
                {/* KPIs Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.score || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revenue Generado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${stats?.revenue || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Leads (Contactos)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.leads || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Purchases (Ventas)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.purchases || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.clicks || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Impresiones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.impressions || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Campaign Details */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración</CardTitle>
                            <CardDescription>Detalles técnicos de la campaña</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Presupuesto Asignado:</span>
                                <span className="font-medium">{campaign.budget ? `$${campaign.budget}` : 'No definido'}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Target Scope:</span>
                                <span className="font-medium uppercase">{campaign.scope}</span>
                            </div>
                            <div className="flex justify-between border-b pb-2">
                                <span className="text-muted-foreground">Origen (Source):</span>
                                <span className="font-medium capitalize">{campaign.source}</span>
                            </div>
                            <div className="flex justify-between pb-2">
                                <span className="text-muted-foreground">Fecha de Creación:</span>
                                <span className="font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            
            <TabsContent value="activations" className="space-y-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-medium">Project Activations (Resources)</h3>
                        <p className="text-sm text-muted-foreground">
                            Eventos de negocio asociados indirectamente al proyecto ({campaign.projectId}).
                            {/* TODO: Temporary lookup by projectId. Future implementation: campaign_resources bridge table. */}
                        </p>
                    </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projectEvents.length === 0 ? (
                        <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-zinc-600 bg-zinc-900/50">
                            <p>No hay activaciones registradas en este proyecto.</p>
                        </div>
                    ) : (
                        projectEvents.map((evt) => (
                            <Card key={evt.id} className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-md font-bold">{evt.title}</CardTitle>
                                        <Badge variant="outline">{evt.type}</Badge>
                                    </div>
                                    <CardDescription>{new Date(evt.date).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground">Location: </span>
                                        {evt.location || 'N/A'}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </TabsContent>

            <TabsContent value="telemetry" className="space-y-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-medium">Demand Events (Telemetry)</h3>
                        <p className="text-sm text-muted-foreground">
                            Flujo de eventos en tiempo real disparados directamente por esta campaña.
                        </p>
                    </div>
                </div>

                <Card>
                    <div className="max-h-[500px] overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground bg-muted/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Tipo</th>
                                    <th className="px-4 py-3 font-medium">Source</th>
                                    <th className="px-4 py-3 font-medium">Valor</th>
                                    <th className="px-4 py-3 font-medium">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {demandEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                            No hay telemetría aún para esta campaña.
                                        </td>
                                    </tr>
                                ) : (
                                    demandEvents.map((telem) => (
                                        <tr key={telem.id} className="border-b border-border/50 hover:bg-muted/20">
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary" className="capitalize">{telem.eventType}</Badge>
                                            </td>
                                            <td className="px-4 py-3 capitalize">{telem.source}</td>
                                            <td className="px-4 py-3 font-mono">{telem.value ? `$${telem.value}` : '-'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(telem.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </TabsContent>

            <TabsContent value="trackers" className="space-y-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-medium">Campaign Trackers</h3>
                        <p className="text-sm text-muted-foreground">
                            Enlaces de rastreo asignados directamente a esta campaña.
                        </p>
                    </div>
                    
                    <Dialog open={openTracker} onOpenChange={setOpenTracker}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Nuevo Tracker
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Generar Enlace de Rastreo</DialogTitle>
                                <DialogDescription>
                                    Crea un enlace corto que registrará telemetría antes de redirigir al destino.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleGenerateTracker} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Link Slug (ID)</label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                                                snarai.co/w/
                                            </span>
                                            <input name="slug" required className="flex h-10 w-full rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="ej: sn-ig-bio" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Título del Tracker</label>
                                        <input name="title" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Ej: Twitter Promo Link" />
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Project Resource (Recomendado)</label>
                                    <p className="text-xs text-muted-foreground mb-2">Selecciona un recurso del proyecto para enviar el tráfico directamente hacia allá y medir su impacto institucional.</p>
                                    <select name="assetId" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                        <option value="none">Sin recurso asociado (URL manual)</option>
                                        {allProjectResources.map(r => (
                                            <option key={r.id} value={r.id}>{r.title} ({r.type}) {r.version ? `[${r.version}]` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Destination URL (Fallback manual)</label>
                                    <input name="destinationUrl" type="url" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="https://..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">UTM Source (Opcional)</label>
                                        <input name="source" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Ej: twitter" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">UTM Medium (Opcional)</label>
                                        <input name="medium" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Ej: social" />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpenTracker(false)}>Cancelar</Button>
                                    <Button type="submit" disabled={generating}>{generating ? 'Generando...' : 'Crear Tracker'}</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {trackers.length === 0 ? (
                        <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-zinc-600 bg-zinc-900/50">
                            <p>No hay trackers creados para esta campaña.</p>
                        </div>
                    ) : (
                        trackers.map((t) => (
                            <Card key={t.id} className="border-l-4 border-l-purple-500">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-md font-bold">{t.title}</CardTitle>
                                    </div>
                                    <CardDescription>Destino: <span className="truncate block mt-1">{t.destinationUrl}</span></CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-border">
                                        <div className="text-sm font-mono text-muted-foreground flex items-center">
                                            <LinkIcon className="w-3 h-3 mr-1" />
                                            /w/{t.slug}
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`https://snarai.co/w/${t.slug}`)}>
                                            <Copy className="w-4 h-4 mr-1" /> Copiar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </TabsContent>

            <TabsContent value="assets" className="space-y-4 mt-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-medium">Project Resources</h3>
                        <p className="text-sm text-muted-foreground">
                            Recursos institucionales (Eventos, Docs, Webinars) vinculados a esta campaña.
                        </p>
                    </div>
                    <Dialog open={openLinker} onOpenChange={setOpenLinker}>
                        <DialogTrigger asChild>
                            <Button>
                                <Search className="w-4 h-4 mr-2" />
                                Vincular Recurso Existente
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Catálogo del Proyecto</DialogTitle>
                                <DialogDescription>
                                    Selecciona un recurso del CMS central de {campaign.project?.title || 'este proyecto'} para vincularlo a tu campaña.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 mt-4">
                                {allProjectResources.length === 0 ? (
                                    <p className="text-sm text-center py-8 text-muted-foreground">No hay recursos creados en este proyecto. Ve a Projects &gt; Resources para crear uno.</p>
                                ) : (
                                    allProjectResources.map(res => {
                                        const isLinked = platformAssets.some(a => a.id === res.id);
                                        return (
                                            <div key={res.id} className="flex items-center justify-between p-3 border rounded-lg bg-zinc-900/20">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-sm">{res.title}</span>
                                                        <Badge variant="outline" className="text-[9px]">{res.version || 'v1'}</Badge>
                                                        <Badge variant="secondary" className="text-[9px]">{res.type}</Badge>
                                                    </div>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant={isLinked ? "ghost" : "default"} 
                                                    disabled={isLinked || linking}
                                                    onClick={() => handleLinkResource(res.id)}
                                                >
                                                    {isLinked ? 'Vinculado' : 'Vincular'}
                                                </Button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {platformAssets.length === 0 ? (
                        <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-zinc-600 bg-zinc-900/50">
                            <p>Esta campaña no ha vinculado ningún asset de la plataforma.</p>
                        </div>
                    ) : (
                        platformAssets.map((asset) => (
                            <Card key={asset.id} className="border-l-4 border-l-blue-500">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-md font-bold">{asset.title}</CardTitle>
                                        <Badge variant="outline" className="uppercase text-[10px] tracking-wider">
                                            {asset.type.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <CardDescription className="capitalize mt-1">Status: {asset.status}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-border">
                                        <div className="text-sm text-muted-foreground flex items-center">
                                            {asset.type === 'project_event' && <Calendar className="w-4 h-4 mr-2" />}
                                            {asset.type === 'document' && <FileText className="w-4 h-4 mr-2" />}
                                            {asset.type === 'media' && <Video className="w-4 h-4 mr-2" />}
                                            {asset.type === 'podcast' && <Mic className="w-4 h-4 mr-2" />}
                                            {asset.type === 'meeting' && <Users className="w-4 h-4 mr-2" />}
                                            {asset.type === 'landing' && <Layout className="w-4 h-4 mr-2" />}
                                            {asset.type === 'calculator' && <Presentation className="w-4 h-4 mr-2" />}
                                            {asset.type === 'link' && <LinkIcon className="w-4 h-4 mr-2" />}
                                            Visibility: {asset.visibility}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
}

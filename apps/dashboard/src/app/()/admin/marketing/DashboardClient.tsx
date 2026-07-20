"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Edit, CreditCard, Trash2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { MarketingHelpModal } from "@/components/admin/marketing/MarketingHelpModal";
import { toggleCampaignStatus, deleteCampaign } from "@/actions/marketing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Automation {
    id: number;
    name: string;
    isActive: boolean | null;
    triggerType: string | null;
    createdAt: Date | null;
}

interface TrueCampaign {
    id: number;
    projectId: number;
    name: string;
    status: string;
    campaignType: string;
    budget: string | null;
    createdAt: Date;
}

export function MarketingHeaderActions() {
    const router = useRouter();
    const [syncing, setSyncing] = useState(false);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/admin/migrations/migrate-campaigns');
            const data = await res.json();
            if (data.success) {
                toast.success("Campañas sincronizadas correctamente");
                router.refresh();
            } else {
                toast.error("Error al sincronizar campañas");
            }
        } catch (e) {
            toast.error("Error de conexión");
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="flex gap-3 items-center">
            {/* Help Modal */}
            <MarketingHelpModal />

            <Button variant="outline" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar Flujos'}
            </Button>

            <Button variant="secondary" onClick={() => router.push('/admin/payments/links')}>
                <CreditCard className="mr-2 h-4 w-4" />
                Links de Pago
            </Button>

            <Button onClick={() => router.push('/admin/marketing/new')}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Campaña
            </Button>
        </div>
    );
}

export function MarketingCampaignList({ initialCampaigns }: { initialCampaigns: Automation[] }) {
    const router = useRouter();
    const [campaigns, setCampaigns] = useState(initialCampaigns);

    // Sync state with props if they change (e.g. from parent fetch)
    if (initialCampaigns !== campaigns && initialCampaigns.length !== campaigns.length) {
        // Simple heuristic to update if length changes, or you could use useEffect
        // but react state update loop risk.
        // Better: just use initialCampaigns as seed, but we want to update local UI optimistically?
        // Actually, let's just use props if we assume parent handles data, or local if standalone.
        // For now, let's trust the prop and add a refresh trigger if possible, or just force reload.
    }

    // Actually, simpler: render props. If action happens, router.refresh().
    // But for MarketingDashboard which is client-fetched, router.refresh() does nothing for its state.
    // Ideally we pass a "onUpdate" callback. But let's just make the actions work and reload window for now fallback, 
    // or assume standard Next.js revalidation.

    // To support both, I will rely on router.refresh() and maybe a toast.


    // Using imported actions directly.

    const handleToggle = async (e: React.MouseEvent, id: number, current: boolean) => {
        e.stopPropagation();
        try {
            const res = await toggleCampaignStatus(id, !current);
            if (res.success) {
                toast.success(`Campaña ${!current ? 'activada' : 'pausada'}`);
                router.refresh();
                // Force a hard reload if needed or just wait for SWR-like revalidation if we had it.
                // For DashboardClient-based views, this might not update immediately if they don't re-fetch.
            } else {
                toast.error("Error al actualizar estado");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("¿Estás seguro de eliminar esta campaña? Esta acción no se puede deshacer.")) return;

        try {
            const res = await deleteCampaign(id);
            if (res.success) {
                toast.success("Campaña eliminada");
                router.refresh();
            } else {
                toast.error("Error al eliminar campaña");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {initialCampaigns.map((camp) => (
                <Card key={camp.id} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => router.push(`/admin/marketing/${camp.id}`)}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium truncate pr-4">
                            {camp.name}
                        </CardTitle>
                        <Badge variant={camp.isActive ? "default" : "secondary"}>
                            {camp.isActive ? "Activa" : "Pausada"}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4">
                            Trigger: {camp.triggerType || 'Manual'}
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                            <span className="font-mono text-zinc-600">ID: {camp.id}</span>

                            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-blue-400" onClick={(e) => { e.stopPropagation(); router.push(`/admin/marketing/${camp.id}`); }}>
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-yellow-400" onClick={(e) => handleToggle(e, camp.id, !!camp.isActive)}>
                                    {camp.isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-400" onClick={(e) => handleDelete(e, camp.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {initialCampaigns.length === 0 && (
                <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-zinc-600 bg-zinc-900/50">
                    <p>No hay campañas activas.</p>
                    <p className="text-xs mt-1 text-zinc-500">Haz clic en "Sincronizar Flujos" si acabas de desplegar cambios.</p>
                </div>
            )}
        </div>
    );
}

export function TrueCampaignList({ campaigns }: { campaigns: TrueCampaign[] }) {
    const router = useRouter();

    const handleToggle = async (e: React.MouseEvent, id: number, currentStatus: string) => {
        e.stopPropagation();
        try {
            const { toggleTrueCampaignStatus } = await import('@/actions/campaigns');
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';
            const res = await toggleTrueCampaignStatus(id, newStatus);
            if (res.success) {
                toast.success(`Campaña ${newStatus === 'active' ? 'activada' : 'pausada'}`);
                router.refresh();
            } else {
                toast.error("Error al actualizar estado");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (!confirm("¿Estás seguro de archivar esta campaña? Esta acción no elimina los datos estadísticos, pero la oculta de las activas.")) return;
        
        try {
            const { toggleTrueCampaignStatus } = await import('@/actions/campaigns');
            const res = await toggleTrueCampaignStatus(id, 'archived');
            if (res.success) {
                toast.success("Campaña archivada");
                router.refresh();
            } else {
                toast.error("Error al archivar campaña");
            }
        } catch (error) {
            toast.error("Error de conexión");
        }
    };

    // Filter out archived campaigns
    const visibleCampaigns = campaigns.filter(c => c.status !== 'archived');

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleCampaigns.map((camp) => (
                <Card key={camp.id} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => router.push(`/admin/marketing/${camp.id}/campaign`)}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium truncate pr-4">
                            {camp.name}
                        </CardTitle>
                        <Badge variant={camp.status === 'active' ? "default" : "secondary"}>
                            {camp.status}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground mb-4 capitalize">
                            Type: {camp.campaignType.replace('_', ' ')}
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground border-t pt-4">
                            <span className="font-mono text-zinc-600">ID: {camp.id} | Proj: {camp.projectId}</span>

                            <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-blue-400" onClick={(e) => { e.stopPropagation(); router.push(`/admin/marketing/${camp.id}/campaign`); }}>
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-yellow-400" onClick={(e) => handleToggle(e, camp.id, camp.status)}>
                                    {camp.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-red-400" onClick={(e) => handleDelete(e, camp.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {visibleCampaigns.length === 0 && (
                <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-zinc-600 bg-zinc-900/50">
                    <p>No hay campañas comerciales activas.</p>
                </div>
            )}
        </div>
    );
}

export function TrueCampaignHeaderActions() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const projectId = parseInt(formData.get("projectId") as string, 10);
        const campaignType = formData.get("campaignType") as string;
        const scope = formData.get("scope") as string;
        const budget = formData.get("budget") as string;

        try {
            // Import the action dynamically or assume it's imported at the top
            const { createTrueCampaign } = await import('@/actions/campaigns');
            const res = await createTrueCampaign({ name, projectId, campaignType, scope, budget });
            if (res.success) {
                toast.success("Campaña comercial creada");
                setOpen(false);
                router.refresh();
            } else {
                toast.error(res.error || "Error al crear la campaña");
            }
        } catch (err) {
            toast.error("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-3 items-center mb-6 justify-end">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Campaña
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nueva Campaña Comercial</DialogTitle>
                        <DialogDescription>
                            Define el nombre, el proyecto y el objetivo de la campaña en el Mission Control.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre de la Campaña</label>
                            <input name="name" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Ej: Black Friday 2026" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ID del Proyecto</label>
                            <input name="projectId" type="number" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Ej: 2" />
                            <p className="text-xs text-muted-foreground">En el futuro, esto será un selector de proyectos (Multi-Project Native).</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tipo</label>
                                <select name="campaignType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                    <option value="user_acquisition">User Acquisition</option>
                                    <option value="retention">Retention</option>
                                    <option value="awareness">Awareness</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Scope</label>
                                <select name="scope" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                                    <option value="b2c">B2C</option>
                                    <option value="b2b">B2B</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Presupuesto (USDC)</label>
                            <input name="budget" type="number" step="0.01" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" placeholder="Opcional. Ej: 5000" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear Campaña'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function MarketingDashboardTabs({ 
    initialCampaigns, 
    initialAutomations 
}: { 
    initialCampaigns: TrueCampaign[], 
    initialAutomations: Automation[] 
}) {
    return (
        <Tabs defaultValue="campaigns" className="w-full">
            <TabsList className="mb-6">
                <TabsTrigger value="campaigns">Campañas (Mission Control)</TabsTrigger>
                <TabsTrigger value="automations">Automatizaciones (Drip Engine)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="campaigns">
                <TrueCampaignHeaderActions />
                <TrueCampaignList campaigns={initialCampaigns} />
            </TabsContent>
            
            <TabsContent value="automations">
                <div className="flex justify-end mb-6">
                    <MarketingHeaderActions />
                </div>
                <MarketingCampaignList initialCampaigns={initialAutomations} />
            </TabsContent>
        </Tabs>
    );
}

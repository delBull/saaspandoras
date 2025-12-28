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

interface Campaign {
    id: number;
    name: string;
    isActive: boolean | null;
    triggerType: string | null;
    createdAt: Date | null;
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

export function MarketingCampaignList({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
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

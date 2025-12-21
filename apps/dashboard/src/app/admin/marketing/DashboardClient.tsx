"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Plus, Edit, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { MarketingHelpModal } from "@/components/admin/marketing/MarketingHelpModal";

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

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {initialCampaigns.map((camp) => (
                <Card key={camp.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/marketing/${camp.id}`)}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-lg font-medium">
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
                            <span>ID: {camp.id}</span>
                            <Button variant="ghost" size="sm" className="h-6">
                                <Edit className="h-3 w-3 mr-1" /> Editar
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {initialCampaigns.length === 0 && (
                <div className="col-span-full text-center py-12 border rounded-lg border-dashed text-muted-foreground">
                    No hay campañas activas. Haz clic en "Sincronizar Flujos Activos" para importar.
                </div>
            )}
        </div>
    );
}

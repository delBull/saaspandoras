"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Play, Settings2, User, ChevronDown, ChevronUp } from "lucide-react";
import { MarketingCampaignList } from "@/app/admin/marketing/DashboardClient";
import { Info } from "lucide-react";
import { MarketingStats } from "./MarketingStats";
import { toast } from "@saasfly/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getMarketingDashboardStats } from "@/actions/marketing";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

// Types matching API response roughly
interface Execution {
    id: string;
    campaignName: string;
    targetName: string; // User or Lead name
    userId?: string | null;
    leadId?: string | null;
    status: 'active' | 'paused' | 'completed' | 'failed' | 'intercepted';
    currentStep: number;
    nextRunAt: string | null;
    lastRunAt: string | null;
}

export function MarketingDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, paused: 0, completed: 0 });
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [isRunningCron, setIsRunningCron] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showCampaigns, setShowCampaigns] = useState(false); // Default collapsed
    const router = useRouter();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await getMarketingDashboardStats();

            if (res.success) {
                setStats(res.stats);
                setExecutions(res.executions as any);
                setCampaigns(res.campaigns || []);
            } else {
                toast({ title: "Error", description: "No se pudieron cargar las métricas.", variant: "destructive" });
            }

        } catch (error) {
            console.error("Failed to fetch marketing data", error);
            toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/admin/migrations/migrate-campaigns');
            const data = await res.json();
            if (data.success) {
                toast({ title: "Sincronizado", description: "Campañas sincronizadas correctamente." });
                fetchData();
            } else {
                toast({ title: "Error", description: "Error al sincronizar.", variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
        } finally {
            setSyncing(false);
        }
    };

    const handleUserClick = (exec: Execution) => {
        if (exec.userId) {
            router.push(`/admin/users/${exec.userId}`);
        } else {
            toast({ title: "Lead de WhatsApp", description: "Este usuario no tiene perfil completo aún." });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header moved to AdminTabs per user request */}

            <MarketingStats {...stats} />

            {/* Campaign List Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center bg-zinc-900 p-4 rounded-xl border border-zinc-800 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setShowCampaigns(!showCampaigns)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowCampaigns(!showCampaigns); }}>
                    <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-full bg-zinc-800 text-zinc-400 transition-transform ${showCampaigns ? 'rotate-180' : ''}`}>
                            <ChevronDown className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold text-white text-lg select-none">Campañas Activas</h3>
                        <Badge variant="outline" className="ml-2 bg-zinc-800 text-zinc-500 border-zinc-700">{campaigns.length}</Badge>
                        {/* Info Modal Trigger */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 cursor-pointer hover:bg-zinc-700 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    type="button"
                                >
                                    <Info className="h-4 w-4 text-zinc-500 hover:text-purple-400" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-900 border-zinc-800">
                                <DialogHeader>
                                    <DialogTitle>Sincronización de Flujos</DialogTitle>
                                    <DialogDescription>
                                        El motor de marketing sincroniza automáticamente las campañas editadas en el código (hardcoded json) con la base de datos.
                                        <br /><br />
                                        Si has hecho cambios manuales o desplegado nuevas versiones de flujos, usa el botón "Sincronizar Flujos" para asegurar que el Dashboard refleje la última verdad.
                                    </DialogDescription>
                                </DialogHeader>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Sync Button */}
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleSync(); }} disabled={syncing} className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
                            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Sincronizando...' : 'Sincronizar'}
                        </Button>
                    </div>
                </div>

                {/* Collapsible Content */}
                {showCampaigns && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                        <MarketingCampaignList initialCampaigns={campaigns} />
                    </div>
                )}
            </div>


            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mt-8">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Ejecuciones Recientes (Logs)</h3>
                    <Button variant="ghost" size="sm" className="text-xs text-zinc-500 hover:text-white">
                        Ver todas
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3">Lead / Usuario</th>
                                <th className="px-4 py-3">Campaña</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">Progreso</th>
                                <th className="px-4 py-3">Siguiente Ejecución</th>
                                <th className="px-4 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {executions.map((exec) => (
                                <tr key={exec.id} className="hover:bg-zinc-800/30 transition-colors">
                                    <td className="px-4 py-3 font-medium text-white">{exec.targetName}</td>
                                    <td className="px-4 py-3 text-purple-400 text-xs">{exec.campaignName || 'Sin Nombre'}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant="outline"
                                            className={`${exec.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                exec.status === 'completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    exec.status === 'paused' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                        'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                                } border`}>
                                            {exec.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400">Paso {exec.currentStep + 1}</td>
                                    <td className="px-4 py-3 text-zinc-400 text-xs">
                                        {exec.nextRunAt ? formatDistanceToNow(new Date(exec.nextRunAt), { addSuffix: true, locale: es }) : '-'}
                                    </td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700" onClick={() => handleUserClick(exec)}>
                                                        <User className="w-4 h-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Ver Perfil</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700">
                                            <Settings2 className="w-4 h-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {executions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                                        No hay ejecuciones activas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

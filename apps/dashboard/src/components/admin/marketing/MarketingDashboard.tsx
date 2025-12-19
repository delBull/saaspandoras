"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Play, Settings2 } from "lucide-react";
import { MarketingStats } from "./MarketingStats";
import { toast } from "@saasfly/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// Types matching API response roughly
interface Execution {
    id: string;
    campaignName: string;
    targetName: string; // User or Lead name
    status: 'active' | 'paused' | 'completed' | 'failed';
    currentStep: number;
    nextRunAt: string | null;
    lastRunAt: string | null;
}

export function MarketingDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, active: 0, paused: 0, completed: 0 });
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [isRunningCron, setIsRunningCron] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Stats & Executions (Mock for now or real API if exists)
            // In a real scenario, we'd have a GET /api/admin/marketing/stats
            // implementing a simple mock fetch here to verify UI first

            // Simulating API call
            await new Promise(r => setTimeout(r, 800));

            // TODO: Replace with real API fetch
            // const res = await fetch('/api/admin/marketing/stats');
            // const data = await res.json();

            // Mock Data
            setStats({ total: 12, active: 5, paused: 2, completed: 5 });
            setExecutions([
                { id: '1', campaignName: 'ApplyProtocol Hot Leads', targetName: 'Nova Protocol', status: 'active', currentStep: 1, nextRunAt: new Date(Date.now() + 3600000).toISOString(), lastRunAt: new Date().toISOString() },
                { id: '2', campaignName: 'ApplyProtocol Hot Leads', targetName: 'DeFi Matrix', status: 'completed', currentStep: 3, nextRunAt: null, lastRunAt: new Date(Date.now() - 86400000).toISOString() },
                { id: '3', campaignName: 'Onboarding General', targetName: 'CryptoUser 99', status: 'paused', currentStep: 0, nextRunAt: null, lastRunAt: null },
            ]);

        } catch (error) {
            console.error("Failed to fetch marketing data", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRunCron = async () => {
        setIsRunningCron(true);
        try {
            const res = await fetch('/api/cron/marketing-engine', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev_secret'}` } // Note: Client side env var usage is risky, better to use a server action proxy
            });
            if (res.ok) {
                toast({ title: "Cron Ejecutado", description: "El motor de marketing ha procesado las tareas pendientes." });
                fetchData();
            } else {
                throw new Error("Cron failed");
            }
        } catch (e) {
            toast({ title: "Error", description: "Falló la ejecución manual del Cron.", variant: "destructive" });
        } finally {
            setIsRunningCron(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Resumen de Campañas</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-zinc-700 text-zinc-400 hover:text-white">
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button size="sm" onClick={handleRunCron} disabled={isRunningCron} className="bg-purple-600 hover:bg-purple-700 text-white">
                        {isRunningCron ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        Ejecutar Motor Ahora
                    </Button>
                </div>
            </div>

            <MarketingStats {...stats} />

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Ejecuciones Recientes</h3>
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
                                    <td className="px-4 py-3 text-purple-400">{exec.campaignName}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={exec.status === 'active' ? 'default' : exec.status === 'completed' ? 'secondary' : 'destructive'}
                                            className={`${exec.status === 'active' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' :
                                                exec.status === 'completed' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' :
                                                    'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20'
                                                } border-0`}>
                                            {exec.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-zinc-400">Paso {exec.currentStep}</td>
                                    <td className="px-4 py-3 text-zinc-400">
                                        {exec.nextRunAt ? formatDistanceToNow(new Date(exec.nextRunAt), { addSuffix: true, locale: es }) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <Settings2 className="w-4 h-4 text-zinc-500" />
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

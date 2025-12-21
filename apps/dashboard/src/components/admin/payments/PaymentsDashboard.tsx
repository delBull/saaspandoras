"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Link as LinkIcon, Users, ArrowUpRight, Copy, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { getPaymentsDashboardStats } from "@/actions/payments";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CreatePaymentLinkModal } from "./CreatePaymentLinkModal";

export function PaymentsDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, activeLinks: 0, totalLinks: 0, pendingPayment: 0, activeClients: 0 });
    const [links, setLinks] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await getPaymentsDashboardStats();
            if (res.success && res.stats) {
                setStats(res.stats as any);
                setLinks(res.links || []);
            }
        } catch (e) {
            toast.error("Error cargando finanzas");
        } finally {
            setLoading(false);
        }
    };

    const copyLink = (id: string) => {
        const url = `${window.location.origin}/pay/${id}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copiado");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Ingresos Totales</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-zinc-500">+0% desde el último mes</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Links Activos</CardTitle>
                        <LinkIcon className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.activeLinks}</div>
                        <p className="text-xs text-zinc-500">{stats.totalLinks} generados en total</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Pendiente de Pago</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">${stats.pendingPayment.toLocaleString()}</div>
                        <p className="text-xs text-zinc-500">En proceso de cobro</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Clientes Activos</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{stats.activeClients}</div>
                        <p className="text-xs text-zinc-500">Total Unique Payers</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Links Table */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-white">Links de Pago Recientes</CardTitle>
                        <p className="text-sm text-zinc-500">Historial de enlaces generados y su estado.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadData}>
                        <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-zinc-400 uppercase text-xs bg-zinc-950/50">
                                <tr>
                                    <th className="px-4 py-3">Concepto</th>
                                    <th className="px-4 py-3">Monto</th>
                                    <th className="px-4 py-3">Estado</th>
                                    <th className="px-4 py-3">Creado</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {links.map((link) => (
                                    <tr key={link.id} className="hover:bg-zinc-800/20">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">{link.title}</div>
                                            <div className="text-xs text-zinc-500">{link.id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-lime-400 font-mono">
                                            {Number(link.amount).toLocaleString()} {link.currency}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={link.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                                                {link.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400">
                                            {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true, locale: es })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button variant="ghost" size="icon" onClick={() => copyLink(link.id)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {links.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                            No hay links generados aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

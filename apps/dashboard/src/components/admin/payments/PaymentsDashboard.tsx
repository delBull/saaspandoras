"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Link as LinkIcon, Users, ArrowUpRight, Copy, CreditCard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getPaymentsDashboardStats, deletePaymentLink, updateTransactionStatus } from "@/actions/payments";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CreatePaymentLinkModal } from "./CreatePaymentLinkModal";

export function PaymentsDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, activeLinks: 0, totalLinks: 0, pendingPayment: 0, activeClients: 0 });
    const [links, setLinks] = useState<any[]>([]);
    const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);

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
                setPendingTransactions(res.pendingTransactions || []);
            }
        } catch (e) {
            toast.error("Error cargando finanzas");
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionAction = async (id: string, status: 'completed' | 'rejected') => {
        toast.loading("Procesando...", { id: "tx-action" });
        const res = await updateTransactionStatus(id, status);
        toast.dismiss("tx-action");

        if (res.success) {
            toast.success(status === 'completed' ? "Pago aprobado" : "Pago rechazado");
            loadData();
        } else {
            toast.error("Error al actualizar");
        }
    };

    const copyLink = (id: string) => {
        const url = `${window.location.origin}/pay/${id}`;
        navigator.clipboard.writeText(url);
        toast.success("Link copiado");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este link?")) return;
        const res = await deletePaymentLink(id);
        if (res.success) {
            toast.success("Link eliminado");
            loadData();
        } else {
            toast.error("Error al eliminar");
        }
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

            {/* Pending Transactions Section */}
            {links.length > 0 && typeof pendingTransactions !== 'undefined' && pendingTransactions.length > 0 && (
                <Card className="bg-yellow-950/20 border-yellow-500/20 animate-in slide-in-from-top-4">
                    <CardHeader>
                        <CardTitle className="text-yellow-500 flex items-center gap-2">
                            ⚠️ Aprobaciones Pendientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {pendingTransactions.map((tx: any) => (
                                <div key={tx.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-yellow-500/10 gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-white">{Number(tx.amount).toLocaleString()} {tx.currency}</span>
                                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 uppercase text-[10px]">Wire</Badge>
                                        </div>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            Concepto: <span className="text-zinc-300">{tx.linkTitle}</span> • Client ID: {tx.clientId}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 mt-0.5">
                                            Reportado: {new Date(tx.processedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            className="bg-green-500 hover:bg-green-600 text-black h-8 font-medium"
                                            onClick={() => handleTransactionAction(tx.id, 'completed')}
                                        >
                                            Aprobar Pago
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            className="h-8 bg-red-950/50 hover:bg-red-900 border border-red-900"
                                            onClick={() => handleTransactionAction(tx.id, 'rejected')}
                                        >
                                            Rechazar
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

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
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400 hover:bg-red-950/20" onClick={() => handleDelete(link.id)}>
                                                <Trash2 className="h-4 w-4" />
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

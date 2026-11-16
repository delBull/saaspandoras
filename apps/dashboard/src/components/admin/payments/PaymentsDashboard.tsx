"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Link as LinkIcon, Users, ArrowUpRight, Copy, CreditCard, Trash2, Wallet, ShieldCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { getPaymentsDashboardStats, deletePaymentLink, updateTransactionStatus, checkPayingWalletAction } from "@/actions/payments";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CreatePaymentLinkModal } from "./CreatePaymentLinkModal";

export function PaymentsDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, activeLinks: 0, totalLinks: 0, pendingPayment: 0, activeClients: 0 });
    const [links, setLinks] = useState<any[]>([]);
    const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [payingWallet, setPayingWallet] = useState<{
        configured: boolean;
        addressMasked: string | null;
        network: string;
        usdcBalance: number;
        ethBalance: number;
        status: "healthy" | "low" | "critical" | "not_configured";
        message: string;
    } | null>(null);
    const [checkingWallet, setCheckingWallet] = useState(false);

    const LINKS_PER_PAGE = 10;
    const totalPages = Math.max(1, Math.ceil(links.length / LINKS_PER_PAGE));
    const paginatedLinks = links.slice((currentPage - 1) * LINKS_PER_PAGE, currentPage * LINKS_PER_PAGE);

    useEffect(() => {
        loadData();
        loadPayingWallet();
    }, []);

    const loadPayingWallet = async () => {
        setCheckingWallet(true);
        try {
            const res = await checkPayingWalletAction();
            if (res.success && res.status) {
                setPayingWallet(res.status);
            }
        } catch {
            // Non-fatal
        } finally {
            setCheckingWallet(false);
        }
    };

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
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
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

            {/* x402 AI Machine Payments Gateway Section */}
            <Card className="bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-blue-950/30 border-blue-500/20 shadow-lg">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-lg text-white flex items-center gap-2">
                                <span className="p-1 rounded bg-blue-500/20 text-blue-400">⚡</span>
                                Agentes IA & x402 Protocol
                            </CardTitle>
                            <Badge variant="outline" className="border-blue-500/40 text-blue-400 text-[10px] font-mono">
                                Coinbase x Cloudflare Spec
                            </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">
                            Monetización de APIs de máquina-a-máquina vía HTTP 402 en Base L2 (USDC).
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-zinc-500">Discovery:</span>
                        <a href="/.well-known/x402.json" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 font-mono text-[11px] bg-blue-950/40 px-2 py-1 rounded border border-blue-900/40">
                            .well-known/x402.json <ArrowUpRight className="h-3 w-3" />
                        </a>
                        <a href="/llms.txt" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px] bg-emerald-950/40 px-2 py-1 rounded border border-emerald-900/40">
                            llms.txt <ArrowUpRight className="h-3 w-3" />
                        </a>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-400">Agora NAV Feed</span>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">$0.01 USDC</Badge>
                            </div>
                            <p className="font-mono text-[11px] text-zinc-300 mt-1 truncate">/api/v1/external/agora/nav/:id</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Histórico NAV, tesorería y buyback pool</p>
                        </div>

                        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-400">Protocol Details</span>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">$0.005 USDC</Badge>
                            </div>
                            <p className="font-mono text-[11px] text-zinc-300 mt-1 truncate">/api/v1/external/protocols/:slug</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Metadata RWA, fondeo y precios</p>
                        </div>

                        <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-400">Governance DAO</span>
                                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">$0.002 USDC</Badge>
                            </div>
                            <p className="font-mono text-[11px] text-zinc-300 mt-1 truncate">/api/v1/external/governance/proposals</p>
                            <p className="text-[10px] text-zinc-500 mt-1">Propuestas y quórum en cadena</p>
                        </div>
                    </div>

                    {/* Paying Wallet Operational Status */}
                    <div className="mt-4 pt-4 border-t border-zinc-800/80">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/80 p-3.5 rounded-lg border border-zinc-800">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-md bg-blue-500/10 text-blue-400 mt-0.5">
                                    <Wallet className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-white">Wallet Pagadora de Hermes (Búsquedas & Oráculos)</span>
                                        {payingWallet?.status === 'healthy' && (
                                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">🟢 Saldo Óptimo</Badge>
                                        )}
                                        {payingWallet?.status === 'low' && (
                                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">🟡 Saldo Bajo</Badge>
                                        )}
                                        {payingWallet?.status === 'critical' && (
                                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] animate-pulse">🔴 Crítico — Recargar</Badge>
                                        )}
                                        {payingWallet?.status === 'not_configured' && (
                                            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">Configurar en Vercel Secrets</Badge>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-zinc-400 mt-0.5">
                                        {payingWallet?.configured ? (
                                            <>Dirección: <span className="font-mono text-zinc-300">{payingWallet.addressMasked}</span> • Saldo: <span className="font-bold text-white">${payingWallet.usdcBalance.toFixed(2)} USDC</span> • Gas: <span className="font-mono text-zinc-300">{payingWallet.ethBalance.toFixed(5)} ETH</span> en Base</>
                                        ) : (
                                            "Define HERMES_AGENT_SIGNER_KEY en Vercel Secrets para habilitar compras de datos con x402."
                                        )}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3 text-emerald-500 inline" />
                                        <span>Clave privada 100% aislada. Si el saldo cae por debajo de $0.10 USDC, se alerta automáticamente a Discord (pandoras-alerts) y al email admin.</span>
                                    </p>
                                </div>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-zinc-700 text-zinc-300 hover:text-white"
                                onClick={loadPayingWallet}
                                disabled={checkingWallet}
                            >
                                <RefreshCw className={`h-3 w-3 mr-1 ${checkingWallet ? 'animate-spin' : ''}`} />
                                Verificar en Base
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                                {paginatedLinks.map((link) => (
                                    <tr key={link.id} className="hover:bg-zinc-800/20 font-mono">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white">{link.title}</div>
                                            <div className="text-xs text-zinc-500">{link.id}</div>
                                        </td>
                                        <td className="px-4 py-3 text-lime-400 font-mono font-bold">
                                            {Number(link.amount).toLocaleString()} {link.currency}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={link.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}>
                                                {link.isActive ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400 text-xs">
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
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500 font-mono text-xs">
                                            No hay links generados aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {links.length > 10 && (
                      <div className="flex justify-between items-center pt-4 mt-4 border-t border-zinc-800 font-mono text-xs text-zinc-400">
                        <span>Página {currentPage} de {totalPages}</span>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="h-8 bg-zinc-950 border-zinc-800"
                          >
                            Anterior
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="h-8 bg-zinc-950 border-zinc-800"
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

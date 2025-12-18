'use client';

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, TrendingUp, Users, MousePointer2 } from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend
} from 'recharts';

interface ShortlinkAnalyticsModalProps {
    isOpen: boolean;
    onClose: () => void;
    slug: string | null;
}

export function ShortlinkAnalyticsModal({ isOpen, onClose, slug }: ShortlinkAnalyticsModalProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        if (isOpen && slug) {
            fetchAnalytics();
        }
    }, [isOpen, slug]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/shortlinks/analytics?slug=${slug}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!slug) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl bg-zinc-950 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        📊 Analytics: <code className="bg-zinc-800 px-2 py-1 rounded text-blue-400 font-mono text-base">/{slug}</code>
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Rendimiento detallado y métricas de tráfico.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : data ? (
                    <div className="space-y-6 py-4">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-2 mb-2 text-zinc-400">
                                    <MousePointer2 className="w-4 h-4" /> Total Clicks
                                </div>
                                <p className="text-3xl font-bold text-white">{data.stats.totalClicks}</p>
                            </div>
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-2 mb-2 text-zinc-400">
                                    <Users className="w-4 h-4" /> Visitas Únicas
                                </div>
                                <p className="text-3xl font-bold text-green-400">{data.stats.uniqueVisitors}</p>
                            </div>
                        </div>

                        {/* Main Chart */}
                        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 h-64">
                            <h4 className="text-sm font-medium text-zinc-400 mb-4">Actividad (Últimos 30 días)</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.charts.daily}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="date" stroke="#666" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                                    <YAxis stroke="#666" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                        labelStyle={{ color: '#a1a1aa' }}
                                    />
                                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} name="Clicks" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Secondary Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 h-64">
                                <h4 className="text-sm font-medium text-zinc-400 mb-4">Top Referrers</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.charts.referrers} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                        <XAxis type="number" stroke="#666" fontSize={12} />
                                        <YAxis dataKey="referer" type="category" stroke="#666" fontSize={10} width={100} />
                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} name="Clicks" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 h-64">
                                <h4 className="text-sm font-medium text-zinc-400 mb-4">Top Navegadores</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.charts.browsers} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                        <XAxis type="number" stroke="#666" fontSize={12} />
                                        <YAxis dataKey="browser" type="category" stroke="#666" fontSize={10} width={100} />
                                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                        <Bar dataKey="count" fill="#f97316" radius={[0, 4, 4, 0]} name="Visitas" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Recent Events List */}
                        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 overflow-hidden">
                            <div className="p-3 border-b border-zinc-800">
                                <h4 className="text-sm font-medium text-zinc-400">Últimos Eventos</h4>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-zinc-900/50 text-zinc-500 sticky top-0">
                                        <tr>
                                            <th className="p-3">Fecha</th>
                                            <th className="p-3">IP</th>
                                            <th className="p-3">Referer</th>
                                            <th className="p-3">Dispositivo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {data.events.map((event: any) => (
                                            <tr key={event.id} className="text-zinc-300 hover:bg-zinc-800/30">
                                                <td className="p-3 whitespace-nowrap text-zinc-500">
                                                    {new Date(event.createdAt).toLocaleString()}
                                                </td>
                                                <td className="p-3 font-mono text-zinc-600">{event.ip || 'Anónimo'}</td>
                                                <td className="p-3 max-w-[150px] truncate" title={event.referer}>{event.referer || '-'}</td>
                                                <td className="p-3">{event.browser} / {event.deviceType}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 text-zinc-500">
                        No hay datos disponibles para este enlace.
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

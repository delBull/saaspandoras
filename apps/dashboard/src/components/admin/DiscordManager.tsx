"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertTriangle, Send, RefreshCw, Hash, Activity } from "lucide-react";
import { getDiscordWebhookStatus } from "@/actions/discord";
import { getMarketingDashboardStats } from "@/actions/marketing";
import { toast } from "sonner";

interface WebhookStatus {
    name: string;
    type: 'leads' | 'applications' | 'alerts';
    configured: boolean;
    status: 'active' | 'error' | 'testing' | 'missing';
    lastPing?: string;
}

export function DiscordManager() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedChannel, setSelectedChannel] = useState<'leads' | 'applications' | 'alerts'>('alerts');

    const [metrics, setMetrics] = useState({
        totalActions: 0,
        successRate: 0,
        activeChannels: 0,
        failedActions: 0
    });

    const [webhooks, setWebhooks] = useState<WebhookStatus[]>([
        { name: '📢 Applications (Forms)', type: 'applications', configured: false, status: 'testing' },
        { name: '🚨 System Alerts', type: 'alerts', configured: false, status: 'testing' },
        { name: '📱 WhatsApp Leads', type: 'leads', configured: false, status: 'testing' }
    ]);

    useEffect(() => {
        fetchStatus();
    }, []);

    async function fetchStatus() {
        setLoading(true);
        try {
            // Parallel Fetch
            const [discordRes, marketingRes] = await Promise.all([
                getDiscordWebhookStatus(),
                getMarketingDashboardStats()
            ]);

            // Update Webhooks
            setWebhooks([
                { name: '📢 Applications (Forms)', type: 'applications', configured: discordRes.applications.configured, status: discordRes.applications.status as any },
                { name: '🚨 System Alerts', type: 'alerts', configured: discordRes.alerts.configured, status: discordRes.alerts.status as any },
                { name: '📱 WhatsApp Leads', type: 'leads', configured: discordRes.leads.configured, status: discordRes.leads.status as any }
            ]);

            // Calculate Metrics from Marketing Executions (Proxy for Activity)
            const total = marketingRes.stats.total;
            const completed = marketingRes.stats.completed;
            const failed = total - (marketingRes.stats.active + marketingRes.stats.paused + completed); // Rough estimate
            const successRate = total > 0 ? ((completed / total) * 100).toFixed(1) : "100";

            const activeCh = [discordRes.alerts.configured, discordRes.applications.configured, discordRes.leads.configured].filter(Boolean).length;

            setMetrics({
                totalActions: total,
                successRate: Number(successRate),
                activeChannels: activeCh,
                failedActions: failed
            });

        } catch (e) {
            console.error(e);
            toast.error("Error cargando estado de Discord");
        } finally {
            setLoading(false);
        }
    }

    const handleTestWebhook = async (type: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/discord/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            if (response.ok) {
                toast.success('Webhook probado con éxito');
            } else {
                toast.error('Prueba fallida. Revisa los logs.');
            }
        } catch (e) {
            toast.error('Error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        setLoading(true);
        try {
            const response = await fetch('/api/admin/discord/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    channel: selectedChannel,
                    content: message
                })
            });

            if (response.ok) {
                setMessage("");
                toast.success('Mensaje enviado');
            } else {
                toast.error('Error al enviar mensaje');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de red');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Analytics Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-zinc-400" />
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Automations</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{metrics.totalActions}</p>
                    <p className="text-xs text-zinc-500 mt-1">Triggered actions</p>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Success Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{metrics.successRate}%</p>
                    <p className="text-xs text-zinc-500 mt-1">System healthy</p>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Active Channels</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{metrics.activeChannels}</p>
                    <p className="text-xs text-zinc-500 mt-1">Fully Connected</p>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-zinc-400 uppercase tracking-wider">Fails</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{metrics.failedActions}</p>
                    <p className="text-xs text-zinc-500 mt-1">Needs attention</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {webhooks.map((hook) => (
                    <div key={hook.type} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 flex flex-col justify-between">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${hook.type === 'alerts' ? 'bg-red-500/20 text-red-400' :
                                        hook.type === 'applications' ? 'bg-green-500/20 text-green-400' :
                                            'bg-blue-500/20 text-blue-400'
                                    }`}>
                                    <Hash className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-zinc-200">{hook.name}</h3>
                                    <p className="text-xs text-zinc-400 uppercase tracking-wider">{hook.type}</p>
                                </div>
                            </div>
                            {hook.status === 'active' ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : hook.status === 'missing' ? (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between text-xs text-zinc-500">
                                <span>Status:</span>
                                <span className={hook.configured ? 'text-green-400' : 'text-red-400'}>
                                    {hook.configured ? 'Configured' : 'Missing Env Var'}
                                </span>
                            </div>
                            <button
                                onClick={() => handleTestWebhook(hook.type)}
                                disabled={loading || !hook.configured}
                                className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-200 text-sm rounded transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                Test Connection
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Quick Announcement
                </h3>

                <div className="space-y-4">
                    <div>
                        <label htmlFor="target-channel" className="block text-sm font-medium text-zinc-400 mb-2">Target Channel</label>
                        <div id="target-channel" className="flex gap-2">
                            {(['alerts', 'applications', 'leads'] as const).map((ch) => (
                                <button
                                    key={ch}
                                    onClick={() => setSelectedChannel(ch)}
                                    className={`px-4 py-2 rounded-lg text-sm transition-all ${selectedChannel === ch
                                        ? 'bg-lime-500 text-black font-medium'
                                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                                        }`}
                                >
                                    {ch.charAt(0).toUpperCase() + ch.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="message-content" className="block text-sm font-medium text-zinc-400 mb-2">Message</label>
                        <textarea
                            id="message-content"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Write an official announcement..."
                            className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-lime-500 transition-colors"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSendMessage}
                            disabled={loading || !message.trim()}
                            className="px-6 py-2 bg-lime-500 hover:bg-lime-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Send Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { CheckCircle, AlertTriangle, Send, RefreshCw, Hash } from "lucide-react";

interface WebhookStatus {
    name: string;
    type: 'leads' | 'applications' | 'alerts';
    configured: boolean;
    status: 'active' | 'error' | 'testing';
    lastPing?: string;
}

export function DiscordManager() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [selectedChannel, setSelectedChannel] = useState<'leads' | 'applications' | 'alerts'>('alerts');

    // Simulation of status (in real app, can optimize via API check)
    const [webhooks, setWebhooks] = useState<WebhookStatus[]>([
        { name: '📢 Applications (Forms)', type: 'applications', configured: true, status: 'active' },
        { name: '🚨 System Alerts', type: 'alerts', configured: true, status: 'active' },
        { name: '📱 WhatsApp Leads', type: 'leads', configured: true, status: 'active' }
    ]);

    const handleTestWebhook = async (type: string) => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/discord/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });

            if (response.ok) {
                alert('✅ Webhook tested successfully!');
            } else {
                alert('❌ Test failed. Check logs.');
            }
        } catch (e) {
            alert('❌ Error connecting to server.');
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
                alert('✅ Message sent!');
            } else {
                alert('❌ Failed to send message.');
            }
        } catch (e) {
            console.error(e);
            alert('❌ Error sending message.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
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
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                            )}
                        </div>

                        <button
                            onClick={() => handleTestWebhook(hook.type)}
                            disabled={loading}
                            className="w-full py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm rounded transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                            Test Connection
                        </button>
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

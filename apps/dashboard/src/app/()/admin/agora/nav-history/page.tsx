"use client";

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function NavHistoryAdminPage() {
    const [protocolId, setProtocolId] = useState('1'); // Default test protocol
    const [timeframe, setTimeframe] = useState('30d');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [protocolId, timeframe]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/v1/admin/agora/analytics/nav-history?protocolId=${protocolId}&timeframe=${timeframe}`);
            const json = await response.json();
            if (json.success && json.data) {
                // Reverse array so chronological order goes Left to Right on chart
                setData(json.data.reverse().map((item: any) => ({
                    ...item,
                    formattedDate: new Date(item.createdAt).toLocaleDateString(),
                    nav: parseFloat(item.nav),
                    minPrice: parseFloat(item.minPrice),
                    maxPrice: parseFloat(item.maxPrice),
                    supply: item.supply,
                    treasury: parseFloat(item.treasury),
                })));
            }
        } catch (error) {
            console.error('Failed to load NAV history', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Institutional NAV History</h1>
                    <p className="text-sm text-gray-400">FASE 4A: Real-time mathematical trailing of the protocol asset valuations.</p>
                </div>

                <div className="flex gap-4">
                    <select
                        className="bg-black/40 border border-white/10 text-white rounded-md px-4 py-2"
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="all">All Time</option>
                    </select>
                    <input
                        type="number"
                        value={protocolId}
                        onChange={(e) => setProtocolId(e.target.value)}
                        className="bg-black/40 border border-white/10 text-white rounded-md px-4 py-2 w-32"
                        placeholder="Protocol ID"
                    />
                </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-6 h-[500px]">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">Loading metrics...</div>
                ) : data.length === 0 ? (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">No NAV snapshots found for this protocol.</div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="formattedDate" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="top" height={36} />

                            {/* Dynamic Restrictive Bands */}
                            <Line type="monotone" dataKey="maxPrice" stroke="#10b981" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Max Limit (+20%)" />
                            <Line type="monotone" dataKey="nav" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }} activeDot={{ r: 8 }} name="Base NAV" />
                            <Line type="monotone" dataKey="minPrice" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} dot={false} name="Min Limit (-30%)" />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/40 border border-white/10 p-6 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-400">Current Base NAV</h3>
                    <p className="text-3xl font-bold text-white mt-2">
                        ${data.length > 0 ? data[data.length - 1].nav.toFixed(4) : '0.000'}
                    </p>
                </div>
                <div className="bg-black/40 border border-white/10 p-6 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-400">Active Supply</h3>
                    <p className="text-3xl font-bold text-white mt-2">
                        {data.length > 0 ? data[data.length - 1].supply.toLocaleString() : '0'} Artifacts
                    </p>
                </div>
                <div className="bg-black/40 border border-white/10 p-6 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-400">Protocol Treasury</h3>
                    <p className="text-3xl font-bold text-white mt-2">
                        ${data.length > 0 ? data[data.length - 1].treasury.toLocaleString() : '0.00'}
                    </p>
                </div>
            </div>
        </div>
    );
}

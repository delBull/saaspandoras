"use client";

import { useEffect, useState } from 'react';

export default function AuditAdminPage() {
    const [protocolId, setProtocolId] = useState('1'); // Default test protocol
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    useEffect(() => {
        fetchAuditLogs();
    }, [protocolId]);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/v1/admin/agora/analytics/audit?protocolId=${protocolId}&limit=50`);
            const json = await response.json();
            if (json.success && json.data) {
                setLogs(json.data);
            }
        } catch (error) {
            console.error('Failed to load audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white">Settlement Integrity Monitor</h1>
                    <p className="text-sm text-gray-400">FASE 4B: Audit table for atomic settlements and early exits over the Protocol.</p>
                </div>

                <div className="flex gap-4">
                    <input
                        type="number"
                        value={protocolId}
                        onChange={(e) => setProtocolId(e.target.value)}
                        className="bg-black/40 border border-white/10 text-white rounded-md px-4 py-2 w-32"
                        placeholder="Protocol ID"
                    />
                </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-400">Scanning transaction ledgers...</div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">No settlement actions found for this protocol.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-400 uppercase bg-black/60 border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">Action Type</th>
                                    <th className="px-6 py-4">Correlation Hash</th>
                                    <th className="px-6 py-4">Artifact ID</th>
                                    <th className="px-6 py-4">Actor</th>
                                    <th className="px-6 py-4 text-right">Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <div key={log.id} className="contents">
                                        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${log.actionType === 'EARLY_EXIT_EXECUTED'
                                                        ? 'bg-rose-500/20 text-rose-400'
                                                        : 'bg-emerald-500/20 text-emerald-400'
                                                    }`}>
                                                    {log.actionType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-500 truncate max-w-[150px]">
                                                {log.correlationId}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-blue-400">
                                                {log.artifactId}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-300">
                                                {log.userId || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                                                    className="text-purple-400 hover:text-purple-300 text-xs font-semibold"
                                                >
                                                    {expandedRow === log.id ? 'Collapse' : 'Inspect JSON'}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === log.id && (
                                            <tr>
                                                <td colSpan={6} className="bg-black/80 p-6 border-b border-white/10">
                                                    <div className="relative">
                                                        <h4 className="absolute top-0 right-0 text-xs text-gray-500 uppercase tracking-wider font-bold">Metadata Payload</h4>
                                                        <pre className="text-xs text-green-400/90 font-mono overflow-x-auto whitespace-pre-wrap">
                                                            {JSON.stringify(log.metadata, null, 2)}
                                                        </pre>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </div>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

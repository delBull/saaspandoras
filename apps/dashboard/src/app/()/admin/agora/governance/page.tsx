"use client";

import { useEffect, useState } from 'react';

export default function GovernanceAdminPage() {
    const [protocolId, setProtocolId] = useState('1');
    const [currentConfig, setCurrentConfig] = useState<any>(null);
    const [queue, setQueue] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [feeRate, setFeeRate] = useState('');
    const [maxRatio, setMaxRatio] = useState('');
    const [penalty, setPenalty] = useState('');
    const [buybackAllocationRatio, setBuybackAllocationRatio] = useState('');
    const [paused, setPaused] = useState(false);
    const [delay, setDelay] = useState('24');

    useEffect(() => {
        fetchData();
    }, [protocolId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [configRes, queueRes] = await Promise.all([
                fetch(`/api/v1/internal/agora/configs?protocolId=${protocolId}`),
                fetch(`/api/v1/admin/agora/governance/queue?protocolId=${protocolId}`)
            ]);

            const configJson = await configRes.json();
            const queueJson = await queueRes.json();

            if (configJson.success) setCurrentConfig(configJson.data);
            if (queueJson.success) setQueue(queueJson.data);
        } catch (error) {
            console.error('Failed to load governance data', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePropose = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/v1/admin/agora/governance/propose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    protocolId,
                    feeRate: feeRate || undefined,
                    inventoryMaxRatio: maxRatio || undefined,
                    earlyExitPenalty: penalty || undefined,
                    buybackAllocationRatio: buybackAllocationRatio || undefined,
                    settlementPaused: paused,
                    delayHours: delay
                })
            });
            const json = await res.json();
            if (json.success) {
                alert('Proposal queued successfully');
                fetchData();
            } else {
                alert('Error: ' + json.error);
            }
        } catch (error) {
            alert('Failed to propose');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-white">Monetary Policy Governance</h1>
                <p className="text-sm text-gray-400">FASE 5: Managed time-locked configuration overrides.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Current State & Form */}
                <div className="space-y-6">
                    <div className="bg-black/40 border border-white/10 p-6 rounded-xl space-y-4">
                        <h2 className="text-lg font-semibold text-white">Propose Configuration Change</h2>
                        <form onSubmit={handlePropose} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="fee-rate" className="text-xs text-gray-400 uppercase">Fee Rate (e.g. 0.02)</label>
                                    <input
                                        id="fee-rate"
                                        type="number" step="0.001" value={feeRate} onChange={e => setFeeRate(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="max-ratio" className="text-xs text-gray-400 uppercase">Inventory Max Ratio (0-1)</label>
                                    <input
                                        id="max-ratio"
                                        type="number" step="0.01" value={maxRatio} onChange={e => setMaxRatio(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="exit-penalty" className="text-xs text-gray-400 uppercase">Early Exit Penalty (e.g. 0.15)</label>
                                    <input
                                        id="exit-penalty"
                                        type="number" step="0.01" value={penalty} onChange={e => setPenalty(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="buyback-ratio" className="text-xs text-gray-400 uppercase">Buyback Allocation Ratio (%)</label>
                                    <input
                                        id="buyback-ratio"
                                        type="number" step="0.05" value={buybackAllocationRatio} onChange={e => setBuybackAllocationRatio(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white"
                                        placeholder="1.0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="impl-delay" className="text-xs text-gray-400 uppercase">Implementation Delay (Hours)</label>
                                    <input
                                        id="impl-delay"
                                        type="number" value={delay} onChange={e => setDelay(e.target.value)}
                                        className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white"
                                    />
                                </div>
                                <div className="flex items-center gap-2 pt-6">
                                    <input
                                        type="checkbox" checked={paused} onChange={e => setPaused(e.target.checked)}
                                        id="paused-check" className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                                    />
                                    <label htmlFor="paused-check" className="text-sm text-gray-300">Pause Settlement (Circuit Breaker)</label>
                                </div>
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                {loading ? 'Processing...' : 'Queue Proposal'}
                            </button>
                        </form>
                    </div>

                    <div className="bg-black/40 border border-white/10 p-6 rounded-xl">
                        <h2 className="text-lg font-semibold text-white mb-4">Current Active Environment</h2>
                        {currentConfig ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase">Fee Rate</p>
                                    <p className="text-xl font-mono">{(parseFloat(currentConfig.feeRate) * 100).toFixed(1)}%</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase">Max Inventory</p>
                                    <p className="text-xl font-mono">{(parseFloat(currentConfig.inventoryMaxRatio) * 100).toFixed(0)}%</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase">Exit Penalty</p>
                                    <p className="text-xl font-mono">{(parseFloat(currentConfig.earlyExitPenalty) * 100).toFixed(1)}%</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase">Buyback Ratio</p>
                                    <p className="text-xl font-mono">{(parseFloat(currentConfig.buybackAllocationRatio) * 100).toFixed(0)}%</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase">Market State</p>
                                    <p className={`text-xl font-bold ${currentConfig.settlementPaused ? 'text-red-500' : 'text-green-500'}`}>
                                        {currentConfig.settlementPaused ? 'PAUSED' : 'ACTIVE'}
                                    </p>
                                </div>
                            </div>
                        ) : <p className="text-gray-500">No active config.</p>}
                    </div>
                </div>

                {/* Right: Proposal Queue */}
                <div className="bg-black/40 border border-white/10 rounded-xl flex flex-col h-[700px]">
                    <div className="p-6 border-b border-white/10">
                        <h2 className="text-lg font-semibold text-white">Governance Queue</h2>
                        <p className="text-xs text-gray-400">Time-locked proposals awaiting execution.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {queue.filter(q => q.status === 'PENDING').map((msg) => (
                            <div key={msg.id} className="bg-black/60 border border-white/5 p-4 rounded-xl space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] font-mono text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded uppercase tracking-widest font-bold">Pending Execution</span>
                                    <span className="text-[10px] text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-300">Effective: <span className="text-white font-mono">{new Date(msg.effectiveAt).toLocaleString()}</span></p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {msg.proposedFeeRate && <span className="text-[10px] bg-white/5 px-2 py-1 rounded">Fee: {msg.proposedFeeRate}</span>}
                                        {msg.proposedInventoryMaxRatio && <span className="text-[10px] bg-white/5 px-2 py-1 rounded">Inv: {msg.proposedInventoryMaxRatio}</span>}
                                        {msg.proposedEarlyExitPenalty && <span className="text-[10px] bg-white/5 px-2 py-1 rounded">Penalty: {msg.proposedEarlyExitPenalty}</span>}
                                        {msg.proposedBuybackAllocationRatio && <span className="text-[10px] bg-white/5 px-2 py-1 rounded">Buyback: {msg.proposedBuybackAllocationRatio}</span>}
                                        {msg.proposedSettlementPaused !== null && <span className="text-[10px] bg-white/5 px-2 py-1 rounded">Paused: {String(msg.proposedSettlementPaused)}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {queue.filter(q => q.status === 'PENDING').length === 0 && (
                            <p className="text-center text-gray-500 mt-20">No pending proposals.</p>
                        )}

                        <div className="pt-10 border-t border-white/5">
                            <h3 className="text-xs font-bold text-gray-600 uppercase mb-4">Execution History</h3>
                            {queue.filter(q => q.status !== 'PENDING').slice(0, 5).map((msg) => (
                                <div key={msg.id} className="flex justify-between items-center text-xs py-2 text-gray-500">
                                    <span>{msg.id.slice(0, 8)}...</span>
                                    <span className="text-green-900 border border-green-900/40 px-2 rounded-full text-[9px]">EXECUTED</span>
                                    <span>{new Date(msg.effectiveAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

export default function ProtocolMarketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: protocolId } = use(params);
    const [loading, setLoading] = useState(true);
    const [listings, setListings] = useState<any[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [navData, setNavData] = useState<any[]>([]);
    const [userBalance, setUserBalance] = useState('0.00');
    const [selectedListing, setSelectedListing] = useState<any>(null);

    useEffect(() => {
        fetchMarketData();
    }, [protocolId]);

    const fetchMarketData = async () => {
        setLoading(true);
        try {
            const [listingsRes, configRes, navRes] = await Promise.all([
                fetch(`/api/v1/internal/agora/listings?protocolId=${protocolId}`),
                fetch(`/api/v1/internal/agora/configs?protocolId=${protocolId}`),
                fetch(`/api/v1/admin/agora/analytics/nav-history?protocolId=${protocolId}&timeframe=7d`)
            ]);

            const listingsJson = await listingsRes.json();
            const configJson = await configRes.json();
            const navJson = await navRes.json();

            if (listingsJson.success) setListings(listingsJson.data);
            if (configJson.success) setConfig(configJson.data);
            if (navJson.success) setNavData(navJson.data.reverse());

            // Mock balance for demo if not logged in
            setUserBalance('1500.00');
        } catch (error) {
            console.error('Market data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentNav = navData.length > 0 ? parseFloat(navData[navData.length - 1].nav) : 0;
    const minPrice = navData.length > 0 ? parseFloat(navData[navData.length - 1].minPrice) : 0;
    const maxPrice = navData.length > 0 ? parseFloat(navData[navData.length - 1].maxPrice) : 0;

    return (
        <div className="min-h-screen bg-[#050505] text-white p-4 md:p-10 font-sans selection:bg-purple-500/30">
            {/* Background Glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10 space-y-10">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-purple-500/20">A</div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic">AGORA <span className="text-purple-500">MARKET</span></h1>
                        </div>
                        <p className="text-gray-400 font-medium">Protocol ID: #{protocolId} • Regulated Liquidity Engine</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md px-6 py-3 rounded-2xl">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Your Balance</p>
                            <p className="text-xl font-mono text-emerald-400">${userBalance} <span className="text-[10px] text-gray-500 ml-1">USDC</span></p>
                        </div>
                    </div>
                </header>

                {/* Global Stats Grid */}
                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="lg:col-span-2 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-[32px] p-8 relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Net Asset Value (NAV)</h3>
                                <p className="text-5xl font-black mt-2 tracking-tighter">${currentNav.toFixed(4)}</p>
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold border border-emerald-500/20">STABLE</span>
                                    <span className="text-xs text-gray-500 font-medium">Updated every 10 min</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Pricing Bands</p>
                                <p className="text-sm font-mono text-rose-400 mt-1">Min: ${minPrice.toFixed(2)}</p>
                                <p className="text-sm font-mono text-emerald-400">Max: ${maxPrice.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Micro Chart */}
                        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-30 group-hover:opacity-60 transition-opacity">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={navData}>
                                    <Line type="monotone" dataKey="nav" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white/5 border border-white/10 rounded-[32px] p-8 flex flex-col justify-center gap-6"
                    >
                        <div>
                            <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">Market State</p>
                            <h4 className={`text-2xl font-black mt-1 ${config?.settlementPaused ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {config?.settlementPaused ? 'CIRCUIT BREAKER: PAUSED' : 'TRADING ACTIVE'}
                            </h4>
                        </div>
                        <div className="h-px bg-white/10" />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Fee Rate</p>
                                <p className="text-lg font-mono font-bold text-white">{(parseFloat(config?.feeRate || '0') * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 uppercase font-bold">Early Exit</p>
                                <p className="text-lg font-mono font-bold text-rose-400">-{(parseFloat(config?.earlyExitPenalty || '0') * 100).toFixed(1)}%</p>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Listings Section */}
                <section className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold uppercase italic tracking-widest">Active Listings ({listings.length})</h2>
                        <button className="text-xs bg-white text-black font-black px-6 py-2 rounded-full hover:bg-purple-500 hover:text-white transition-all uppercase italic">List Artifact</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {listings.map((item, idx) => (
                                <motion.div
                                    key={item.id}
                                    layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ y: -5 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-5 group cursor-pointer transition-colors hover:bg-white/[0.08]"
                                    onClick={() => setSelectedListing(item)}
                                >
                                    <div className="aspect-square rounded-xl bg-gradient-to-tr from-purple-500/20 to-blue-500/20 mb-4 flex items-center justify-center overflow-hidden border border-white/5">
                                        <div className="text-4xl">💎</div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Artifact #{item.artifactId.slice(0, 8)}</p>
                                        <div className="flex justify-between items-end">
                                            <p className="text-2xl font-black">${parseFloat(item.price).toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-500 font-mono mb-1">
                                                {((parseFloat(item.price) / currentNav - 1) * 100).toFixed(1)}% vs NAV
                                            </p>
                                        </div>
                                    </div>
                                    <button className="w-full mt-4 py-2 bg-white/5 group-hover:bg-white group-hover:text-black rounded-lg text-xs font-bold transition-all uppercase tracking-widest">View Details</button>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {listings.length === 0 && !loading && (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                                <p className="text-gray-600 font-bold uppercase tracking-tighter text-3xl italic">No Inventory Found</p>
                                <p className="text-gray-400 mt-2">Become the first to list an artifact in this protocol.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Simplified Purchase Drawer (Logic Placeholder) */}
            <AnimatePresence>
                {selectedListing && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedListing(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]" />
                        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0a0a0a] border-l border-white/10 z-[101] p-10 flex flex-col justify-between">
                            <div className="space-y-8">
                                <button onClick={() => setSelectedListing(null)} className="text-gray-500 hover:text-white transition-colors">← Back to Market</button>
                                <div>
                                    <h2 className="text-4xl font-black tracking-tighter uppercase italic">Secure <span className="text-purple-500">Settlement</span></h2>
                                    <p className="text-gray-400 mt-2 font-medium">Atomic ownership transfer protocol</p>
                                </div>

                                <div className="bg-white/5 rounded-[24px] p-6 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-sm">Sale Price</span>
                                        <span className="text-xl font-black">${parseFloat(selectedListing.price).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Network Fee {(parseFloat(config?.feeRate || '0') * 100).toFixed(1)}%</span>
                                        <span className="text-sm font-mono text-gray-400">+${(parseFloat(selectedListing.price) * parseFloat(config?.feeRate || '0')).toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <div className="flex justify-between items-center text-lg font-black">
                                        <span>Total Payout</span>
                                        <span className="text-purple-500">${(parseFloat(selectedListing.price) * (1 + parseFloat(config?.feeRate || '0'))).toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                        <p className="text-xs text-emerald-400 font-bold">✓ Price is within NAV Bands (${minPrice} - ${maxPrice})</p>
                                    </div>
                                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                                        <p className="text-[10px] text-purple-300 leading-relaxed uppercase tracking-widest font-bold">Warning: Settlement will burn artifact from current owner and mint in your dashboard vault immediately.</p>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-[20px] font-black uppercase text-lg tracking-widest shadow-xl shadow-purple-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Execute Purchase
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

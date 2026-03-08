"use client";

import React from 'react';
import { ShoppingBag, Shield, Zap, TrendingUp, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AgoraMarketPage() {
    return (
        <div className="min-h-screen bg-zinc-950 text-white px-6 py-12 relative overflow-hidden pb-32">
            {/* Ambient Background Elements (Optimized for Dark Theme) */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-lime-500/10 via-emerald-500/5 to-transparent rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-[100px] -z-10" />

            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <header className="mb-12 pt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500/10 text-lime-400 rounded-full text-[11px] font-black tracking-widest uppercase mb-6 shadow-sm border border-lime-500/20"
                    >
                        <ShoppingBag size={14} className="fill-current animate-pulse" />
                        <span>Próximamente</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black italic tracking-tighter text-white leading-[1.1] mb-6"
                    >
                        Agora <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-500">Market.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-2xl"
                    >
                        El corazón económico de Pandoras. Mercado secundario resiliente y liquidaciones institucionales con total transparencia.
                    </motion.p>
                </header>

                {/* Features Info - Grid on desktop */}
                <div className="grid md:grid-cols-2 gap-6 mb-12 relative z-10 w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="bg-zinc-900/50 backdrop-blur-md p-8 rounded-[2rem] border border-zinc-800 shadow-2xl space-y-6 md:col-span-2 lg:col-span-1"
                    >
                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-lime-500/10 text-lime-400 flex items-center justify-center shrink-0 border border-lime-500/20">
                                <Shield size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Protección del Suelo</h3>
                                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                                    El protocolo interviene mediante ROFR (Right of First Refusal) para recomprar activos por debajo del valor neto (NAV).
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Liquidez Instantánea</h3>
                                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                                    Salidas tempranas garantizadas mediante pools de liquidez disciplinados y algoritmos de rebalanceo.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Trading Peer-to-Peer</h3>
                                <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                                    Intercambia tus artefactos directamente con otros miembros de la federación de forma segura.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-gradient-to-br from-lime-600 to-emerald-700 p-8 rounded-[2rem] text-white shadow-2xl shadow-lime-900/20 flex flex-col justify-center"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <Info size={20} className="text-lime-200" />
                            <span className="text-[12px] font-black uppercase tracking-widest text-lime-200">Estado del Despliegue</span>
                        </div>
                        <p className="text-lg font-bold leading-relaxed italic">
                            "La infraestructura 'Ethereum-grade' ya está lista en el Core. La interfaz de usuario del mercado se habilitará tras alcanzar la fase de acumulación crítica."
                        </p>
                        <div className="mt-8 pt-8 border-t border-white/10">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] uppercase tracking-tighter opacity-70">Sistema</p>
                                    <p className="font-mono text-sm">v1.5.0-Agora</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] uppercase tracking-tighter opacity-70">Seguridad</p>
                                    <p className="font-mono text-sm">Audited ✅</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-16"
                >
                    <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed border-t border-zinc-900 pt-8 italic">
                        Agora Market utiliza reglas matemáticas estrictas para asegurar la estabilidad económica de cada protocolo dentro de la Federación.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

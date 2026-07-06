'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Helper to determine if we are in print mode
export function DeckHero({ data }: { data: any }) {
    return (
        <section className="relative w-full min-h-[100vh] flex flex-col justify-end p-12 lg:p-24 bg-black text-white print:h-[100vh] print:p-16 print:break-after-page overflow-hidden">
            {/* Background Image */}
            {data.backgroundImage && (
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center opacity-60 print:opacity-100"
                    style={{ backgroundImage: `url(${data.backgroundImage})` }}
                />
            )}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/50 to-transparent" />
            
            <div className="relative z-20 max-w-5xl">
                {data.tagline && (
                    <span className="inline-block text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-emerald-400 mb-6 border border-emerald-500/30 px-4 py-2 rounded backdrop-blur-sm bg-black/20">
                        {data.tagline}
                    </span>
                )}
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-white">
                    {data.title}
                </h1>
                {data.subtitle && (
                    <p className="mt-8 text-xl md:text-3xl text-zinc-300 font-light max-w-3xl leading-relaxed">
                        {data.subtitle}
                    </p>
                )}
            </div>
            
            {/* Footer of the hero */}
            <div className="relative z-20 mt-24 flex justify-between items-end border-t border-white/20 pt-8 print:mt-16">
                <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Proyecto</p>
                    <p className="text-lg font-bold text-white">{data.projectName || 'S\'Narai'}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Confidencial</p>
                    <p className="text-sm font-mono text-white">Pitch Deck</p>
                </div>
            </div>
        </section>
    );
}

export function DeckPhases({ data }: { data: any }) {
    return (
        <section className="relative w-full min-h-[100vh] p-12 lg:p-24 bg-zinc-950 text-white print:h-[100vh] print:p-16 print:break-after-page flex flex-col justify-center">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500 mb-12">Estructura de Capital</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
                <div>
                    <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{data.title || "Fases de Participación"}</h3>
                    <p className="text-lg text-zinc-400 font-light leading-relaxed mb-12">
                        {data.description || "Nuestra estructura de capital está diseñada para recompensar a los primeros creyentes, incrementando el valor del título de participación en cada fase."}
                    </p>
                    
                    {/* The famous progress bar */}
                    <div className="bg-black border border-zinc-800 p-8 rounded-2xl print:bg-white print:border-zinc-300 print:text-black">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 print:text-emerald-600">Fase Actual</p>
                                <p className="text-2xl font-bold">{data.currentPhaseName || 'Preventa (Fase 1)'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1 print:text-zinc-500">Precio</p>
                                <p className="text-3xl font-mono text-emerald-400 print:text-emerald-600">${data.currentPrice || '460'}</p>
                            </div>
                        </div>
                        
                        <div className="w-full bg-zinc-900 rounded-full h-3 mb-3 print:bg-zinc-200">
                            <div 
                                className="bg-emerald-500 h-3 rounded-full" 
                                style={{ width: `${data.progressPercent || 10}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs font-bold text-zinc-500">
                            <span>{data.soldUnits || '3,000'} Títulos Adquiridos</span>
                            <span>{data.totalUnits || '30,000'} Disponibles</span>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {(data.phases || []).map((phase: any, i: number) => (
                        <div key={i} className={`p-6 rounded-xl border ${phase.active ? 'bg-emerald-900/20 border-emerald-500/30 print:bg-emerald-50 print:border-emerald-200' : 'bg-black border-zinc-800 print:bg-zinc-50 print:border-zinc-200'}`}>
                            <div className="flex justify-between items-center mb-2">
                                <p className={`font-bold ${phase.active ? 'text-emerald-400 print:text-emerald-700' : 'text-white print:text-black'}`}>{phase.name}</p>
                                <p className={`font-mono font-bold ${phase.active ? 'text-emerald-400 print:text-emerald-700' : 'text-zinc-400 print:text-zinc-600'}`}>${phase.price}</p>
                            </div>
                            <p className="text-sm text-zinc-500">{phase.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function DeckFinancials({ data }: { data: any }) {
    return (
        <section className="relative w-full min-h-[100vh] p-12 lg:p-24 bg-white text-black print:h-[100vh] print:p-16 print:break-after-page flex flex-col justify-center">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-400 mb-12">Proyecciones Financieras</h2>
            
            <div className="max-w-5xl">
                <h3 className="text-4xl md:text-5xl font-bold mb-16 leading-tight max-w-3xl">{data.title || "Rendimientos Estimados y Plusvalía"}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="p-8 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">Rendimiento Anual</p>
                        <p className="text-5xl font-black text-emerald-600">{data.annualYield || '12-15%'}</p>
                        <p className="text-sm text-zinc-500 mt-4 leading-relaxed">Derivado de las rentas y operaciones del desarrollo.</p>
                    </div>
                    <div className="p-8 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2 font-bold">Plusvalía Estimada</p>
                        <p className="text-5xl font-black text-blue-600">{data.capitalGain || '20%'}</p>
                        <p className="text-sm text-zinc-500 mt-4 leading-relaxed">Incremento del valor del activo a la entrega del proyecto.</p>
                    </div>
                    <div className="p-8 bg-zinc-950 text-white rounded-2xl border border-zinc-900 shadow-2xl">
                        <p className="text-xs uppercase tracking-widest text-zinc-400 mb-2 font-bold">TIR Proyectada</p>
                        <p className="text-5xl font-black text-white">{data.irr || '32%'}</p>
                        <p className="text-sm text-zinc-400 mt-4 leading-relaxed">Tasa Interna de Retorno combinando rendimiento y plusvalía.</p>
                    </div>
                </div>

                <div className="border-t border-zinc-200 pt-8">
                    <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-4">Nota Legal</p>
                    <p className="text-sm text-zinc-500 max-w-4xl leading-relaxed">
                        Las proyecciones mostradas son estimaciones basadas en estudios de mercado y el modelo financiero actual. Los rendimientos reales pueden variar. El capital invertido está respaldado por el activo inmobiliario y administrado mediante contratos inteligentes auditados.
                    </p>
                </div>
            </div>
        </section>
    );
}

export function DeckInfo({ data }: { data: any }) {
    return (
        <section className="relative w-full min-h-[100vh] p-12 lg:p-24 bg-zinc-50 text-black print:h-[100vh] print:p-16 print:break-after-page flex flex-col justify-center">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-400 mb-12">{data.sectionLabel || "Resumen del Proyecto"}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div>
                    <h3 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">{data.title}</h3>
                    <div className="prose prose-zinc lg:prose-lg text-zinc-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: data.content?.replace(/\n/g, '<br/>') || '' }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    {(data.stats || []).map((stat: any, i: number) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                            <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold mb-2">{stat.label}</p>
                            <p className="text-3xl font-black text-black">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function DeckInvestmentExample({ data }: { data: any }) {
    return (
        <section className="relative w-full min-h-[100vh] p-12 lg:p-24 bg-emerald-950 text-white print:h-[100vh] print:p-16 print:break-after-page flex flex-col justify-center">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-400 mb-12">{data.sectionLabel || "Caso de Estudio: Inversión Temprana"}</h2>
            
            <div className="max-w-5xl">
                <h3 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{data.title || "El Poder de Entrar Primero"}</h3>
                <p className="text-lg text-emerald-200/80 font-light leading-relaxed mb-16 max-w-3xl">
                    {data.description || "Adquirir títulos en la Fase 1 no solo garantiza el mejor precio, sino que maximiza la plusvalía capturada durante todo el ciclo de desarrollo."}
                </p>

                <div className="bg-black/40 border border-emerald-500/20 rounded-3xl p-8 lg:p-12 backdrop-blur-xl">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
                        <div>
                            <p className="text-sm uppercase tracking-widest text-emerald-400 font-bold mb-2">Inversión Inicial (Fase 1)</p>
                            <p className="text-5xl lg:text-6xl font-black">${data.initialInvestment || "25,000"} <span className="text-2xl text-emerald-500/50">USD</span></p>
                        </div>
                        <div className="px-6 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                            <p className="text-sm text-emerald-300">Equivalente a <span className="font-bold text-white">{data.titlesCount || "54"} títulos</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-1/2 left-10 right-10 h-px bg-gradient-to-r from-emerald-500/20 via-emerald-500/50 to-emerald-500/20 -translate-y-1/2" />
                        
                        {(data.timeline || []).map((step: any, i: number) => (
                            <div key={i} className="relative bg-emerald-900/40 border border-emerald-500/20 p-6 rounded-2xl z-10 backdrop-blur-md">
                                <span className="absolute -top-3 -left-3 w-8 h-8 bg-emerald-500 text-black font-bold flex items-center justify-center rounded-full text-sm">
                                    {i + 1}
                                </span>
                                <p className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-4">{step.phase}</p>
                                <p className="text-3xl font-bold mb-2">${step.value}</p>
                                <p className="text-sm text-emerald-200/60 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <p className="text-emerald-100 leading-relaxed text-sm">
                            <strong className="text-white">Conclusión:</strong> {data.conclusion || "Al entrar en Fase 1, aseguras una ganancia de capital inmediata sobre el valor de mercado proyectado para la Fase 3, además de maximizar tu % de yield anual al tener un costo de adquisición menor."}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

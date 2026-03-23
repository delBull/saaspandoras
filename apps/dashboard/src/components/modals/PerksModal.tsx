import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, CheckCircle2, Lock, ArrowRight, TrendingUp, Gift, Zap, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ProgressionEngine, Tier } from "@/lib/protocol-engine/progression";

interface PerksModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    userArtifactCount: number;
    onBuyMore?: (amount: number) => void;
}

export default function PerksModal({ isOpen, onClose, project, userArtifactCount, onBuyMore }: PerksModalProps) {
    const w2e = project?.w2eConfig || {};
    const rawTiers = (w2e.tiers || w2e.packages || []) as any[];
    
    // Normalize and Calculate via Engine
    const tiers: Tier[] = rawTiers.map(t => ({
      id: t.id,
      name: t.name,
      artifactCountThreshold: t.artifactCountThreshold ?? t.minArtifacts ?? 0,
      perks: t.perks || [],
      description: t.description
    }));

    const progression = ProgressionEngine.calculate(userArtifactCount, tiers);
    const { currentTier, nextTier, progressPercentage, urgencyLevel, unlockDelta } = progression;

    const sortedTiers = [...tiers].sort((a, b) => a.artifactCountThreshold - b.artifactCountThreshold);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-2xl p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="relative p-8 overflow-y-auto max-h-[70vh] no-scrollbar">
                    {/* Header Decoration */}
                    <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />
                    
                    <DialogHeader className="relative mb-8 text-center sm:text-left">
                        <div className="flex items-center gap-3 mb-2 justify-center sm:justify-start">
                            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-500/20">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <DialogTitle className="text-3xl font-black italic tracking-tight">
                                Economía de Progresión
                            </DialogTitle>
                        </div>
                        <p className="text-zinc-500 text-sm font-medium">Desbloquea beneficios exclusivos mientras apoyas el protocolo.</p>
                    </DialogHeader>

                    {/* Main Stats / Progression */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        {/* Current Status */}
                        <div className={`bg-zinc-900/40 rounded-[2rem] p-8 border flex flex-col justify-between group transition-all duration-500 ${
                            urgencyLevel === 'high' ? 'border-purple-500/50 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'border-zinc-800/80'
                        }`}>
                            <div>
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1">Nivel Actual</span>
                                <h4 className="text-2xl font-black text-white mt-1 italic uppercase tracking-tight">
                                    {currentTier ? currentTier.name : "Protocol Member"}
                                </h4>
                            </div>
                            <div className="mt-8 flex items-end justify-between">
                                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">{userArtifactCount}</div>
                                <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest pb-1">Artefactos</div>
                            </div>
                        </div>

                        {/* Next Target */}
                        <div className="bg-zinc-900/40 rounded-[2rem] p-8 border border-zinc-800/80 flex flex-col justify-between group hover:border-blue-500/30 transition-all duration-500">
                            {nextTier ? (
                                <>
                                    <div>
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] ml-1 font-mono">Próximo Hito</span>
                                        <h4 className="text-2xl font-bold text-zinc-500 mt-1 italic uppercase tracking-tight">{nextTier.name}</h4>
                                    </div>
                                    <div className="mt-8">
                                        <div className="flex justify-between items-end mb-2">
                                            <span className="text-[9px] font-black text-zinc-600 uppercase">Progreso del Tier</span>
                                            <span className={`text-[10px] font-black ${urgencyLevel === 'high' ? 'text-purple-400' : 'text-blue-400'}`}>
                                                {unlockDelta} faltan
                                            </span>
                                        </div>
                                        <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercentage}%` }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className={`h-full bg-gradient-to-r ${urgencyLevel === 'high' ? 'from-purple-600 to-pink-500' : 'from-purple-500 via-blue-500 to-indigo-600'}`} 
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-4">
                                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mb-4 border border-yellow-500/30">
                                        <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />
                                    </div>
                                    <p className="text-sm font-black text-white px-4">¡NIVEL MÁXIMO ALCANZADO!</p>
                                    <p className="text-[10px] text-zinc-500 mt-1 font-medium italic">Eres un pilar fundamental del protocolo.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* All Tiers Journey */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 px-2 mb-2">
                            <h5 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Camino de Beneficios</h5>
                            <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                        </div>
                        
                        {sortedTiers.map((tier, idx) => {
                            const isUnlocked = userArtifactCount >= tier.artifactCountThreshold;
                            const isCurrent = currentTier?.id === tier.id;

                            return (
                                <motion.div 
                                    key={tier.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`relative group p-7 rounded-[2rem] border transition-all duration-300 ${
                                        isUnlocked 
                                            ? "bg-gradient-to-br from-purple-900/20 via-zinc-900/60 to-zinc-950 border-purple-500/40 shadow-xl shadow-purple-500/5" 
                                            : "bg-zinc-950 border-zinc-900 grayscale opacity-40 hover:opacity-100"
                                    }`}
                                >
                                    {isCurrent && (
                                        <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-purple-500 rounded-full shadow-lg shadow-purple-500/40">
                                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                            <span className="text-[8px] font-black text-white uppercase tracking-widest">NIVEL ACTUAL</span>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-6">
                                        <div className={`p-4 rounded-2xl shadow-inner ${isUnlocked ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white' : 'bg-zinc-900 text-zinc-700 border border-zinc-800'}`}>
                                            {isUnlocked ? <CheckCircle2 className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h6 className={`text-lg font-black italic uppercase tracking-tight ${isUnlocked ? 'text-white' : 'text-zinc-600'}`}>
                                                    {tier.name}
                                                </h6>
                                                <Badge variant="outline" className={`text-[9px] font-black py-0 px-2 rounded-lg border-zinc-800 ${isUnlocked ? 'text-purple-400 border-purple-500/30' : 'text-zinc-600'}`}>
                                                    {tier.artifactCountThreshold} ART.
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-zinc-500 mt-2 mb-6 font-medium leading-relaxed">
                                                {tier.description || "Adquiere la cantidad necesaria de artefactos para desbloquear este nivel de beneficios."}
                                            </p>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                                                {(tier.perks || []).map((perk, pIdx) => (
                                                    <div key={pIdx} className="flex items-center gap-3 group/perk">
                                                        <div className={`p-1 rounded-lg ${isUnlocked ? 'bg-purple-500/10' : 'bg-zinc-900'}`}>
                                                            <Gift className={`w-3.5 h-3.5 ${isUnlocked ? 'text-purple-400' : 'text-zinc-700'}`} />
                                                        </div>
                                                        <span className={`text-[10px] font-bold ${isUnlocked ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                                            {perk}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Conversion Footer (v2.0 Optimization) */}
                <div className="p-8 bg-zinc-900/80 backdrop-blur-2xl border-t border-purple-500/20 flex flex-col items-center gap-4 relative">
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                    
                    {nextTier ? (
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="flex items-center gap-2">
                                <TrendingUp className={`w-4 h-4 ${urgencyLevel === 'high' ? 'text-pink-500 animate-pulse' : 'text-purple-400'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${urgencyLevel === 'high' ? 'text-pink-400' : 'text-zinc-500'}`}>
                                    {urgencyLevel === 'high' ? '¡Urgente! Estás a un paso' : 'Siguiente nivel a tu alcance'}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => onBuyMore?.(unlockDelta)}
                                className={`group w-full bg-white text-zinc-950 px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase flex items-center justify-center gap-3 hover:bg-purple-500 hover:text-white transition-all duration-500 active:scale-95 shadow-[0_20px_40px_rgba(0,0,0,0.3)]`}
                            >
                                <ShoppingCart className="w-4 h-4" />
                                Sube a {nextTier.name} ahora
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950 text-white rounded-full group-hover:bg-white group-hover:text-purple-600 transition-colors ml-2">
                                    <span className="text-[10px] font-black">+{unlockDelta}</span>
                                </div>
                                <ArrowRight className="w-4 h-4 ml-auto" />
                            </button>
                            
                            <p className="text-[9px] text-zinc-600 font-medium italic">
                                Al subir de nivel desbloquearás: <strong>{nextTier.perks?.[0] || 'Nuevos privilegios'}</strong>
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 py-2">
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] block text-center">Protocol Legend</span>
                                <span className="text-xs text-white font-bold italic">Has alcanzado el máximo reconocimiento</span>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

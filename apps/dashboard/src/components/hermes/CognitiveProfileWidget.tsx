'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Activity, BookOpen, Clock, Loader2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CognitiveProfile {
  transactionalScore: number;
  educationalScore: number;
  persona: string | null;
  behavioralTraits?: string[] | null;
  optimalApproach?: string | null;
  lastInteractionAt: string;
}

interface Props {
  userId: string;
  walletAddress?: string | null;
  className?: string;
}

export function CognitiveProfileWidget({ userId, walletAddress, className = '' }: Props) {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        // We pass wallet as fallback since the backend maps to identity
        const queryParams = new URLSearchParams({ userId });
        if (walletAddress) queryParams.append('wallet', walletAddress);

        const res = await fetch(`/api/v1/nexus/cognitive-profiles?${queryParams.toString()}`);
        if (!res.ok) {
          if (res.status === 404) {
            setProfile(null);
          } else {
            setError(true);
          }
          return;
        }
        
        const data = await res.json();
        setProfile(data.profile);
      } catch (err) {
        console.error("Failed to fetch cognitive profile", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchProfile();
    }
  }, [userId, walletAddress]);

  if (loading) {
    return (
      <div className={`p-4 rounded-xl bg-[#08080A] border border-white/5 animate-pulse flex items-center justify-center min-h-[140px] ${className}`}>
        <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2 ${className}`}>
        <Info className="w-4 h-4" />
        Error al cargar el perfil cognitivo.
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`p-4 rounded-xl bg-[#08080A] border border-white/5 text-zinc-500 text-sm flex flex-col items-center justify-center gap-2 min-h-[140px] ${className}`}>
        <BrainCircuit className="w-6 h-6 opacity-50" />
        <p>No hay datos cognitivos para este lead.</p>
      </div>
    );
  }

  // Determine Persona Color
  let personaColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
  if (profile.persona?.toLowerCase().includes("risk") || profile.persona?.toLowerCase().includes("conserv")) personaColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  if (profile.persona?.toLowerCase().includes("whale") || profile.persona?.toLowerCase().includes("growth")) personaColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";

  return (
    <div className={`p-4 rounded-xl bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-purple-400" />
          <h4 className="text-sm font-semibold text-white">Perfil Cognitivo (Hermes)</h4>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <button type="button" className="text-zinc-500 hover:text-purple-400 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-900 border-zinc-800 text-zinc-300 max-w-xs p-3">
                <p className="text-xs">
                  Hermes analiza las interacciones de este prospecto para determinar su intención transaccional (probabilidad de cierre) y sus rasgos de comportamiento. Usa esta información para adaptar tu discurso.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {profile.persona && (
          <span className={`px-2 py-1 text-xs font-mono rounded border ${personaColor}`}>
            {profile.persona}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Transactional Score */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <Activity className="w-3.5 h-3.5" />
              Intención Transaccional (Hot)
            </span>
            <span className="text-white font-mono">{profile.transactionalScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${profile.transactionalScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-orange-500 to-rose-500 rounded-full"
            />
          </div>
        </div>

        {/* Educational Score */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <BookOpen className="w-3.5 h-3.5" />
              Intención Educativa / Exploratoria
            </span>
            <span className="text-white font-mono">{profile.educationalScore}%</span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${profile.educationalScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Behavioral Traits & Optimal Approach */}
      {(profile.behavioralTraits?.length || profile.optimalApproach) && (
        <div className="mt-2 pt-3 border-t border-white/5 space-y-3">
          {profile.behavioralTraits && profile.behavioralTraits.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">Patrones de Comportamiento</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {profile.behavioralTraits.map((trait, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 text-[10px] rounded bg-white/5 border border-white/10 text-zinc-300">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {profile.optimalApproach && (
            <div>
              <span className="text-[10px] uppercase font-semibold text-emerald-500/70 tracking-wider flex items-center gap-1">
                <BrainCircuit className="w-3 h-3" /> Approach Recomendado
              </span>
              <p className="mt-1 text-xs text-emerald-400/90 leading-relaxed bg-emerald-500/5 p-2 rounded border border-emerald-500/10">
                {profile.optimalApproach}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end text-[10px] text-zinc-500 mt-2">
        <Clock className="w-3 h-3 mr-1" />
        Última evaluación: {new Date(profile.lastInteractionAt).toLocaleString()}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  Compass,
  UserCheck,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import type { NexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { HermesFloatingGuide } from "@/components/guides/HermesFloatingGuide";
import type { EcosystemTourRole } from "@/lib/guides/ecosystem-guides.data";

interface NexusCommandCenterProps {
  auth: NexusAuthContext;
  initialTour?: string;
  initialRole?: string;
  iframeToken?: string;
}

export function NexusCommandCenter({ auth, initialTour, initialRole, iframeToken }: NexusCommandCenterProps) {
  const { role, wallet } = auth;
  const [isTourOpen, setIsTourOpen] = React.useState(
    initialTour === "ecosystem" || initialTour === "onboarding"
  );
  const [showGuideSidebar, setShowGuideSidebar] = React.useState(false);

  const validRoles: EcosystemTourRole[] = ["SUPER_ADMIN", "ADMIN", "MARKETING", "VIEWER"];
  const tourRole: EcosystemTourRole = validRoles.includes(role as EcosystemTourRole)
    ? (role as EcosystemTourRole)
    : "VIEWER";

  const [customStations, setCustomStations] = React.useState<any[] | undefined>();
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("pandoras_guides_customizer_v1");
      if (stored) {
        setCustomStations(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to parse custom stations", error);
    }
  }, []);

  const getRoleBadge = () => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold tracking-wide shadow-lg shadow-amber-500/10">
            👑 SUPER ADMIN
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold tracking-wide">
            🛡️ ADMIN
          </span>
        );
      case "MARKETING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-[10px] font-mono font-bold tracking-wide">
            ⚙️ OPERADOR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold tracking-wide">
            👥 VIEWER
          </span>
        );
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#08080A] text-white selection:bg-amber-500/30">
      
      {/* ── MAIN CONTENT (NEXUS CONSOLE IFRAME) ── */}
      <div className="absolute inset-0 z-0">
        <iframe 
          src={`https://pandoras.finance/en/nexus${auth.wallet ? `?wallet=${auth.wallet}` : ''}${iframeToken ? `${auth.wallet ? '&' : '?'}token=${iframeToken}` : ''}`} 
          className="w-full h-full border-none" 
        />
      </div>

      {/* ── SIDEBAR OVERLAY / GUIDE ── */}
      <div 
        className={`absolute top-0 bottom-0 left-0 z-40 w-80 bg-[#08080A]/95 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col justify-between transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          showGuideSidebar ? "translate-x-0 shadow-2xl shadow-black/50" : "-translate-x-full"
        }`}
      >
        <div className="space-y-8">
          <div className="space-y-2">
            <span className="text-[9px] uppercase font-mono tracking-[0.3em] text-zinc-500">
              Nexus Command Center
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
              Pandora's Protocol
            </h2>
            <div className="pt-2">
              {getRoleBadge()}
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Sesión Activa</span>
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex justify-between items-center text-zinc-400 border-b border-white/5 pb-1">
                <span>Wallet</span>
                <span className="text-amber-300 font-bold tracking-wider">
                  {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : "GUEST"}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400 pt-1">
                <span>Estado</span>
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsTourOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-all group"
          >
            <Compass className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-center">Guía del Ecosistema</span>
          </button>
        </div>

        <div className="text-[9px] text-zinc-600 font-mono text-center">
          Powered by Hermes AI Kernel
        </div>
      </div>

      {/* ── TOGGLE BUTTON (FIXED TO THE EDGE OF THE SIDEBAR) ── */}
      <div 
        className={`absolute top-1/2 -translate-y-1/2 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          showGuideSidebar ? "left-80" : "left-0"
        }`}
      >
        <button 
          onClick={() => setShowGuideSidebar(!showGuideSidebar)}
          className={`h-24 w-6 bg-[#08080A]/90 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-amber-500/50 transition-all shadow-xl group rounded-r-xl border-l-0`}
          title="Toggle Guide"
        >
          {showGuideSidebar ? (
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
          )}
        </button>
      </div>

      {/* ── HERMES FLOATING ECOSYSTEM TOUR GUIDE ── */}
      <HermesFloatingGuide
        role={tourRole}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        customStations={customStations}
      />
    </div>
  );
}

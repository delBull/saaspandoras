"use client";

import React from "react";
import Link from "next/link";
import { UserCheck, Compass, Settings, LogOut, Sliders, Activity, Globe, Server, X, ChevronLeft, ChevronRight } from "lucide-react";
import { DisplayControlsWidget } from "@pandoras/display-engine";

interface NexusSidebarProps {
  role: string | null;
  wallet: string | null | undefined;
  sidebarOpen: boolean;
  setShowGuideSidebar: (val: boolean) => void;
  setIsTourOpen: (val: boolean) => void;
  setIsSettingsOpen: (val: boolean) => void;
  showDisplayControls: boolean;
  setShowDisplayControls: (val: boolean | ((prev: boolean) => boolean)) => void;
  getRoleBadge: () => React.ReactNode;
  onLogout: () => void;
}

export function NexusSidebar({
  wallet,
  sidebarOpen,
  setShowGuideSidebar,
  setIsTourOpen,
  setIsSettingsOpen,
  showDisplayControls,
  setShowDisplayControls,
  getRoleBadge,
  onLogout,
}: NexusSidebarProps) {
  return (
    <>
      <div 
        className={`absolute top-0 bottom-0 left-0 z-40 w-[85%] sm:w-80 bg-[#07070A]/95 backdrop-blur-2xl border-r border-white/[0.08] p-6 flex flex-col justify-between transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          sidebarOpen ? "translate-x-0 shadow-2xl shadow-black/50" : "-translate-x-full"
        }`}
      >
        <div className="space-y-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
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

          <div className="space-y-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">Ecosistema Principal</span>
            <div className="flex flex-col gap-1.5">
              <Link href="/growth-os" className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">Growth OS</span>
                </div>
              </Link>
              <Link href="https://app.pandoras.finance" target="_blank" className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">app.pandoras.finance</span>
                </div>
              </Link>
              <Link href="https://admin.pandoras.finance" target="_blank" className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">admin.pandoras.finance</span>
                </div>
              </Link>
            </div>
          </div>

          <button
            onClick={() => setIsTourOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-all group"
          >
            <Compass className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            <span className="text-center">Onboarding</span>
          </button>
        </div>

        <div className="pt-4 mt-auto border-t border-white/10">
          <div className="mb-2.5">
            <button
              onClick={() => setShowDisplayControls((prev) => !prev)}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] tracking-wider transition-all ${
                showDisplayControls
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3 h-3 text-amber-400" />
              SOVEREIGN DISPLAY
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-300 text-[10px] tracking-wider hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <Settings className="w-3 h-3 text-zinc-400" />
              SETTINGS
            </button>
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] tracking-wider hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              LOGOUT
            </button>
          </div>
          <div className="pt-4 text-center">
            <p className="text-[9px] font-mono text-zinc-600">Powered by Hermes AI Kernel</p>
          </div>

          {showDisplayControls && (
            <div className="absolute inset-0 z-50 bg-[#0A0A0C]/95 backdrop-blur-3xl flex flex-col animate-in fade-in slide-in-from-bottom-10 duration-300">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-white tracking-widest text-sm">SOVEREIGN DISPLAY</h3>
                </div>
                <button
                  onClick={() => setShowDisplayControls(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <DisplayControlsWidget variant="minimal" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TOGGLE BUTTON */}
      <div 
        className={`absolute top-1/2 -translate-y-1/2 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          sidebarOpen ? "left-80" : "left-0"
        }`}
      >
        <button 
          onClick={() => setShowGuideSidebar(!sidebarOpen)}
          className={`h-24 w-6 bg-[#07070A]/90 backdrop-blur-md border border-white/[0.12] flex items-center justify-center hover:bg-white/10 hover:border-amber-500/50 transition-all shadow-xl group rounded-r-xl border-l-0`}
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
          )}
        </button>
      </div>
    </>
  );
}

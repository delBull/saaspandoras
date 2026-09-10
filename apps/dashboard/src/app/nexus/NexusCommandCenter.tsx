"use client";

import React, { useState, useEffect } from "react";
import {
  Compass,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Settings,
  LogOut,
  Boxes,
  TrendingUp,
  Key,
  BookOpen,
  BrainCircuit,
  ExternalLink,
  Activity,
  Server,
  X,
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { HermesFloatingGuide } from "@/components/guides/HermesFloatingGuide";
import type { EcosystemTourRole } from "@/lib/guides/ecosystem-guides.data";
import Link from "next/link";

interface NexusCommandCenterProps {
  auth: NexusAuthContext;
  initialTour?: string;
  initialRole?: string;
  iframeToken?: string;
}

const SECTIONS = [
  {
    id: "core",
    title: "Core Protocol",
    description: "Sovereign execution, Deal Rooms & on-chain primitives.",
    icon: Boxes,
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/30",
    text: "text-blue-400",
    bgAccent: "bg-blue-500/10",
    links: [
      { label: "Deal Room & Sovereign Execution", href: "/nexus/rooms" },
      { label: "Sovereign Auth Engine", href: "/admin/auth" },
    ]
  },
  {
    id: "growth",
    title: "Growth & Platform Infrastructure",
    description: "Analytics, funnels, developer hub and scaling architecture.",
    icon: TrendingUp,
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
    links: [
      { label: "Developer Hub & SDK", href: "/nexus/developers" },
      { label: "Marketing Leads & Flow", href: "/marketing" },
    ]
  },
  {
    id: "access",
    title: "Platform & Access",
    description: "RBAC, gateways, and cross-tenant collaborator management.",
    icon: Key,
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30",
    text: "text-amber-400",
    bgAccent: "bg-amber-500/10",
    links: [
      { label: "Identity Provider", href: "/nexus/identity" },
      { label: "Collaborator Access", href: "/nexus/collaborators" }
    ]
  },
  {
    id: "resources",
    title: "Resources & Institutional Books",
    description: "Due diligence, data rooms, and compliance logs.",
    icon: BookOpen,
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/30",
    text: "text-purple-400",
    bgAccent: "bg-purple-500/10",
    links: [
      { label: "Institutional Data Room", href: "https://pandoras.finance/en/institutional", external: true },
      { label: "Knowledge Graph", href: "/nexus/graph" }
    ]
  },
  {
    id: "cognitive",
    title: "Hermes Cognitive",
    description: "AI OS, vector memory, and network orchestration layers.",
    icon: BrainCircuit,
    color: "from-rose-500/20 to-rose-600/5",
    border: "border-rose-500/30",
    text: "text-rose-400",
    bgAccent: "bg-rose-500/10",
    links: [
      { label: "Hermes Command", href: "/nexus/hermes" },
      { label: "Vector Logs", href: "/nexus/hermes/logs" }
    ]
  }
];

export function NexusCommandCenter({ auth, initialTour, initialRole, iframeToken }: NexusCommandCenterProps) {
  const { role, wallet } = auth;
  const [isTourOpen, setIsTourOpen] = useState(
    initialTour === "ecosystem" || initialTour === "onboarding"
  );
  // Por defecto el sidebar puede estar abierto o cerrado.
  const [showGuideSidebar, setShowGuideSidebar] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showWelcomePanel, setShowWelcomePanel] = useState(false);

  const validRoles: EcosystemTourRole[] = ["SUPER_ADMIN", "ADMIN", "MARKETING", "VIEWER"];
  const tourRole: EcosystemTourRole = validRoles.includes(role as EcosystemTourRole)
    ? (role as EcosystemTourRole)
    : "VIEWER";

  const [customStations, setCustomStations] = useState<any[] | undefined>();
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pandoras_guides_customizer_v1");
      if (stored) {
        setCustomStations(JSON.parse(stored));
      }
    } catch (error) {
      console.warn("Failed to parse custom stations", error);
    }
    
    if (auth.email) {
      const welcomeKey = `pandoras_welcome_${auth.email}`;
      if (!localStorage.getItem(welcomeKey)) {
        setShowWelcomePanel(true);
      }
    }
  }, [auth.email]);

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
    <div className="relative w-full h-screen overflow-hidden bg-[#08080A] text-white selection:bg-amber-500/30 flex">
      
      {/* ── BACKGROUND IFRAME ── */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none grayscale">
        <iframe 
          src={`${process.env.NEXT_PUBLIC_NEXUS_URL || 'https://nexus.pandoras.finance'}/nexus/rooms${auth.wallet ? `?wallet=${auth.wallet}` : ''}${iframeToken ? `${auth.wallet ? '&' : '?'}token=${iframeToken}` : ''}`} 
          className="w-full h-full border-none" 
        />
      </div>

      {/* ── SIDEBAR OVERLAY / GUIDE ── */}
      <div 
        className={`absolute top-0 bottom-0 left-0 z-40 w-[85%] sm:w-80 bg-[#0C0C10]/95 backdrop-blur-2xl border-r border-white/10 p-6 flex flex-col justify-between transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          showGuideSidebar ? "translate-x-0 shadow-2xl shadow-black/50" : "-translate-x-full"
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

          {/* MAIN PLATFORM LINKS */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest px-1">Ecosistema Principal</span>
            <div className="flex flex-col gap-1.5">
              <Link href="https://dash.pandoras.finance" target="_blank" className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">dash.pandoras.finance</span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
              </Link>
              <Link href="https://app.pandoras.finance" target="_blank" className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">app.pandoras.finance</span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
              </Link>
              <Link href="https://admin.pandoras.finance" target="_blank" className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors">admin.pandoras.finance</span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400" />
              </Link>
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

        <div className="pt-4 mt-auto border-t border-white/10">
          <div className="flex gap-2">
            {auth.role === 'SUPER_ADMIN' && (
              <button
                onClick={() => {
                  // Configurar si lo desea
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-300 text-[10px] tracking-wider hover:bg-zinc-700 transition-colors"
                title="Configuración"
              >
                <Settings className="w-3 h-3 text-zinc-400" />
                SETTINGS
              </button>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('pandoras_nexus_token');
                window.location.href = '/login';
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-[10px] tracking-wider hover:bg-red-500/20 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-3 h-3" />
              LOGOUT
            </button>
          </div>
          <div className="text-[9px] text-zinc-600 font-mono text-center mt-4">
            Powered by Hermes AI Kernel
          </div>
        </div>
      </div>

      {/* ── TOGGLE BUTTON ── */}
      <div 
        className={`absolute top-1/2 -translate-y-1/2 z-50 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
          showGuideSidebar ? "left-80" : "left-0"
        }`}
      >
        <button 
          onClick={() => setShowGuideSidebar(!showGuideSidebar)}
          className={`h-24 w-6 bg-[#0C0C10]/90 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-amber-500/50 transition-all shadow-xl group rounded-r-xl border-l-0`}
          title="Toggle Sidebar"
        >
          {showGuideSidebar ? (
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
          )}
        </button>
      </div>

      {/* ── MAIN CONTENT: THE HUB GRID ── */}
      <main className={`flex-1 relative z-10 transition-all duration-500 p-8 md:p-16 overflow-y-auto ${showGuideSidebar ? "pl-96" : "pl-16"}`}>
        <div className="max-w-6xl mx-auto h-full flex flex-col justify-center">
          <AnimatePresence>
            {!activeSection && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {SECTIONS.map((sec) => (
                  <motion.div
                    layoutId={`card-${sec.id}`}
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`cursor-pointer relative overflow-hidden rounded-2xl border bg-gradient-to-br ${sec.color} ${sec.border} p-6 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50 group`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl ${sec.bgAccent}`}>
                        <sec.icon className={`w-6 h-6 ${sec.text}`} />
                      </div>
                      <ChevronRight className={`w-5 h-5 ${sec.text} opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{sec.title}</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{sec.description}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeSection && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
              >
                {SECTIONS.filter(s => s.id === activeSection).map(sec => (
                  <motion.div 
                    key={`modal-${sec.id}`}
                    layoutId={`card-${sec.id}`}
                    className={`relative w-full max-w-3xl rounded-3xl border bg-[#0C0C10] ${sec.border} overflow-hidden shadow-2xl`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${sec.color} opacity-50`} />
                    <div className="relative z-10 p-8 md:p-12">
                      <button 
                        onClick={() => setActiveSection(null)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>

                      <div className="flex items-center gap-4 mb-6">
                        <div className={`p-4 rounded-2xl ${sec.bgAccent}`}>
                          <sec.icon className={`w-8 h-8 ${sec.text}`} />
                        </div>
                        <div>
                          <h2 className="text-3xl font-black text-white">{sec.title}</h2>
                          <p className="text-zinc-400 mt-1">{sec.description}</p>
                        </div>
                      </div>

                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sec.links.map((link, idx) => (
                          <Link 
                            key={idx} 
                            href={link.href}
                            target={link.external ? "_blank" : "_self"}
                            className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-black/40 hover:bg-white/5 transition-all group"
                          >
                            <span className="font-semibold text-white group-hover:text-amber-300 transition-colors">{link.label}</span>
                            {link.external ? (
                              <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── HERMES WELCOME PANEL MODAL ── */}
          <AnimatePresence>
            {showWelcomePanel && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-[#08080A]/95 backdrop-blur-xl flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="w-full max-w-lg bg-[#0e0e16] border border-amber-500/20 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                        <BrainCircuit className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400 font-semibold">
                          Operaciones Autónomas
                        </span>
                        <h3 className="text-2xl font-bold text-white tracking-tight leading-tight">
                          Hola {auth.name ? auth.name.split(' ')[0] : 'Operador'}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        Bienvenido al <strong>Sovereign Command Plane</strong> de Pandora's OS. Soy Hermes, tu asistente operativo. Te he preparado el entorno.
                      </p>
                      
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                        <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pasos Recomendados:</h4>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <div className="mt-0.5"><Compass className="w-4 h-4 text-emerald-400" /></div>
                            <span className="text-sm text-zinc-300">Abre el <strong className="text-white">Interactive Onboarding</strong> en el panel izquierdo para tu tour inicial.</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="mt-0.5"><Boxes className="w-4 h-4 text-blue-400" /></div>
                            <span className="text-sm text-zinc-300">Explora las tarjetas de control (Core Protocol, Deal Rooms, etc.) en el centro.</span>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="mt-0.5"><Activity className="w-4 h-4 text-amber-400" /></div>
                            <span className="text-sm text-zinc-300">Háblame directamente en la <strong className="text-white">Terminal Hermes</strong> (Cognitive Agents) para cualquier duda.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (auth.email) {
                          localStorage.setItem(`pandoras_welcome_${auth.email}`, 'true');
                        }
                        setShowWelcomePanel(false);
                        if (!isTourOpen) setIsTourOpen(true);
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                    >
                      Entendido, iniciar operaciones
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <HermesFloatingGuide
        role={tourRole}
        operatorContext={auth.name && auth.email ? { name: auth.name, email: auth.email, role: tourRole } : null}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        customStations={customStations}
      />
    </div>
  );
}

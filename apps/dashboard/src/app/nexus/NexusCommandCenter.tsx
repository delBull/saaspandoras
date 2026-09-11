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
  Globe,
  TerminalSquare,
  Handshake,
  Code2,
  GraduationCap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { HermesFloatingGuide } from "@/components/guides/HermesFloatingGuide";
import type { EcosystemTourRole } from "@/lib/guides/ecosystem-guides.data";
import TasksPanel from "@/components/nexus/TasksPanel";
import { OperationsHubModal } from "@/components/nexus/OperationsHubModal";
import { INITIAL_TASKS, TaskItem } from "@/components/nexus/taskTypes";
import Link from "next/link";

interface NexusCommandCenterProps {
  auth: NexusAuthContext;
  initialTour?: string;
  initialRole?: string;
  iframeToken?: string;
  token?: string;
}

interface NexusLink {
  label: string;
  note?: string;
  href: string;
  external?: boolean;
  cap?: string | string[];
  superAdminOnly?: boolean;
}

interface NexusSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  border: string;
  text: string;
  bgAccent: string;
  cap?: string | string[];
  links: NexusLink[];
}

const SECTIONS: NexusSection[] = [
  {
    id: "core",
    title: "Core Protocol",
    description: "Sovereign execution, Deal Rooms, transaction rooms & on-chain primitives.",
    icon: Boxes,
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/30",
    text: "text-blue-400",
    bgAccent: "bg-blue-500/10",
    cap: "nexus.manage",
    links: [
      { label: "Deal Room & Transaction Rooms", note: "Redacción, revisión y firma de propuestas y acuerdos institucionales.", href: "/nexus/rooms" },
      { label: "Academy & Leadership Curriculum", note: "Alumnos, curriculum COO/CFO y emisión de blueprints de certificación.", href: "/nexus/academy" },
      { label: "Nexus Settings & Roles (RBAC)", note: "Gestión centralizada de roles y permisos de la organización.", href: "/nexus/settings" },
      { label: "Protocol Overview", note: "Visión del protocolo y sus capas.", href: "/protocol" },
      { label: "Utility Protocol", note: "Capa utilitaria del ecosistema.", href: "/utility-protocol" },
      { label: "Protocol Story", note: "Historia y evolución del protocolo.", href: "/protocol-story" },
      { label: "Litepaper", note: "Resumen ejecutivo e institucional.", href: "/litepaper" },
      { label: "Whitepaper", note: "Documento técnico completo.", href: "/whitepaper" },
      { label: "Books Vault Constitucional", note: "Constitución y Libros Fundacionales I-IX con doble capa criptográfica.", href: "https://pandoras.finance/libros/constitucion", external: true },
      { label: "Institutional Data Room", note: "Due diligence y compliance institucional.", href: "https://pandoras.finance/institutional-book", external: true },
    ]
  },
  {
    id: "growth",
    title: "Growth & Platform Infrastructure",
    description: "Developer hub, marketing, funnels, portales y scaling architecture.",
    icon: TrendingUp,
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
    cap: ["growth.manage", "marketing.manage"],
    links: [
      { label: "Growth OS (Ecosystem Portal)", note: "Portal del ecosistema.", href: "/growth-os" },
      { label: "Developer Hub & SDK", note: "API keys, webhooks y herramientas para desarrolladores del ecosistema.", href: "/nexus/developers", cap: "nexus.manage" },
      { label: "Marketing Leads & Flow", note: "Campañas, funnels y leads comerciales.", href: "/admin/marketing", cap: "marketing.manage" },
      { label: "Hermes HITL Inbox", note: "Command center human-in-the-loop.", href: "/growth-os/hermes/inbox" },
      { label: "Cognitive Hub & Agents", note: "Orquestación de agentes Hermes en Growth OS.", href: "/growth-os/hermes" },
      { label: "Pandora's Media Co (Demand Engine)", note: "Motor de demanda mediática.", href: "/media" },
      { label: "Pandora's Media Co (Dashboard)", note: "Consola de la media company.", href: "https://media.pandoras.finance", external: true },
      { label: "Asset Capitalization", note: "Capitalización de activos.", href: "/asset-capitalization" },
      { label: "Ambassadors", note: "Programa de embajadores.", href: "/ambassadors" },
      { label: "Founders", note: "Programa de founders.", href: "/founders" },
      { label: "Bitcoin Initiative", note: "Capa BTC del ecosistema.", href: "/bitcoin-initiative" },
      { label: "Events", note: "Eventos y activaciones.", href: "/events" },
      { label: "Join", note: "Únete al ecosistema.", href: "/join" },
      { label: "Waitlist Success", note: "Post-registro waitlist.", href: "/waitlist-success" },
      { label: "Tenant Portal (Preview)", note: "Experiencia in-portal interactiva.", href: "/portal", cap: "nexus.manage" },
      { label: "Retail End-User Portal", note: "Frontend B2C de consumo.", href: "https://app.pandoras.finance", external: true },
    ]
  },
  {
    id: "access",
    title: "Platform & Access",
    description: "RBAC, identity, colaboradores y aprobaciones de acceso.",
    icon: Key,
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30",
    text: "text-amber-400",
    bgAccent: "bg-amber-500/10",
    cap: "ecosystem",
    links: [
      { label: "Nexus Settings & Roles (RBAC)", note: "Team, agentes cognitivos y terminal Hermes.", href: "/nexus/settings" },
      { label: "Collaborators & Aprobaciones", note: "Aprobar accesos PENDING y gestionar colaboradores.", href: "/admin/collaborators", cap: "users.manage" },
      { label: "Usuarios & Identidad", note: "Directorio de usuarios del ecosistema.", href: "/admin/users", cap: "users.manage" },
      { label: "Hermes QA & Prompt Studio", note: "Suite de pruebas conversacionales y auditoría de inferencias.", href: "/admin/hermes", cap: "users.manage" },
      { label: "Academy Control Plane", note: "Gestión administrativa de la academia.", href: "/admin/academy", cap: "users.manage" },
      { label: "Onboarding Unificado", note: "Wizard de provisioning de operadores.", href: "/onboarding" },
      { label: "HQ Platform Governance", note: "Consola admin, accounting y tenant lens.", href: "/admin", cap: "users.manage" },
      { label: "Access / Login", note: "Acceso al ecosistema.", href: "/access" },
    ]
  },
  {
    id: "resources",
    title: "Resources & Institutional Books",
    description: "Due diligence, data rooms, libros fundacionales y compliance.",
    icon: BookOpen,
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/30",
    text: "text-purple-400",
    bgAccent: "bg-purple-500/10",
    cap: "institutionalBooks",
    links: [
      { label: "Pandoras Institutional Framework (Libros 0–VIII)", note: "Cuerpo documental institucional.", href: "https://pandoras.finance/libros", external: true },
      { label: "IOM System & Architecture (5 Layers)", note: "Sistema operativo institucional.", href: "https://pandoras.finance/libros/constitucion", external: true },
      { label: "Pandoras Asset Standard (PAS v1.0)", note: "Estándar de activos, Libro IV.", href: "https://pandoras.finance/libros/libro-iv", external: true },
      { label: "Licensing Framework (Libro V)", note: "Frame de licenciamiento.", href: "https://pandoras.finance/libros/libro-v", external: true },
      { label: "Tech Platform & Capital Engine (Libro VI)", note: "Plataforma tecnológica y capital.", href: "https://pandoras.finance/libros/libro-vi", external: true },
      { label: "Growth & Expansion Roadmap (Libro VII)", note: "Roadmap de crecimiento.", href: "https://pandoras.finance/libros/libro-vii", external: true },
      { label: "Institutional Doctrine (Libro VIII)", note: "Doctrina institucional.", href: "https://pandoras.finance/libros/libro-viii", external: true },
      { label: "Hermes Agent OS & Kernel Architecture (Libro IX)", note: "Arquitectura del kernel Hermes.", href: "https://pandoras.finance/libros/libro-ix", external: true },
      { label: "Institutional Data Room", note: "Due diligence y compliance institucional.", href: "https://pandoras.finance/institutional-book", external: true },
      { label: "Academy & Blueprints", note: "Alumnos y curriculum de liderazgo.", href: "/nexus/academy" },
      { label: "Academy Control Plane", note: "Evaluación y emisión de certificaciones.", href: "/admin/academy", cap: "users.manage" },
    ]
  },
  {
    id: "cognitive",
    title: "Hermes Cognitive",
    description: "AI OS, terminal, agentes y capas de orquestación de red.",
    icon: BrainCircuit,
    color: "from-rose-500/20 to-rose-600/5",
    border: "border-rose-500/30",
    text: "text-rose-400",
    bgAccent: "bg-rose-500/10",
    cap: "ecosystem",
    links: [
      { label: "Hermes OS Terminal", note: "Consola conversacional para operadores (texto o voz).", href: "/nexus/settings" },
      { label: "Cognitive Agents", note: "Agentes cognitivos y memoria vectorial.", href: "/nexus/settings" },
      { label: "Hermes HITL Inbox", note: "Command center human-in-the-loop.", href: "/growth-os/hermes/inbox" },
      { label: "Cognitive Hub", note: "Sync cognitivo y hub de agentes.", href: "/growth-os/hermes" },
      { label: "Hermes QA & Prompt Studio", note: "Simulación de respuestas y auditoría de seguridad.", href: "/admin/hermes", cap: "users.manage" },
      { label: "Libro IX · Hermes Architecture", note: "Specs de arquitectura, contratos, SDK, APIs.", href: "https://pandoras.finance/libros/libro-ix", external: true },
    ]
  }
];

export function NexusCommandCenter({ auth, initialTour, initialRole, iframeToken, token }: NexusCommandCenterProps) {
  const { role, wallet } = auth;
  const isFirstVisitParam = initialTour === "ecosystem" || initialTour === "onboarding";
  const [isTourOpen, setIsTourOpen] = useState(isFirstVisitParam);
  // Sidebar: abierta SOLO durante el flujo de iniciación (1era visita o tour
  // explícito via ?tour=ecosystem). Una vez dentro de la vista, oculta por defecto.
  // null = midida pendiente (SSR/hidratación) → se trata como cerrada.
  const [showGuideSidebar, setShowGuideSidebar] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showWelcomePanel, setShowWelcomePanel] = useState(false);
  const [isOpsModalOpen, setIsOpsModalOpen] = useState(false);
  const sidebarOpen = showGuideSidebar === true;

  // Sincronización simétrica de sesión para que nunca se pierda el token al navegar entre páginas
  useEffect(() => {
    try {
      const urlToken = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("token") : null;
      const effectiveToken = urlToken || token;
      if (effectiveToken) {
        localStorage.setItem("pandoras_nexus_token", effectiveToken);
        document.cookie = `pandoras_nexus_token=${encodeURIComponent(effectiveToken)}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        const stored = typeof window !== "undefined" ? localStorage.getItem("pandoras_nexus_token") : null;
        if (stored && !document.cookie.includes("pandoras_nexus_token=")) {
          document.cookie = `pandoras_nexus_token=${encodeURIComponent(stored)}; path=/; max-age=2592000; SameSite=Lax`;
        }
      }
    } catch (e) {
      console.warn("[Nexus] Failed to sync token storage/cookie:", e);
    }
  }, [token]);

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_TASKS;
    try {
      const stored = localStorage.getItem("pandoras_ip_tasks_30d");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_TASKS;
  });
  useEffect(() => {
    try {
      localStorage.setItem("pandoras_ip_tasks_30d", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  const validRoles: EcosystemTourRole[] = ["SUPER_ADMIN", "ADMIN", "MARKETING", "VIEWER"];
  const tourRole: EcosystemTourRole = validRoles.includes(role as EcosystemTourRole)
    ? (role as EcosystemTourRole)
    : "VIEWER";

  // Visibilidad DINÁMICA de secciones y enlaces según capabilities del actor.
  // Las capabilities se resuelven server-side (rol base + overrides por
  // colaborador persistidos en BD, editables desde Settings → Permissions Drawer).
  // Nota: institutionalBooks está hard-locked a SUPER_ADMIN por el security guard.
  const hasCap = (cap?: string | string[]) => {
    if (!cap) return true;
    const perms = (auth.permissions ?? {}) as unknown as Record<string, boolean | undefined>;
    return (Array.isArray(cap) ? cap : [cap]).some((c) => Boolean(perms[c]));
  };
  const visibleSections = SECTIONS.filter((s) => hasCap(s.cap));
  const sectionLinks = (sec: NexusSection) =>
    sec.links.filter((l) => {
      if (l.superAdminOnly && auth.role !== "SUPER_ADMIN") return false;
      return hasCap(l.cap);
    });

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
      // Consumir el flag inmediatamente: así el welcome + onboarding aparecen
      // únicamente la 1era vez del auth/login, aunque cierres el flujo a medias.
      const isFirstVisit = (() => {
        try {
          return typeof window !== "undefined" && localStorage.getItem(welcomeKey) !== "true";
        } catch {
          return false;
        }
      })();
      if (isFirstVisit) {
        try {
          localStorage.setItem(welcomeKey, "true");
        } catch {
          /* noop */
        }
      }
      setShowWelcomePanel(isFirstVisit);
      // Desde la 2da visita el sidebar entra oculto; solo el flujo de iniciación
      // (1era visita) o un tour explícito (?tour=ecosystem) lo abrirá.
      setShowGuideSidebar(isFirstVisit || isFirstVisitParam);
    }

    return () => {};
  }, [auth.email, isFirstVisitParam]);

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
    <div className="relative w-full h-screen overflow-hidden bg-[#050508] text-white selection:bg-amber-500/30 flex flex-col">
      
      {/* ── AMBIENT GLOW + GRID (Atmósfera Obsidian Institucional) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 left-1/4 w-[45vw] h-[45vw] bg-purple-600/[0.04] rounded-full blur-[140px] mix-blend-screen" />
        <div className="absolute -bottom-1/4 right-1/4 w-[35vw] h-[35vw] bg-amber-500/[0.03] rounded-full blur-[130px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(120,50,255,0.03),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_60%,transparent_100%)] opacity-70" />
      </div>

      {/* ── SIDEBAR OVERLAY / GUIDE ── */}
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
            <Link
              href="/nexus/settings"
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-800/50 text-zinc-300 text-[10px] tracking-wider hover:bg-zinc-700 hover:text-white transition-colors"
              title="Configuración"
            >
              <Settings className="w-3 h-3 text-zinc-400" />
              SETTINGS
            </Link>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('pandoras_nexus_token');
                  document.cookie = 'pandoras_nexus_token=; path=/; max-age=0; SameSite=Lax';
                } catch {}
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
          sidebarOpen ? "left-80" : "left-0"
        }`}
      >
        <button 
          onClick={() => setShowGuideSidebar(!showGuideSidebar)}
          className={`h-24 w-6 bg-[#07070A]/90 backdrop-blur-md border border-white/[0.12] flex items-center justify-center hover:bg-white/10 hover:border-amber-500/50 transition-all shadow-xl group rounded-r-xl border-l-0`}
          title="Toggle Sidebar"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />
          )}
        </button>
      </div>

      {/* ── TOP COMMAND BAR / NAVBAR ── */}
      <header className="h-12 shrink-0 relative z-20 flex items-center justify-between px-4 md:px-6 bg-[#07070B] border-b border-white/[0.08] font-mono">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-purple-500/30 bg-purple-500/10">
              <span className="text-purple-300 text-[10px] tracking-widest">NEXUS</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </span>
              LIVE INDEX
            </span>
          </div>
          <div className="hidden md:flex items-center gap-3 text-[10px] text-zinc-500 truncate">
            <span className="text-zinc-500/40">•</span>
            <span>5 Domains</span>
            <span className="text-zinc-500/40">•</span>
            <span>40 Destinations</span>
            <span className="text-zinc-500/40">•</span>
            <span>Engine: Nexus v1.0</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-white/10 bg-black/40 text-zinc-400 text-[10px]">
            <Activity className="w-3 h-3 text-purple-300" />
            UNIFIED INDEX
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsOpsModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] tracking-wider hover:bg-purple-500/20 transition-colors"
            >
              <TerminalSquare className="w-3 h-3" />
              OPERATIONS HUB
            </button>
            <Link
              href="/nexus/rooms"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] tracking-wider hover:bg-amber-500/20 transition-colors"
            >
              <Handshake className="w-3 h-3" />
              DEAL ROOM
            </Link>
            {(role === 'SUPER_ADMIN' || role === 'ADMIN') && (
              <Link
                href="/nexus/developers"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-sky-500/30 bg-sky-500/10 text-sky-300 text-[10px] tracking-wider hover:bg-sky-500/20 transition-colors"
              >
                <Code2 className="w-3 h-3" />
                DEVELOPER HUB
              </Link>
            )}
            <Link
              href="/admin/academy"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] tracking-wider hover:bg-purple-500/20 transition-colors"
            >
              <GraduationCap className="w-3 h-3" />
              ACADEMY
            </Link>
          </div>
        </div>
      </header>

      {/* ── BODY: HUB GRID + TASKS PANEL ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">
      <main className={`flex-1 relative z-10 transition-all duration-500 p-4 md:p-6 lg:p-8 overflow-y-auto ${sidebarOpen ? "pl-96" : "pl-12 md:pl-16"}`}>
        <div className="h-full w-full flex flex-col">
          <AnimatePresence>
            {!activeSection && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr gap-4 md:gap-5 h-full"
              >
                {visibleSections.map((sec, i) => {
                  const linksForRole = sectionLinks(sec);
                  return (
                  <motion.div
                    layoutId={`card-${sec.id}`}
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`group relative overflow-hidden rounded-3xl border ${sec.border} bg-[#0A0A0E]/90 backdrop-blur-md p-6 md:p-7 flex flex-col justify-between min-h-[280px] md:min-h-[340px] xl:min-h-0 cursor-pointer transition-all hover:scale-[1.015] hover:shadow-2xl hover:shadow-black/70 hover:border-white/25`}
                  >
                    {/* glow de color (identidad oscura vieja) */}
                    <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${sec.color} opacity-25 blur-[90px] pointer-events-none transition-opacity duration-500 group-hover:opacity-40`} />
                    {/* drawer handle */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-14 h-1.5 rounded-full bg-white/10 group-hover:bg-white/30 transition-colors" />
                    <span className={`absolute top-4 right-5 font-mono text-xs tracking-widest ${sec.text} opacity-70`}>
                      0{i + 1}
                    </span>
                    <div className="relative pt-3 flex items-start justify-between">
                      <div className={`p-3.5 rounded-2xl ${sec.bgAccent} ring-1 ring-white/5`}>
                        <sec.icon className={`w-7 h-7 ${sec.text}`} />
                      </div>
                      <ChevronRight className={`w-5 h-5 ${sec.text} opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0`} />
                    </div>
                    <div className="relative mt-auto pt-6 space-y-2">
                      <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{sec.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{sec.description}</p>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium mt-2 rounded-full px-3 py-1 bg-white/5 border border-white/10 text-zinc-300 group-hover:text-white group-hover:border-white/20 transition-colors">
                        {linksForRole.length} módulos <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── DRAWER BACKDROP ── */}
          <AnimatePresence>
            {activeSection && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveSection(null)}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {activeSection && (
              <motion.div 
                key={`drawer-${activeSection}`}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="fixed inset-y-0 right-0 z-50 w-full sm:w-[620px] lg:w-[720px] bg-[#07070A]/95 backdrop-blur-2xl border-l border-white/[0.08] overflow-y-auto custom-scrollbar"
              >
                {visibleSections.filter(s => s.id === activeSection).map(sec => (
                  <div key={sec.id} className="relative min-h-full flex flex-col">
                    <div className={`absolute inset-0 bg-gradient-to-br ${sec.color} opacity-40 pointer-events-none`} />

                    <div className="relative z-10 p-8 md:p-10 lg:p-12 flex flex-col flex-1">
                      {/* Close */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-zinc-400">
                          Command Center <span className={`mx-2 ${sec.text}`}>/</span> {sec.title.toUpperCase()}
                        </span>
                        <button 
                          onClick={() => setActiveSection(null)}
                          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                          aria-label="Cerrar drawer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Header morfado desde la card (efecto drawer) */}
                      <motion.div
                        layoutId={`card-${sec.id}`}
                        className={`relative overflow-hidden rounded-3xl border ${sec.border} bg-gradient-to-br ${sec.color} p-6 md:p-7`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-2xl ${sec.bgAccent} ring-1 ring-white/5`}>
                            <sec.icon className={`w-9 h-9 ${sec.text}`} />
                          </div>
                          <div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{sec.title}</h2>
                            <p className="text-zinc-300/90 mt-1 text-sm md:text-base leading-relaxed">{sec.description}</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Todos los módulos / enlaces en grande */}
                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sectionLinks(sec).map((link, idx) => (
                          <Link 
                            key={idx} 
                            href={link.href}
                            target={link.external ? "_blank" : "_self"}
                            className={`group flex items-center justify-between gap-4 p-5 rounded-2xl border ${sec.border} bg-black/40 hover:bg-white/[0.06] transition-all`}
                          >
                            <div className="min-w-0">
                              <div className="text-base font-semibold text-white group-hover:text-amber-200 transition-colors leading-snug">
                                {link.label}
                              </div>
                              {link.note && (
                                <div className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{link.note}</div>
                              )}
                            </div>
                            {link.external ? (
                              <ExternalLink className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                            )}
                          </Link>
                        ))}
                      </div>

                      <button
                        onClick={() => setActiveSection(null)}
                        className="mt-8 w-full py-3.5 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-zinc-300 hover:text-white text-sm font-semibold transition-colors"
                      >
                        ← Volver al Command Center
                      </button>
                    </div>
                  </div>
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

        {/* Right-docked tasks panel (old view chrome) */}
        <TasksPanel tasks={tasks} setTasks={setTasks} role={role ?? undefined} />
      </div>

      {/* ── BOTTOM STATUS BAR / FOOTBAR ── */}
      <footer className="h-9 shrink-0 relative z-20 flex items-center justify-between px-4 md:px-6 bg-[#07070B] border-t border-white/[0.08] font-mono text-[10px] text-zinc-500">
        <span className="truncate">UNIFIED INDEX · PANDORAS GROWTH OS & PLATFORM ECOSYSTEM</span>
        <span className="hidden sm:flex items-center gap-3 shrink-0">
          <span>NEXUS v2.5</span>
          <span className="text-zinc-500/40">•</span>
          <span className="text-purple-300/80">5 CATEGORIES</span>
          <span className="text-zinc-500/40">•</span>
          <span className="text-amber-300/80">DEAL ROOM ONLINE</span>
          <span className="text-zinc-500/40">•</span>
          <span>OPS HUB ONLINE</span>
        </span>
      </footer>

      <HermesFloatingGuide
        role={tourRole}
        operatorContext={auth.name && auth.email ? { name: auth.name, email: auth.email, role: tourRole } : null}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        customStations={customStations}
      />

      <OperationsHubModal
        isOpen={isOpsModalOpen}
        onClose={() => setIsOpsModalOpen(false)}
        tasks={tasks}
        setTasks={setTasks}
        userName={auth.name ?? undefined}
        userEmail={auth.email ?? undefined}
        userRole={role ?? undefined}
      />
    </div>
  );
}

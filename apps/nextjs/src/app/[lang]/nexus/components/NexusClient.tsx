"use client";

import React, { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import {
  Network,
  Rocket,
  BookOpen,
  Shield,
  Cpu,
  ArrowUpRight,
  ChevronRight,
  Activity,
  TerminalSquare,
  Handshake,
  Landmark,
  GraduationCap,
  Settings,
} from "lucide-react";
import { OperationsHubModal } from "./OperationsHubModal";
import TasksPanel from "./TasksPanel";
import { INITIAL_TASKS, TaskItem } from "./taskTypes";

const TASKS_STORAGE_KEY = "pandoras_ip_tasks_30d";

interface NexusLink {
  name: string;
  path: string;
}

interface Category {
  id: string;
  title: string;
  code: string;
  icon: React.ReactNode;
  accent: {
    chip: string;
    icon: string;
    cardHover: string;
    linkHover: string;
    arrow: string;
  };
  links: NexusLink[];
}

const categories: Category[] = [
  {
    id: "protocol",
    title: "Core Protocol",
    code: "CORE",
    icon: <Network className="w-4 h-4" />,
    accent: {
      chip: "border-blue-500/20 bg-blue-500/10 text-blue-300",
      icon: "text-blue-300",
      cardHover: "hover:border-blue-500/40",
      linkHover: "hover:bg-blue-500/5",
      arrow: "text-blue-400",
    },
    links: [
      { name: "Protocol Overview", path: "https://dash.pandoras.finance/protocol" },
      { name: "Utility Protocol", path: "https://dash.pandoras.finance/utility-protocol" },
      { name: "Protocol Story", path: "https://dash.pandoras.finance/protocol-story" },
      { name: "Litepaper", path: "https://dash.pandoras.finance/litepaper" },
      { name: "Whitepaper", path: "https://dash.pandoras.finance/whitepaper" },
      { name: "Roadmap", path: "https://dash.pandoras.finance/roadmap" },
    ],
  },
  {
    id: "growth",
    title: "Growth & Platform Infrastructure",
    code: "GROWTH",
    icon: <Rocket className="w-4 h-4" />,
    accent: {
      chip: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
      icon: "text-emerald-300",
      cardHover: "hover:border-emerald-500/40",
      linkHover: "hover:bg-emerald-500/5",
      arrow: "text-emerald-400",
    },
    links: [
      { name: "Growth OS (Ecosystem Portal)", path: "https://dash.pandoras.finance/growth-os" },
      { name: "Pandora's Academy (Certificaciones)", path: "https://dash.pandoras.finance/admin/academy" },
      { name: "Hermes AI Platform (AI-OS)", path: "https://dash.pandoras.finance/growth-os/hermes" },
      { name: "Pandora's Media Co (Demand Engine)", path: "https://dash.pandoras.finance/media" },
      { name: "Pandora's Media Co (Dashboard)", path: "https://media.pandoras.finance" },
      { name: "Asset Capitalization", path: "https://dash.pandoras.finance/asset-capitalization" },
      { name: "Ambassadors", path: "https://dash.pandoras.finance/ambassadors" },
      { name: "Founders", path: "https://dash.pandoras.finance/founders" },
      { name: "Bitcoin Initiative", path: "https://dash.pandoras.finance/bitcoin-initiative" },
      { name: "Events", path: "https://dash.pandoras.finance/events" },
      { name: "Apply", path: "https://dash.pandoras.finance/apply" },
      { name: "Join", path: "https://dash.pandoras.finance/join" },
      { name: "Waitlist Success", path: "https://dash.pandoras.finance/waitlist-success" },
    ],
  },
  {
    id: "access",
    title: "Platform & Access",
    code: "ACCESS",
    icon: <Shield className="w-4 h-4" />,
    accent: {
      chip: "border-orange-500/20 bg-orange-500/10 text-orange-300",
      icon: "text-orange-300",
      cardHover: "hover:border-orange-500/40",
      linkHover: "hover:bg-orange-500/5",
      arrow: "text-orange-400",
    },
    links: [
      { name: "Login / Start", path: "https://dash.pandoras.finance/access" },
      { name: "App Dashboard", path: "https://dash.pandoras.finance/dashboard" },
      { name: "User Profile", path: "https://dash.pandoras.finance/dashboard/profile" },
      { name: "Business Profile", path: "https://dash.pandoras.finance/dashboard/profile/projects" },
      { name: "Main Home", path: "/" },
    ],
  },
  {
    id: "resources",
    title: "Resources & Institutional Books",
    code: "DOCS",
    icon: <BookOpen className="w-4 h-4" />,
    accent: {
      chip: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
      icon: "text-zinc-300",
      cardHover: "hover:border-zinc-500/40",
      linkHover: "hover:bg-white/5",
      arrow: "text-zinc-400",
    },
    links: [
      { name: "Pandoras Institutional Framework (Libros 0–VIII)", path: "/libros" },
      { name: "IOM System & Architecture (5 Layers)", path: "/libros/constitucion" },
      { name: "Pandoras Asset Standard (PAS v1.0)", path: "/libros/libro-iv" },
      { name: "Licensing Framework (Libro V)", path: "/libros/libro-v" },
      { name: "Tech Platform & Capital Engine (Libro VI)", path: "/libros/libro-vi" },
      { name: "Hermes Agent OS & Kernel Architecture (Libro IX)", path: "/libros/libro-ix" },
      { name: "Growth & Expansion Roadmap (Libro VII)", path: "/libros/libro-vii" },
      { name: "Institutional Doctrine (Libro VIII)", path: "/libros/libro-viii" },
      { name: "Institutional Execution Manual", path: "/libros" },
      { name: "Institutional Book", path: "/institutional-book" },
    ],
  },
  {
    id: "hermes",
    title: "Hermes Cognitive OS",
    code: "HERMES",
    icon: <Cpu className="w-4 h-4" />,
    accent: {
      chip: "border-purple-500/20 bg-purple-500/10 text-purple-300",
      icon: "text-purple-300",
      cardHover: "hover:border-purple-500/40",
      linkHover: "hover:bg-purple-500/5",
      arrow: "text-purple-400",
    },
    links: [
      { name: "Vision", path: "/libros/libro-ix#vision" },
      { name: "Constitution (ADRs 000-011)", path: "https://github.com/Pandoras/dApps/tree/main/saaspandoras/apps/dashboard/docs/adr" },
      { name: "Architecture", path: "/libros/libro-ix#architecture" },
      { name: "Contracts", path: "/libros/libro-ix#contracts" },
      { name: "SDK", path: "/libros/libro-ix#sdk" },
      { name: "APIs", path: "/libros/libro-ix#apis" },
      { name: "Tutorials", path: "/libros/libro-ix#tutorials" },
      { name: "Examples", path: "/libros/libro-ix#examples" },
    ],
  },
];

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 18 },
  },
};

export default function NexusClient() {
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_TASKS;
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return INITIAL_TASKS;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#08080A] text-zinc-100 font-sans">
      <OperationsHubModal
        isOpen={isIpModalOpen}
        onClose={() => setIsIpModalOpen(false)}
        tasks={tasks}
        setTasks={setTasks}
      />

      {/* Ambient background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 left-1/4 w-[45vw] h-[45vw] bg-purple-500/[0.04] rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute -bottom-1/4 right-1/4 w-[35vw] h-[35vw] bg-blue-500/[0.04] rounded-full blur-[110px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Top command bar */}
        <header className="h-12 shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#0C0C10] border-b border-white/10 font-mono">
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
                onClick={() => setIsIpModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] tracking-wider hover:bg-purple-500/20 transition-colors"
              >
                <TerminalSquare className="w-3 h-3" />
                OPERATIONS HUB
              </button>
              <a
                href="https://dash.pandoras.finance/nexus/rooms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] tracking-wider hover:bg-amber-500/20 transition-colors"
              >
                <Handshake className="w-3 h-3" />
                DEAL ROOM
              </a>
              <a
                href="https://dash.pandoras.finance/admin/academy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] tracking-wider hover:bg-purple-500/20 transition-colors"
              >
                <GraduationCap className="w-3 h-3" />
                ACADEMY
              </a>
              <a
                href="https://dash.pandoras.finance/nexus/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-700 bg-zinc-800/50 text-zinc-300 text-[10px] tracking-wider hover:bg-zinc-700 transition-colors"
                title="Configuración y Gestión de Colaboradores"
              >
                <Settings className="w-3 h-3 text-zinc-400" />
                SETTINGS
              </a>
            </div>
          </div>
        </header>

        {/* Scrollable bento area + tasks panel */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5">
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            >
            {categories.map((cat) => (
              <motion.section
                key={cat.id}
                variants={cardVariants}
                className={`flex flex-col rounded-2xl border border-white/10 bg-[#0C0C10] p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.06)] ${cat.accent.cardHover} ${
                  cat.id === "growth" || cat.id === "resources"
                    ? "md:col-span-2"
                    : cat.id === "access"
                      ? "md:col-span-1"
                      : cat.id === "hermes"
                        ? "md:col-span-1"
                        : ""
                }`}
              >
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg border ${cat.accent.chip} shrink-0`}>
                      {cat.icon}
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-zinc-100 truncate tracking-tight">{cat.title}</h2>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{cat.code} · {cat.links.length} LINK{cat.links.length !== 1 ? "S" : ""}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
                </div>

                <div className="flex flex-col gap-0.5 flex-1">
                  {cat.links.map((link, idx) => {
                    const external = link.path.startsWith("http");
                    return (
                      <a
                        key={idx}
                        href={link.path}
                        target={external ? "_blank" : "_self"}
                        rel={external ? "noopener noreferrer" : undefined}
                        className={`group/link flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-zinc-400 hover:text-zinc-100 ${cat.accent.linkHover} transition-colors duration-150`}
                      >
                        <span className="truncate">
                          <span className="text-zinc-600 mr-2">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                          {link.name}
                        </span>
                        {external ? (
                          <ArrowUpRight className={`w-3 h-3 opacity-0 group-hover/link:opacity-100 ${cat.accent.arrow} shrink-0 transition-opacity`} />
                        ) : (
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 text-zinc-300 shrink-0 transition-opacity" />
                        )}
                      </a>
                    );
                  })}
                </div>
              </motion.section>
            ))}
            </motion.div>

            {/* Nivel 2 — Transaction Rooms / Deal Room */}
            <motion.section
              variants={cardVariants}
              className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#0C0C10] to-amber-500/[0.04] p-5 transition-all duration-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.06)] hover:border-amber-500/40"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 shrink-0">
                  <Landmark className="w-4 h-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-100 tracking-tight truncate">Transaction Rooms · Institutional Deal Layer</h2>
                    <span className="px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[9px] font-mono tracking-widest whitespace-nowrap">NIVEL 2</span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate">
                    PROPOSAL · ROLE · COMPENSATION · DOCUMENTS · AGREEMENT · SIGNATURE · AUDIT
                  </p>
                </div>
              </div>
              <a
                href="https://dash.pandoras.finance/nexus/rooms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-mono tracking-wider hover:bg-amber-500/20 transition-colors shrink-0"
              >
                <Handshake className="w-3.5 h-3.5" />
                ABRIR DEAL ROOM
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </motion.section>
            <p className="mt-2 text-[10px] text-zinc-600 font-mono px-1">
              Nivel 2 del Nexus: salas de transacción privadas por relación (ej. Eduardo Garza) con propuesta, rol, compensación, documentos confidenciales, acuerdo, enmiendas y firma — con audit trail inmutable. El Nivel 1 (Data Room institucional) permanece intacto.
            </p>
          </div>
          <TasksPanel tasks={tasks} setTasks={setTasks} />
        </div>

        {/* Bottom status bar */}
        <footer className="h-9 shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#0C0C10] border-t border-white/10 font-mono text-[10px] text-zinc-500">
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
      </div>
    </div>
  );
}

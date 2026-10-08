"use client";

import React, { useState } from "react";
import { 
  Boxes, TrendingUp, BookOpen, Server, BrainCircuit, Key, 
  ChevronRight, X, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { NexusAuthContext } from "@saasfly/shared";

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
    id: "operations",
    title: "Operations Hub",
    description: "Sovereign execution, Deal Rooms, transaction rooms & on-chain primitives.",
    icon: Boxes,
    color: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/30",
    text: "text-blue-400",
    bgAccent: "bg-blue-500/10",
    cap: "nexus.manage",
    links: [
      { label: "Deal Room & Transaction Rooms", note: "Redacción, revisión y firma de propuestas y acuerdos institucionales.", href: "/nexus/rooms" },
      { label: "Institutional Data Room", note: "Due diligence y compliance institucional.", href: "https://pandoras.finance/institutional-book", external: true },
      { label: "Books Vault Constitucional", note: "Constitución y Libros Fundacionales I-IX con doble capa criptográfica.", href: "https://pandoras.finance/libros/constitucion", external: true },
      { label: "Onboarding Unificado", note: "Wizard de provisioning de operadores.", href: "/onboarding" },
    ]
  },
  {
    id: "clients",
    title: "Clients & Growth",
    description: "Marketing, funnels, portales institucionales y retención de clientes.",
    icon: TrendingUp,
    color: "from-emerald-500/20 to-emerald-600/5",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
    cap: ["growth.manage", "marketing.manage"],
    links: [
      { label: "Growth OS (Ecosystem Portal)", note: "Portal del ecosistema.", href: "/growth-os" },
      { label: "Marketing Leads & Flow", note: "Campañas, funnels y leads comerciales.", href: "/admin/marketing", cap: "marketing.manage" },
      { label: "Pandora's Media Co (Demand Engine)", note: "Motor de demanda mediática.", href: "/media" },
      { label: "Pandora's Media Co (Dashboard)", note: "Consola de la media company.", href: "https://media.pandoras.finance", external: true },
      { label: "Tenant Portal (Preview)", note: "Experiencia in-portal interactiva.", href: "/portal", cap: "nexus.manage" },
      { label: "Retail End-User Portal", note: "Frontend B2C de consumo.", href: "https://app.pandoras.finance", external: true },
      { label: "Waitlist Success", note: "Post-registro waitlist.", href: "/waitlist-success" },
      { label: "Join", note: "Únete al ecosistema.", href: "/join" },
    ]
  },
  {
    id: "knowledge",
    title: "Knowledge & Education",
    description: "Pandoras Academy, blueprints, certificaciones y currículum institucional.",
    icon: BookOpen,
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/30",
    text: "text-purple-400",
    bgAccent: "bg-purple-500/10",
    cap: "institutionalBooks",
    links: [
      { label: "Pitch Decks & Presentations", note: "Institutional Agent OS Pitch (Coming Soon Engine)", href: "/pitch/institutional-os" },
      { label: "Academy & Leadership Curriculum", note: "Alumnos, curriculum COO/CFO y emisión de blueprints de certificación.", href: process.env.NODE_ENV === 'development' ? 'http://academy.localhost:3000/console' : 'https://academy.pandoras.finance/console', external: true },
      { label: "Pandoras Institutional Framework (Libros 0–VIII)", note: "Cuerpo documental institucional.", href: "https://pandoras.finance/libros", external: true },
      { label: "IOM System & Architecture (5 Layers)", note: "Sistema operativo institucional.", href: "https://pandoras.finance/libros/constitucion", external: true },
      { label: "Pandoras Asset Standard (PAS v1.0)", note: "Estándar de activos, Libro IV.", href: "https://pandoras.finance/libros/libro-iv", external: true },
      { label: "Licensing Framework (Libro V)", note: "Frame de licenciamiento.", href: "https://pandoras.finance/libros/libro-v", external: true },
      { label: "Tech Platform & Capital Engine (Libro VI)", note: "Plataforma tecnológica y capital.", href: "https://pandoras.finance/libros/libro-vi", external: true },
      { label: "Growth & Expansion Roadmap (Libro VII)", note: "Roadmap de crecimiento.", href: "https://pandoras.finance/libros/libro-vii", external: true },
      { label: "Institutional Doctrine (Libro VIII)", note: "Doctrina institucional.", href: "https://pandoras.finance/libros/libro-viii", external: true },
    ]
  },
  {
    id: "systems",
    title: "Systems & Architecture",
    description: "Developer hub, SDKs, integraciones y whitepapers técnicos.",
    icon: Server,
    color: "from-cyan-500/20 to-cyan-600/5",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    bgAccent: "bg-cyan-500/10",
    cap: "ecosystem",
    links: [
      { label: "Developer Hub & SDK", note: "API keys, webhooks y herramientas para desarrolladores del ecosistema.", href: "/nexus/developers", cap: "nexus.manage" },
      { label: "Protocol Overview", note: "Visión del protocolo y sus capas.", href: "/protocol" },
      { label: "Utility Protocol", note: "Capa utilitaria del ecosistema.", href: "/utility-protocol" },
      { label: "Protocol Story", note: "Historia y evolución del protocolo.", href: "/protocol-story" },
      { label: "Asset Capitalization", note: "Capitalización de activos.", href: "/asset-capitalization" },
      { label: "Bitcoin Initiative", note: "Capa BTC del ecosistema.", href: "/bitcoin-initiative" },
      { label: "Events", note: "Eventos y activaciones.", href: "/events" },
      { label: "Ambassadors", note: "Programa de embajadores.", href: "/ambassadors" },
      { label: "Founders", note: "Programa de founders.", href: "/founders" },
      { label: "Litepaper", note: "Resumen ejecutivo e institucional.", href: "/litepaper" },
      { label: "Whitepaper", note: "Documento técnico completo.", href: "/whitepaper" },
    ]
  },
  {
    id: "knowledge",
    title: "Knowledge & Education",
    description: "Pandoras Academy, blueprints, certificaciones y currículum institucional.",
    icon: BookOpen,
    color: "from-purple-500/20 to-purple-600/5",
    border: "border-purple-500/30",
    text: "text-purple-400",
    bgAccent: "bg-purple-500/10",
    links: [
      { label: "Academy & Leadership Curriculum", note: "Alumnos, curriculum COO/CFO y emisión de blueprints de certificación.", href: "/admin/academy" },
      { label: "Pandoras Institutional Framework (Libros 0-VIII)", note: "Cuerpo documental institucional.", href: "https://pandoras.finance/libros", external: true, superAdminOnly: true },
      { label: "IOM System & Architecture (5 Layers)", note: "Sistema operativo institucional.", href: "https://pandoras.finance/iom", external: true, superAdminOnly: true },
      { label: "Pandoras Asset Standard (PAS v1.0)", note: "Estándar de activos, Libro IV.", href: "https://pandoras.finance/libros/libro-iv", external: true, cap: "users.manage" },
      { label: "Licensing Framework (Libro V)", note: "Frame de licenciamiento.", href: "https://pandoras.finance/libros/libro-v", external: true, cap: "users.manage" },
      { label: "Tech Platform & Capital Engine (Libro VI)", note: "Plataforma tecnológica y capital.", href: "https://pandoras.finance/libros/libro-vi", external: true, superAdminOnly: true },
      { label: "Growth & Expansion Roadmap (Libro VII)", note: "Roadmap de crecimiento.", href: "https://pandoras.finance/libros/libro-vii", external: true, superAdminOnly: true },
      { label: "Institutional Doctrine (Libro VIII)", note: "Doctrina institucional.", href: "https://pandoras.finance/libros/libro-viii", external: true, superAdminOnly: true },
    ]
  },
  {
    id: "hermes",
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
      { label: "Cognitive Hub & Agents", note: "Orquestación de agentes Hermes en Growth OS.", href: "/growth-os/hermes" },
      { label: "Hermes Agent OS & Kernel Architecture (Libro IX)", note: "Arquitectura del kernel Hermes.", href: "https://pandoras.finance/libros/libro-ix", external: true },
    ]
  },
  {
    id: "admin",
    title: "Platform Admin & Access",
    description: "RBAC, identity, colaboradores y aprobaciones de acceso.",
    icon: Key,
    color: "from-amber-500/20 to-amber-600/5",
    border: "border-amber-500/30",
    text: "text-amber-400",
    bgAccent: "bg-amber-500/10",
    cap: "users.manage",
    links: [
      { label: "HQ Platform Governance", note: "Consola admin, accounting y tenant lens.", href: "/admin", cap: "users.manage" },
      { label: "Collaborators & Aprobaciones", note: "Aprobar accesos PENDING y gestionar colaboradores.", href: "/admin/collaborators", cap: "users.manage" },
      { label: "Usuarios & Identidad", note: "Directorio de usuarios del ecosistema.", href: "/admin/users", cap: "users.manage" },
      { label: "Hermes QA & Prompt Studio", note: "Simulación de respuestas y auditoría de seguridad.", href: "/admin/hermes", cap: "users.manage" },
      { label: "Access / Login", note: "Acceso al ecosistema.", href: "/access" },
    ]
  }
];

export function UnifiedIndexModal({ 
  auth, 
  onClose 
}: { 
  auth: NexusAuthContext; 
  onClose: () => void;
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

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

  const activeSecObj = SECTIONS.find((s) => s.id === activeSection);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "tween", duration: 0.25 }}
      className="flex-1 w-full h-full overflow-y-auto custom-scrollbar flex flex-col p-6 md:p-12 relative z-10"
    >
      {/* Removido el botón de Volver al Command Center como solicitado */}

      <div className="w-full flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {!activeSection ? (
            <motion.div 
              key="grid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto"
            >
              {visibleSections.map((sec, i) => {
                const linksForRole = sectionLinks(sec);
                return (
                  <motion.div
                    layoutId={`card-${sec.id}`}
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`group relative overflow-hidden rounded-3xl border ${sec.border} bg-[#0A0A0E]/90 backdrop-blur-md p-6 md:p-8 flex flex-col justify-between cursor-pointer transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/70 hover:border-white/25`}
                  >
                    <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br ${sec.color} opacity-25 blur-[90px] pointer-events-none transition-opacity duration-500 group-hover:opacity-40`} />
                    <span className={`absolute top-5 right-6 font-mono text-xs tracking-widest ${sec.text} opacity-70`}>
                      0{i + 1}
                    </span>
                    <div className="relative flex items-start justify-between">
                      <div className={`p-4 rounded-2xl ${sec.bgAccent} ring-1 ring-white/5`}>
                        <sec.icon className={`w-8 h-8 ${sec.text}`} />
                      </div>
                    </div>
                    <div className="relative mt-12 space-y-3">
                      <h3 className="text-2xl font-bold text-white tracking-tight">{sec.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{sec.description}</p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium mt-3 rounded-full px-4 py-1.5 bg-white/5 border border-white/10 text-zinc-300 group-hover:text-white group-hover:border-white/20 transition-colors">
                        {linksForRole.length} módulos <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <>
              {/* DRAWER BACKDROP */}
              <motion.div
                key="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveSection(null)}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              />
              
              {/* DRAWER CONTENT */}
              <motion.div 
                key={`drawer-${activeSection}`}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="fixed inset-y-0 right-0 z-50 w-full sm:w-[620px] lg:w-[720px] bg-[#07070A]/95 backdrop-blur-2xl border-l border-white/[0.08] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
              >
                {activeSecObj && (
                  <div className="relative min-h-full flex flex-col">
                    <div className={`absolute inset-0 bg-gradient-to-br ${activeSecObj.color} opacity-40 pointer-events-none`} />

                    <div className="relative z-10 p-8 md:p-10 lg:p-12 flex flex-col flex-1">
                      {/* Close & Breadcrumbs */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-zinc-400">
                          Command Center <span className={`mx-2 ${activeSecObj.text}`}>/</span> {activeSecObj.title.toUpperCase()}
                        </span>
                        <button 
                          onClick={() => setActiveSection(null)}
                          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                          aria-label="Cerrar drawer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Header morphed from card (drawer effect) */}
                      <motion.div
                        layoutId={`card-${activeSecObj.id}`}
                        className={`relative overflow-hidden rounded-3xl border ${activeSecObj.border} bg-gradient-to-br ${activeSecObj.color} p-6 md:p-7`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-4 rounded-2xl ${activeSecObj.bgAccent} ring-1 ring-white/5`}>
                            <activeSecObj.icon className={`w-9 h-9 ${activeSecObj.text}`} />
                          </div>
                          <div>
                            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{activeSecObj.title}</h2>
                            <p className="text-zinc-300/90 mt-1 text-sm md:text-base leading-relaxed">{activeSecObj.description}</p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Todos los módulos / enlaces en grande */}
                      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sectionLinks(activeSecObj).map((link, idx) => {
                          return (
                            <Link 
                              key={idx} 
                              href={link.href}
                              target={link.external ? "_blank" : "_self"}
                              className={`w-full text-left group flex items-center justify-between gap-4 p-5 rounded-2xl border ${activeSecObj.border} bg-black/40 hover:bg-white/[0.06] transition-all`}
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
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

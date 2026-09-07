"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Handshake,
  GraduationCap,
  Settings,
  Bot,
  Layers,
  Lock,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Globe,
  FileText,
  Activity,
  UserCheck,
  Database,
  Terminal,
  LogOut,
  Compass,
  Sparkles,
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
  const { role, permissions, wallet, email, name } = auth;
  const [isTourOpen, setIsTourOpen] = React.useState(
    initialTour === "ecosystem" || initialTour === "onboarding"
  );
  const [showLegacyConsole, setShowLegacyConsole] = React.useState(false);
  const isSuperAdmin = role === "SUPER_ADMIN";

  const validRoles: EcosystemTourRole[] = ["SUPER_ADMIN", "ADMIN", "MARKETING", "VIEWER"];
  // FIX: Strict RBAC - Never trust initialRole for security boundaries
  const tourRole: EcosystemTourRole = validRoles.includes(role as EcosystemTourRole)
    ? (role as EcosystemTourRole)
    : "VIEWER";

  // FIX: Load Admin Customizations from localStorage so they affect production
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wide shadow-lg shadow-amber-500/10">
            👑 SUPER ADMIN (SOVEREIGN OWNER)
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold tracking-wide">
            🛡️ ADMIN
          </span>
        );
      case "MARKETING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-mono font-bold tracking-wide">
            ⚙️ MARKETING / OPERADOR
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold tracking-wide">
            👥 VIEWER
          </span>
        );
    }
  };

  const applications: Array<{
    id: string;
    title: string;
    description: string;
    icon: any;
    href: string;
    allowed: boolean;
    color: string;
    requirementText: string;
    onClick?: (e: any) => void;
    isDoubleLayer?: boolean;
  }> = [
    {
      id: "deal_room",
      title: "Deal Room & Transaction Rooms",
      description: "Redacción, revisión y firma notarizada de propuestas, contratos, acuerdos y NDAs institucionales.",
      icon: Handshake,
      href: "/nexus/rooms", 
      allowed: ["SUPER_ADMIN", "ADMIN", "MARKETING"].includes(tourRole), 
      color: "amber",
      requirementText: "Activo para Operadores y Admins",
    },
    {
      id: "academy_admin",
      title: "Academy Control Plane",
      description: "Gestión de alumnos, evaluación de currículum de liderazgo (COO/CFO) y emisión de blueprints de certificación.",
      icon: GraduationCap,
      href: "/admin/academy",
      allowed: permissions['nexus.manage'],
      color: "violet",
      requirementText: "Requiere Rol Manager o Permiso Específico",
    },
    {
      id: "nexus_settings",
      title: "Nexus Settings & Roles (RBAC)",
      description: "Administración de colaboradores, asignación de roles base y configuración de permisos mediante Drawer interactivo.",
      icon: Settings,
      href: "/nexus/settings",
      allowed: permissions['nexus.manage'],
      color: "blue",
      requirementText: "Exclusivo para Administradores",
    },
    {
      id: "hermes_qa",
      title: "Hermes QA & Prompt Studio",
      description: "Suite de pruebas conversacionales, evaluación de inferencias LLM, simulación de respuestas y auditoría de seguridad.",
      icon: Bot,
      href: "/admin/hermes", // updated href to fix 404
      allowed: permissions['tenants.manage'],
      color: "emerald",
      requirementText: "Requiere Rol Manager o Permiso Específico",
    },
    {
      id: "sovereign_mesh",
      title: "Sovereign Mesh Hub & Ecosistema",
      description: "Centro neurálgico que interconecta la inteligencia de Hermes, Growth OS y la gobernanza de protocolos.",
      icon: Layers,
      href: "/ecosystem",
      allowed: permissions.ecosystem,
      color: "indigo",
      requirementText: "Activo para todos los miembros",
    },
    {
      id: "developer_hub",
      title: "Developer Hub & API Keys",
      description: "Gestión de credenciales, API keys de integración, webhooks y herramientas para desarrolladores del ecosistema.",
      icon: Terminal,
      href: "/nexus/developers",
      allowed: permissions['nexus.manage'],
      color: "cyan",
      requirementText: "Requiere Rol Admin o Permiso Específico",
    },
    {
      id: "books_vault",
      title: "Bóveda Constitucional & Libros",
      description: "Constitución y Libros Fundacionales I al IX de Pandora's Protocol. Protegido con doble capa de seguridad criptográfica.",
      icon: Lock,
      href: "https://app.pandoras.finance/libros/constitucion",
      allowed: isSuperAdmin || permissions.institutionalBooks || auth.email === "marco.munoz9@gmail.com", 
      color: "rose",
      requirementText: "Exclusivo Super Admin con 2FA Discord",
      isDoubleLayer: true,
    },
  ];

  const quickLinks = [
    { name: "Platform Governance Plane", href: "/admin", note: "HQ Admin Console, GPU Accounting & Tenant Lens" },
    { name: "Tenant Portal (Preview)", href: "/portal", note: "Interactive In-Portal Experience" },
    { name: "Growth OS Commercial Engine", href: "/growth-os/organizations", note: "CRM Pipeline & Leads" },
    { name: "Hermes HITL Inbox", href: "/growth-os/hermes/inbox", note: "Human-in-the-Loop Command Center" },
    { name: "Tokenomics & Capital RWA", href: "/profile/projects", note: "Phases & Safe Treasury" },
    { name: "Onboarding Unificado", href: "/onboarding", note: "Tenant Provisioning Wizard" },
    { name: "Retail End-User Portal", href: "https://app.pandoras.finance", note: "B2C Consumer Frontend" },
  ];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#08080A] text-white selection:bg-amber-500/30">
      
      {/* ── CARÁTULA (LEFT PANEL) ── */}
      <div 
        className={`absolute inset-0 transition-transform duration-700 cubic-bezier(0.87, 0, 0.13, 1) overflow-y-auto ${
          showLegacyConsole ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <div className="min-h-full p-6 sm:p-10 lg:p-12 pr-12">
          {/* Background Subtle Grid Pattern */}
          <div
            className="pointer-events-none fixed inset-0 z-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          <div className="max-w-6xl mx-auto space-y-10 relative z-10">
            {/* ── TOP HERO & ACTOR CONSOLE ── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12121a] via-[#0d0d14] to-[#08080c] border border-white/10 p-6 sm:p-10 shadow-2xl">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] uppercase font-mono tracking-[0.3em] text-zinc-500">
                      Pandora&apos;s Protocol · Internal Command
                    </span>
                    {getRoleBadge()}
                  </div>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                    Nexus Command Center
                  </h1>

                  <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                    Puerta de entrada unificada y orquestador institucional con control de acceso basado en roles (RBAC).
                    Accede a las salas de transacciones, academia, herramientas operativas y directorios centrales.
                  </p>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => setIsTourOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-lg shadow-amber-500/10 transition-all group"
                    >
                      <Compass className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                      <span>🧭 Iniciar Recorrido del Ecosistema con Hermes</span>
                    </button>
                  </div>
                </div>

                {/* User Profile Card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col gap-2 min-w-[240px]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                    <UserCheck className="w-4 h-4 text-amber-400" />
                    <span>Sesión Verificada</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    {name && <p className="text-white font-sans font-medium">{name}</p>}
                    {email && <p className="text-zinc-400 text-[11px]">{email}</p>}
                    {wallet && (
                      <p className="text-amber-300/80 text-[11px] truncate" title={wallet}>
                        {wallet.slice(0, 8)}...{wallet.slice(-6)}
                      </p>
                    )}
                  </div>
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                    <span>Soak ID: nx_actor_ok</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      ONLINE
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 1: INTERNAL APPLICATIONS GRID ── */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Plataformas &amp; Aplicaciones Internas
                </h2>
              </div>

              <div className="flex flex-wrap justify-center gap-5">
                {applications
                  .filter(app => {
                    // Books Vault completely invisible for non-super-admins without permissions
                    if (app.id === "books_vault" && !isSuperAdmin && !permissions.institutionalBooks && auth.email !== "marco.munoz9@gmail.com") {
                      return false;
                    }
                    return true;
                  })
                  .map((app) => {
                  const Icon = app.icon;
                  const isAllowed = app.allowed;

                  return (
                    <div
                      key={app.id}
                      className={`relative w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1rem)] max-w-md rounded-2xl border p-6 flex flex-col justify-between transition-all group ${
                        isAllowed
                          ? "bg-zinc-900/40 border-white/10 hover:border-amber-500/40 hover:bg-zinc-900/70 shadow-lg hover:shadow-amber-500/5"
                          : "bg-zinc-950/40 border-white/5 opacity-60 hover:opacity-75"
                      }`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                              isAllowed
                                ? app.color === "amber"
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                  : app.color === "violet"
                                  ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                  : app.color === "blue"
                                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                  : app.color === "emerald"
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                                : "bg-zinc-800 border-zinc-700 text-zinc-500"
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>

                          {isAllowed ? (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              HABILITADO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                              <Lock className="w-2.5 h-2.5" /> RESTRINGIDO
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="font-bold text-white text-base tracking-tight group-hover:text-amber-300 transition-colors">
                            {app.title}
                          </h3>
                          <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
                            {app.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-6 mt-4 border-t border-white/5 flex items-center justify-between">
                        {isAllowed ? (
                          app.onClick ? (
                            <button
                              onClick={app.onClick}
                              className="w-full bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/40 border border-white/10 text-white hover:text-amber-200 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                              <span>Acceder a la Plataforma</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <Link
                              href={app.href}
                              className="w-full bg-white/5 hover:bg-amber-500/20 hover:border-amber-500/40 border border-white/10 text-white hover:text-amber-200 text-xs font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                            >
                              <span>Acceder a la Plataforma</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          )
                        ) : (
                          <div className="w-full text-center py-2 px-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
                            <Lock className="w-3 h-3" />
                            <span>{app.requirementText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── SECTION 2: PROTOCOL FAST HUBS ── */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-400" />
                Acceso Rápido a Ecosistemas &amp; Portales
              </h2>

              <div className="flex flex-wrap justify-center gap-4">
                {quickLinks.map((ql) => (
                  <Link
                    key={ql.name}
                    href={ql.href}
                    className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1rem)] p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900/60 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-zinc-400 group-hover:text-indigo-400 mb-2">
                        <span className="text-xs font-mono font-medium text-white group-hover:text-indigo-200">
                          {ql.name}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                      <p className="text-[11px] text-zinc-500">{ql.note}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── HERMES FLOATING ECOSYSTEM TOUR GUIDE ── */}
            <HermesFloatingGuide
              role={tourRole}
              isOpen={isTourOpen}
              onClose={() => setIsTourOpen(false)}
              customStations={customStations}
            />
          </div>
        </div>
      </div>

      {/* ── PESTAÑA LATERAL (TOGGLE TAB) ── */}
        <div 
          className={`absolute top-0 bottom-0 z-50 flex flex-col justify-center transition-all duration-700 cubic-bezier(0.87, 0, 0.13, 1) ${
            showLegacyConsole ? "left-0" : "right-0"
          }`}
        >
          <button 
            onClick={() => setShowLegacyConsole(!showLegacyConsole)}
            className={`h-64 w-8 bg-black/80 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-amber-500/50 transition-all shadow-2xl group ${
              showLegacyConsole ? "rounded-r-2xl border-l-0" : "rounded-l-2xl border-r-0"
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <span className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] group-hover:text-amber-400 transition-colors" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                {showLegacyConsole ? "VOLVER AL COMMAND CENTER" : "NEXUS CONSOLE"}
              </span>
              {showLegacyConsole ? <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" /> : <Layers className="w-4 h-4 text-zinc-400 group-hover:text-amber-400" />}
            </div>
          </button>
        </div>

      {/* ── LEGACY CONSOLE (RIGHT PANEL) ── */}
        <div 
          className={`absolute inset-0 transition-transform duration-700 cubic-bezier(0.87, 0, 0.13, 1) ${
            showLegacyConsole ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="pl-8 h-full w-full bg-[#08080A]">
            <iframe 
              src={`https://pandoras.finance/en/nexus${auth.wallet ? `?wallet=${auth.wallet}` : ''}${iframeToken ? `${auth.wallet ? '&' : '?'}token=${iframeToken}` : ''}`} 
              className="w-full h-full border-none" 
            />
          </div>
        </div>

    </div>
  );
}

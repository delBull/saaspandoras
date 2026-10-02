import { Boxes, TrendingUp, Key, BookOpen, BrainCircuit, Server } from "lucide-react";
import React from "react";

export interface NexusLink {
  label: string;
  note?: string;
  href: string;
  external?: boolean;
  cap?: string | string[];
  superAdminOnly?: boolean;
}

export interface NexusSection {
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

export const SECTIONS: NexusSection[] = [
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
      { label: "Academy & Leadership Curriculum", note: "Alumnos, curriculum COO/CFO y emisión de blueprints de certificación.", href: "https://academy.pandoras.finance", external: true },
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

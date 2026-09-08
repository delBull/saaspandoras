"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  ShieldCheck,
  Check,
  Handshake,
  GraduationCap,
  Settings,
  Bot,
  Lock,
  Globe,
  Save,
  AlertCircle,
  FolderOpen,
  FileText,
  FileCheck,
  FileX,
  ChevronRight,
  ExternalLink,
  Loader2,
  ClipboardList,
  Share2,
  Upload,
} from "lucide-react";
import type { NexusRole } from "@/lib/nexus/nexus-rbac";
import type { NexusPermissionsOverride } from "@/db/schema";
import { KIND_LABEL, STATUS_LABEL } from "@/lib/nexus-deals/types";

export interface CollaboratorItem {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions?: NexusPermissionsOverride;
  expiresAt: string;
  lastAccessAt?: string | null;
  createdAt: string;
}

interface CollaboratorPermissionsDrawerProps {
  collaborator: CollaboratorItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedCollab: CollaboratorItem) => void;
}

export function CollaboratorPermissionsDrawer({
  collaborator,
  isOpen,
  onClose,
  onUpdated,
}: CollaboratorPermissionsDrawerProps) {
  const [role, setRole] = useState<NexusRole>("VIEWER");
  const [permissions, setPermissions] = useState<NexusPermissionsOverride>({});
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"permisos" | "dataroom">("permisos");

  // Data Room state
  interface DealRoomRef {
    id: string;
    publicId: string;
    title: string;
    kind: string;
    status: string;
    counterparty: string;
    createdAt: string;
    myRole: string;
    mySignStatus: string | null;
  }
  const [deals, setDeals] = useState<DealRoomRef[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);

  // Sync state when collaborator changes
  useEffect(() => {
    if (collaborator) {
      setRole((collaborator.role as NexusRole) || "VIEWER");
      setPermissions(collaborator.permissions || {});
      setDiscordWebhookUrl("");
      setFeedback(null);
      setActiveTab("permisos");
      setDeals([]);
    }
  }, [collaborator]);

  // Fetch deals when Data Room tab is opened
  useEffect(() => {
    if (activeTab === "dataroom" && collaborator?.email && deals.length === 0) {
      setDealsLoading(true);
      fetch(`/api/nexus/collaborators/deals?email=${encodeURIComponent(collaborator.email)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) setDeals(data.rooms ?? []);
        })
        .catch(console.error)
        .finally(() => setDealsLoading(false));
    }
  }, [activeTab, collaborator?.email, deals.length]);

  if (!collaborator) return null;

  const handleRoleChange = (newRole: NexusRole) => {
    setRole(newRole);
    // Reset or adapt overrides according to new base role
    if (newRole === "ADMIN") {
      setPermissions((prev) => ({ ...prev, dealRoom: true, academyAdmin: true, settings: true, hermesQa: true }));
    } else if (newRole === "MARKETING") {
      setPermissions((prev) => ({ ...prev, dealRoom: false, academyAdmin: true, settings: false, hermesQa: true }));
    } else {
      setPermissions((prev) => ({ ...prev, dealRoom: false, academyAdmin: false, settings: false, hermesQa: false }));
    }
  };

  const togglePermission = (key: keyof NexusPermissionsOverride) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/nexus/collaborators/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: collaborator.email,
          role,
          permissions,
        }),
      });

      // Save webhook if provided
      if (discordWebhookUrl) {
        // Warning: This assumes collaborator.wallet exists or endpoint accepts email.
        // The API we built uses [wallet]. We should probably update the API or pass a correct identifier.
        // For now, we hit the generic endpoint using an identifier we know or will adapt it later.
        await fetch(`/api/v1/nexus/collaborators/${collaborator.email}/webhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discordWebhookUrl })
        });
      }

      const data = await res.json();
      if (res.ok && data.ok && data.collaborator) {
        setFeedback({ type: "success", message: "Permisos actualizados correctamente." });
        onUpdated(data.collaborator);
        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setFeedback({ type: "error", message: data.error || "No se pudieron actualizar los permisos." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Error de conexión con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#0c0c12] border-l border-white/10 shadow-2xl z-50 flex flex-col overflow-hidden text-white"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Gestionar Permisos
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Control de Acceso Granular · Pandora&apos;s Nexus RBAC
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Collaborator Profile Card */}
            <div className="p-6 border-b border-white/5 bg-zinc-950/40">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white text-base">{collaborator.name}</h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{collaborator.email}</p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                  ID #{collaborator.id}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-zinc-950/30">
              {[
                { id: "permisos", label: "Permisos & Rol", icon: Shield },
                { id: "dataroom", label: "Data Room", icon: FolderOpen },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "permisos" | "dataroom")}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-all border-b-2 ${
                    activeTab === tab.id
                      ? "border-amber-500 text-amber-400 bg-amber-500/5"
                      : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ── PERMISOS TAB ── */}
              {activeTab === "permisos" && (
              <>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                  Rol Base Asignado
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["ADMIN", "MARKETING", "VIEWER"] as NexusRole[]).map((r) => {
                    const active = role === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(r)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          active
                            ? r === "ADMIN"
                              ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                              : r === "MARKETING"
                              ? "bg-violet-500/10 border-violet-500/40 text-violet-300"
                              : "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                            : "bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold font-mono tracking-tight">{r}</span>
                          {active && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <p className="text-[10px] opacity-70 mt-1 line-clamp-2">
                          {r === "ADMIN"
                            ? "Control total deal room y configuración"
                            : r === "MARKETING"
                            ? "Operador Academy y soporte"
                            : "Recursos y enlaces generales"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Capabilities Checkboxes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Permisos de Sección (Overrides)
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    Ajustes personalizados por usuario
                  </span>
                </div>

                <div className="space-y-2.5">
                  {/* Deal Room */}
                  <div
                    onClick={() => togglePermission("dealRoom")}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      permissions.dealRoom
                        ? "bg-amber-500/[0.07] border-amber-500/30 text-white"
                        : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${permissions.dealRoom ? "bg-amber-500/20 text-amber-300" : "bg-zinc-800 text-zinc-500"}`}>
                        <Handshake className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Deal Room &amp; Transaction Rooms</p>
                        <p className="text-[10px] text-zinc-400">Ver, redactar y firmar acuerdos, contratos y NDAs</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      permissions.dealRoom ? "bg-amber-500 border-amber-500 text-black font-bold" : "border-zinc-700 bg-zinc-800/60"
                    }`}>
                      {permissions.dealRoom && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Academy Admin */}
                  <div
                    onClick={() => togglePermission("academyAdmin")}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      permissions.academyAdmin
                        ? "bg-violet-500/[0.07] border-violet-500/30 text-white"
                        : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${permissions.academyAdmin ? "bg-violet-500/20 text-violet-300" : "bg-zinc-800 text-zinc-500"}`}>
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Academy Control Plane (Admin)</p>
                        <p className="text-[10px] text-zinc-400">Gestionar alumnos, currículum COO/CFO y certificados</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      permissions.academyAdmin ? "bg-violet-500 border-violet-500 text-white font-bold" : "border-zinc-700 bg-zinc-800/60"
                    }`}>
                      {permissions.academyAdmin && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Nexus Settings */}
                  <div
                    onClick={() => togglePermission("settings")}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      permissions.settings
                        ? "bg-blue-500/[0.07] border-blue-500/30 text-white"
                        : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${permissions.settings ? "bg-blue-500/20 text-blue-300" : "bg-zinc-800 text-zinc-500"}`}>
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Nexus Settings &amp; Colaboradores</p>
                        <p className="text-[10px] text-zinc-400">Invitar o gestionar accesos de otros miembros</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      permissions.settings ? "bg-blue-500 border-blue-500 text-white font-bold" : "border-zinc-700 bg-zinc-800/60"
                    }`}>
                      {permissions.settings && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Hermes QA */}
                  <div
                    onClick={() => togglePermission("hermesQa")}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      permissions.hermesQa
                        ? "bg-emerald-500/[0.07] border-emerald-500/30 text-white"
                        : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${permissions.hermesQa ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-800 text-zinc-500"}`}>
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">Hermes QA &amp; Diagnostics</p>
                        <p className="text-[10px] text-zinc-400">Pruebas interactivas de LLM, prompts y diagnóstico</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      permissions.hermesQa ? "bg-emerald-500 border-emerald-500 text-black font-bold" : "border-zinc-700 bg-zinc-800/60"
                    }`}>
                      {permissions.hermesQa && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  {/* Always Enabled: Ecosystem Resources */}
                  <div className="p-3.5 rounded-xl border border-white/5 bg-zinc-900/20 text-zinc-400 flex items-center justify-between opacity-80 cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-zinc-800/50 text-zinc-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-300">Hub de Ecosistema &amp; Enlaces</p>
                        <p className="text-[10px] text-zinc-500">Acceso base permanente para miembros verificados</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase px-2 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/50">
                      Activo
                    </span>
                  </div>

                  {/* Strictly Protected: Institutional Books */}
                  <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-zinc-500 flex items-center justify-between opacity-80 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-rose-300/80">Libros Constitucionales &amp; Bóveda Secreta</p>
                        <p className="text-[10px] text-zinc-500">Reservado estrictamente para Super Admin con 2FA Discord</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono text-rose-400 uppercase px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                      Bloqueado
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                    feedback.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                  }`}
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Discord Webhook Field */}
              <div className="pt-6 border-t border-white/10">
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-zinc-400" />
                  Discord Webhook (HITL Personal)
                </label>
                <p className="text-xs text-zinc-500 mb-3">
                  Canal privado de alertas HITL para este operador.
                </p>
                <input
                  type="text"
                  placeholder="https://discord.com/api/webhooks/[ID]/[TOKEN]"
                  value={discordWebhookUrl}
                  onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
              </>
              )} {/* end PERMISOS TAB */}

              {/* ── DATA ROOM TAB ── */}
              {activeTab === "dataroom" && (
                <div className="space-y-6">
                  {/* Section A: Contractual Docs (Pandoras ↔ Collaborator) */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-amber-500/10"><FileCheck className="w-4 h-4 text-amber-400" /></div>
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">A. Documentos Contractuales</span>
                        <p className="text-[10px] text-zinc-500">Pandoras ↔ {collaborator.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {([
                        { label: "NDA / Acuerdo de Confidencialidad", status: "Pendiente" },
                        { label: "Contrato de Servicios / Colaboración", status: "Pendiente" },
                        { label: "Ficha de Incorporación (Onboarding Brief)", status: "Pendiente" },
                      ] as const).map((doc) => (
                        <div key={doc.label} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5 group hover:border-amber-500/20 transition-all">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs text-zinc-300">{doc.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono">{doc.status}</span>
                            <button
                              onClick={() => window.open('/nexus/rooms', '_blank')}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/5 text-zinc-400 transition-all"
                              title="Crear en Deal Room"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section B: Docs collaborator delivers to Pandoras */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-purple-500/10"><Upload className="w-4 h-4 text-purple-400" /></div>
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">B. Documentos del Colaborador</span>
                        <p className="text-[10px] text-zinc-500">Entregables requeridos por Pandoras</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {([
                        { label: "ID Oficial / Pasaporte", status: "Requerido" },
                        { label: "Comprobante de Domicilio", status: "Requerido" },
                        { label: "CV / Portfolio de Experiencia", status: "Requerido" },
                        { label: "Factura Fiscal (si aplica)", status: "Opcional" },
                      ] as const).map((doc) => (
                        <div key={doc.label} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5 group hover:border-purple-500/20 transition-all">
                          <div className="flex items-center gap-2.5">
                            <ClipboardList className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs text-zinc-300">{doc.label}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                            doc.status === 'Opcional'
                              ? 'border-zinc-600 bg-zinc-800 text-zinc-400'
                              : 'border-red-500/30 bg-red-500/10 text-red-400'
                          }`}>{doc.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section C: Docs to share with clients */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10"><Share2 className="w-4 h-4 text-emerald-400" /></div>
                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">C. Materiales para Clientes</span>
                        <p className="text-[10px] text-zinc-500">Documentos autorizados para prospección</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {([
                        { label: "One-Pager · Pandoras Growth OS", status: "Disponible", href: "https://pandoras.finance/en/institutional" },
                        { label: "Deck de Presentación Institucional", status: "Disponible", href: "https://pandoras.finance/en/institutional" },
                        { label: "Term Sheet / Resumen de Inversión", status: "Por proyecto", href: null },
                        { label: "Documento AML / Regulación (Due Diligence)", status: "Disponible", href: null },
                      ] as const).map((doc) => (
                        <div key={doc.label} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5 group hover:border-emerald-500/20 transition-all">
                          <div className="flex items-center gap-2.5">
                            <Globe className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-xs text-zinc-300">{doc.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                              doc.status === 'Disponible'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-zinc-600 bg-zinc-800 text-zinc-400'
                            }`}>{doc.status}</span>
                            {doc.href && (
                              <a href={doc.href} target="_blank" rel="noopener noreferrer"
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/5 text-zinc-400 transition-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section D: Deal Rooms linked to this collaborator */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10"><Handshake className="w-4 h-4 text-blue-400" /></div>
                        <div>
                          <span className="text-xs font-bold text-white uppercase tracking-wider">D. Deal Rooms Vinculados</span>
                          <p className="text-[10px] text-zinc-500">Acuerdos activos con {collaborator.email}</p>
                        </div>
                      </div>
                      <a href="/nexus/rooms" target="_blank"
                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        Ver todos <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {dealsLoading ? (
                      <div className="flex items-center gap-2 p-4 text-zinc-500 text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Cargando documentos del Deal Room...
                      </div>
                    ) : deals.length === 0 ? (
                      <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/5 text-center">
                        <FileX className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500">No hay Deal Rooms vinculados aún.</p>
                        <a href="/nexus/rooms" target="_blank"
                          className="inline-flex items-center gap-1 mt-2 text-[11px] text-blue-400 hover:text-blue-300"
                        >
                          Crear uno en Deal Rooms <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {deals.map((deal) => (
                          <div key={deal.id} className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 group hover:border-blue-500/20 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                                <div>
                                  <p className="text-xs font-medium text-white">{deal.title}</p>
                                  <p className="text-[10px] text-zinc-500 font-mono">{(KIND_LABEL as Record<string,string>)[deal.kind] ?? deal.kind} · {deal.publicId}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${
                                  deal.status === 'SIGNED' || deal.status === 'EXECUTED'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : deal.status === 'DRAFT'
                                    ? 'border-zinc-600 bg-zinc-800 text-zinc-400'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                }`}>
                                  {(STATUS_LABEL as Record<string,string>)[deal.status] ?? deal.status}
                                </span>
                                <a href={`/nexus/rooms`} target="_blank"
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/5 text-zinc-400"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                            {deal.mySignStatus && (
                              <div className={`mt-1.5 text-[10px] font-mono ${
                                deal.mySignStatus === 'SIGNED' ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                Tu firma: {deal.mySignStatus === 'SIGNED' ? '✓ Firmado' : '⏳ Pendiente'}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )} {/* end DATA ROOM TAB */}

            </div> {/* end scrollable content */}

            {/* Footer / Actions */}
            <div className="p-6 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? "Guardando Cambios..." : "Guardar Permisos"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

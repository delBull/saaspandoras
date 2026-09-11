"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Plus,
  Trash2,
  ExternalLink,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Lock,
  GraduationCap,
  Handshake,
  Bot,
  Settings,
} from "lucide-react";
import {
  CollaboratorPermissionsDrawer,
  type CollaboratorItem,
} from "./CollaboratorPermissionsDrawer";
import type { NexusRole } from "@/lib/nexus/nexus-rbac";
import { CognitiveAgentsManager } from "./CognitiveAgentsManager";
import { NexusHermesTerminal } from "./NexusHermesTerminal";
import { ConfigureAgendaButton } from "@/components/scheduler/ConfigureAgendaButton";

export interface OperatorContext {
  name: string;
  email: string;
  whatsappPhone?: string | null;
  role: string;
  permissions: Record<string, boolean | undefined>;
}

interface SettingsClientProps {
  isUserAdmin?: boolean;
  userRole?: string;
  operatorContext?: OperatorContext | null;
}

export default function NexusSettingsPage({ isUserAdmin = false, userRole = "OPERATOR", operatorContext = null }: SettingsClientProps) {
  const [collaborators, setCollaborators] = useState<CollaboratorItem[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [role, setRole] = useState<NexusRole>("VIEWER");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Drawer state
  const [selectedCollab, setSelectedCollab] = useState<CollaboratorItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Tabs state - SuperAdmin inicia en "team", los demás colaboradores inician en "terminal"
  const [activeTab, setActiveTab] = useState<"team" | "agents" | "terminal">(isUserAdmin ? "team" : "terminal");

  const canManageAgenda = isUserAdmin || userRole === "ADMIN" || !!operatorContext?.permissions?.["calendar.manage"];
  const canManageAgents = isUserAdmin || userRole === "ADMIN" || !!operatorContext?.permissions?.["agents.manage"];

  const loadCollaborators = async () => {
    if (!isUserAdmin) return;
    try {
      const res = await fetch("/api/nexus/collaborators/list");
      const data = await res.json();
      if (res.ok && data.ok) {
        setCollaborators(data.collaborators);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isUserAdmin) {
      loadCollaborators();
    }
  }, [isUserAdmin]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/nexus/collaborators/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), role, whatsappPhone: whatsappPhone.trim() }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setMessage({
          type: "success",
          text: `Magic Link enviado a ${email}. Rol asignado: ${role}`,
        });
        setName("");
        setEmail("");
        setWhatsappPhone("");
        loadCollaborators();
        await loadCollaborators();
      } else {
        setMessage({ type: "error", text: data.error || "Error al enviar invitación" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error de conexión" });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (email: string) => {
    if (!confirm(`¿Eliminar a ${email} de los colaboradores?`)) return;

    try {
      const res = await fetch(`/api/nexus/collaborators/remove?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        await loadCollaborators();
        setMessage({ type: "success", text: "Colaborador eliminado" });
      } else {
        setMessage({ type: "error", text: data.error || "Error al eliminar" });
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Error de conexión" });
    }
  };

  const handleOpenDrawer = (collab: CollaboratorItem) => {
    setSelectedCollab(collab);
    setIsDrawerOpen(true);
  };

  const handleCollaboratorUpdated = (updated: CollaboratorItem) => {
    setCollaborators((prev) =>
      prev.map((c) => (c.email.toLowerCase() === updated.email.toLowerCase() ? updated : c))
    );
  };

  const getRoleBadge = (r: string) => {
    switch (r?.toUpperCase()) {
      case "ADMIN":
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            ADMIN
          </span>
        );
      case "MARKETING":
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
            MARKETING
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            VIEWER
          </span>
        );
    }
  };

  return (
    <main className="min-h-screen bg-[#08080A] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/nexus"
              onClick={(e) => {
                const storedToken = typeof window !== "undefined" ? localStorage.getItem("pandoras_nexus_token") : null;
                if (storedToken) {
                  e.preventDefault();
                  document.cookie = `pandoras_nexus_token=${encodeURIComponent(storedToken)}; path=/; max-age=2592000; SameSite=Lax`;
                  window.location.href = `/nexus?token=${encodeURIComponent(storedToken)}`;
                }
              }}
              className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Volver a Nexus Command Center"
            >
              <ExternalLink className="w-5 h-5 rotate-180" />
            </a>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono mb-1">
                <ShieldCheck className="w-3 h-3" />
                SOVEREIGN RBAC CONTROLLER
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Nexus Settings</h1>
              <p className="text-zinc-400 text-xs">Gestión Centralizada de Roles &amp; Permisos de la Organización</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageAgenda && (
              <ConfigureAgendaButton tenantSlug="pandoras" vertical="HERMES" />
            )}
            <a
              href="/nexus/rooms"
              className="text-xs text-zinc-400 hover:text-amber-400 border border-white/10 px-3 py-1.5 rounded-xl hover:border-amber-500/30 transition-colors flex items-center gap-1.5"
            >
              <span>Deal Room</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-4 border-b border-zinc-800">
          {isUserAdmin && (
            <button
              onClick={() => setActiveTab("team")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === "team"
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Team & Roles
            </button>
          )}
          <button
            onClick={() => setActiveTab("agents")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "agents"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Bot className="w-4 h-4" />
            Cognitive Agents
          </button>
          <button
            onClick={() => setActiveTab("terminal")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "terminal"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Settings className="w-4 h-4" />
            Hermes Terminal
          </button>
        </div>

        {activeTab === "team" && isUserAdmin ? (
          <>
            {/* Formulario de invitación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl"
        >
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4 text-amber-400" />
            Invitar Miembro / Asignar Rol
          </h2>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@empresa.com"
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="+5215551234567"
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Rol Base</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as NexusRole)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                >
                  <option value="VIEWER">Collaborator (General)</option>
                  <option value="MARKETING">Manager / Operador (Academy)</option>
                  <option value="ADMIN">Admin (Deal Room &amp; Config)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name || !email}
              className="w-full sm:w-auto bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl px-5 py-2.5 text-amber-200 transition-all disabled:opacity-40 font-medium text-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {loading ? "Enviando Invitación..." : "Enviar Magic Link con Rol"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs ${
                message.type === "success"
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border border-rose-500/20 text-rose-300"
              }`}
            >
              {message.text}
            </div>
          )}
        </motion.div>

        {/* Lista de colaboradores */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Miembros &amp; Colaboradores Activos</h2>
              <p className="text-xs text-zinc-400">Haz clic en &quot;Gestionar Permisos&quot; para abrir el Drawer de accesos granulares.</p>
            </div>
            <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700">
              Total: {collaborators.length}
            </span>
          </div>

          {collaborators.length === 0 ? (
            <p className="text-zinc-500 text-xs py-8 text-center">
              No hay colaboradores activos en este momento. Invita a alguien usando el formulario superior.
            </p>
          ) : (
            <div className="space-y-3">
              {collaborators.map((collab) => {
                const perms = collab.permissions || {};
                const activeOverrides = Object.entries(perms).filter(([, v]) => Boolean(v));

                return (
                  <div
                    key={collab.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/70 rounded-xl gap-4 transition-colors"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-white font-medium text-sm">{collab.name}</span>
                        {getRoleBadge(collab.role)}
                        <span className="text-zinc-500 text-xs font-mono">({collab.email})</span>
                      </div>

                      {/* Capabilities indicators */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {perms.dealRoom && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            <Handshake className="w-2.5 h-2.5" /> Deal Room
                          </span>
                        )}
                        {perms.academyAdmin && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                            <GraduationCap className="w-2.5 h-2.5" /> Academy
                          </span>
                        )}
                        {perms.settings && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            <Settings className="w-2.5 h-2.5" /> Settings
                          </span>
                        )}
                        {perms.hermesQa && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            <Bot className="w-2.5 h-2.5" /> Hermes QA
                          </span>
                        )}
                        {activeOverrides.length === 0 && (
                          <span className="text-[10px] text-zinc-500">Sin overrides manuales (rol base estándar)</span>
                        )}
                      </div>

                      <p className="text-zinc-500 text-[10px]">
                        Expira: {new Date(collab.expiresAt).toLocaleDateString()}
                        {collab.lastAccessAt && (
                          <span className="ml-2">
                            · Último acceso: {new Date(collab.lastAccessAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenDrawer(collab)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-lg text-xs text-zinc-200 hover:text-white flex items-center gap-1.5 transition-colors"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                        <span>Gestionar Permisos</span>
                      </button>

                      <button
                        onClick={() => handleRemove(collab.email)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-rose-500/20"
                        title="Eliminar colaborador"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Info Box */}
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-amber-200/80 text-xs leading-relaxed">
            <strong className="text-amber-200">Arquitectura de Seguridad:</strong> Los roles base asignan capacidades predeterminadas, pero puedes liberar o bloquear módulos puntuales (Deal Room, Academy, Settings, Hermes QA) por usuario desde el Drawer de Permisos. Los Libros Institucionales y temas de soberanía fundacional permanecen protegidos bajo la doble capa de Discord exclusiva de Super Admin.
          </p>
        </div>
          </>
        ) : activeTab === "agents" ? (
          <CognitiveAgentsManager canManage={canManageAgents} />
        ) : (
          /* ── HERMES TERMINAL TAB ── */
          <div className="flex flex-col" style={{ height: '600px' }}>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                Hermes OS Terminal
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Consola conversacional para operadores. Usa voz (Whisper) o texto. Comienza con{" "}
                <code className="text-amber-400 font-mono">sudo wake_up_hermes</code>.
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <NexusHermesTerminal role={isUserAdmin ? "SUPER_ADMIN" : "OPERATOR"} operatorContext={operatorContext} />
            </div>
          </div>
        )}
      </div>

      {/* Drawer de Permisos Granulares */}
      <CollaboratorPermissionsDrawer
        collaborator={selectedCollab}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onUpdated={handleCollaboratorUpdated}
      />
    </main>
  );
}

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
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import type { NexusRole } from "@/lib/nexus/nexus-rbac";
import { CognitiveAgentsManager } from "./CognitiveAgentsManager";
import { NexusHermesTerminal } from "./NexusHermesTerminal";
import { ConfigureAgendaButton } from "@/components/scheduler/ConfigureAgendaButton";
import { DisplayControlsWidget } from "@pandoras/display-engine";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PrivateTerminalClient } from "@/components/nexus/PrivateTerminalClient";

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
  onClose?: () => void;
}

export default function NexusSettingsPage({ isUserAdmin = false, userRole = "OPERATOR", operatorContext = null, onClose }: SettingsClientProps) {
  // Drawer state
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Tabs state - SuperAdmin inicia en "team", los demás colaboradores inician en "terminal"
  const [activeTab, setActiveTab] = useState<"team" | "agents" | "terminal" | "display" | "alerts">("terminal");
  const [alertHistory, setAlertHistory] = useState<any[]>([]);

  const canManageAgenda = isUserAdmin || userRole === "ADMIN" || !!operatorContext?.permissions?.["calendar.manage"];
  const canManageAgents = isUserAdmin || userRole === "ADMIN" || !!operatorContext?.permissions?.["agents.manage"];

  const loadAlerts = async () => {
    try {
      const res = await fetch("/api/v1/nexus/broadcasts");
      const data = await res.json();
      if (data.success && data.broadcasts) {
        setAlertHistory(data.broadcasts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === "alerts") {
      loadAlerts();
    }
  }, [activeTab]);



  return (
    <main className="min-h-screen bg-[#08080A] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onClose ? (
              <button
                onClick={onClose}
                className="p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Cerrar Ajustes"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
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
            )}
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
            {isUserAdmin && (
              <Dialog open={isTerminalOpen} onOpenChange={setIsTerminalOpen}>
                <DialogTrigger asChild>
                  <button className="text-xs bg-lime-500/10 text-lime-400 hover:bg-lime-500/20 border border-lime-500/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-medium shadow-sm shadow-lime-500/10 cursor-pointer">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Terminal Privada</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] bg-[#09090D]/95 border border-lime-500/20 text-white p-0 shadow-2xl backdrop-blur-2xl rounded-3xl overflow-hidden flex flex-col">
                  {/* Drawer Pull Indicator Header */}
                  <div className="pt-3 pb-1 flex flex-col items-center justify-center border-b border-white/[0.06] bg-black/40 px-6">
                    <div className="w-12 h-1 bg-white/20 rounded-full mb-3" />
                    <div className="w-full flex items-center justify-between pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-lime-500/10 border border-lime-500/30 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-lime-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Private Pay & Finance Terminal</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-lime-500/10 border border-lime-500/30 text-lime-400">
                              SUPER ADMIN
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">
                            Cobro on-chain directo a tu wallet personal sin custodia ni CRM.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                    <PrivateTerminalClient inModal={true} />
                  </div>
                </DialogContent>
              </Dialog>
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
          <button
            onClick={() => setActiveTab("display")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "display"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Eye className="w-4 h-4" />
            Comfort Visual
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === "alerts"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Historial de Alertas
          </button>
        </div>

        {activeTab === "agents" ? (
          <CognitiveAgentsManager canManage={canManageAgents} />
        ) : activeTab === "display" ? (
          /* ── ACCESIBILIDAD & VISUALIZACIÓN TAB ── */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl"
          >
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                Visual y Accesibilidad
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Ajusta el zoom, el seleccionador focal (Smart Focus) y los filtros de contraste para lectura de contratos, cláusulas y registros de auditoría.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 bg-black/40 border border-white/5 p-5 rounded-xl">
                <h3 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Controles de Confort
                </h3>
                <DisplayControlsWidget />
              </div>

              <div className="lg:col-span-6 space-y-4 text-xs text-zinc-400 leading-relaxed">
                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300 font-mono">
                    <span>🔍</span>
                    <span>Smart Focus (Seleccionador) en Deal Rooms & Contratos</span>
                  </div>
                  <p>
                    Actívalo para resaltar inteligentemente cláusulas legales, hashes de e-sign y CIDs de IPFS. Pasa el cursor y el área se enfocará automáticamente.
                  </p>
                </div>

                <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-indigo-300 font-mono">
                    <span>🔠</span>
                    <span>Escala Visual (100% - 130%)</span>
                  </div>
                  <p>
                    Aumenta toda la interfaz de Nexus y Transaction Rooms sin romper tablas ni modales.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : activeTab === "alerts" ? (
          /* ── ALERTS HISTORY TAB ── */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 bg-[#0C0C12] border border-white/5 p-6 rounded-2xl"
          >
            <div className="border-b border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Historial de Alertas
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Consulta los avisos y comunicados que ya cerraste en el centro de comandos.
              </p>
            </div>
            <div className="space-y-3">
              {alertHistory.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No hay alertas registradas en el historial.
                </div>
              ) : (
                alertHistory.map((alert) => (
                  <div key={alert.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">{alert.category || 'AVISO'}</span>
                      <span className="text-xs text-zinc-500">{new Date(alert.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{alert.title}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">{alert.message}</p>
                    {alert.targetUrl && (
                      <a href={alert.targetUrl} className="text-xs text-amber-300 mt-2 block hover:underline">Ver más detalles &rarr;</a>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
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


    </main>
  );
}

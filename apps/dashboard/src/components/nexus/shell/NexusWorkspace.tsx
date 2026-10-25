"use client";

import React from "react";
import { 
  AlertOctagon, 
  CheckSquare, 
  Activity, 
  BrainCircuit, 
  ChevronRight, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Webhook, 
  Building2, 
  Handshake, 
  TerminalSquare
} from "lucide-react";
import type { NexusAuthContext } from "@saasfly/shared";
import type { TaskItem } from "../taskTypes";

interface NexusWorkspaceProps {
  auth: NexusAuthContext;
  sidebarOpen?: boolean;
  onAction?: (action: string) => void;
  tasks?: TaskItem[];
  onToggleTask?: (taskId: string) => void;
}

export function NexusWorkspace({ auth: _auth, sidebarOpen: _sidebarOpen, onAction, tasks = [], onToggleTask }: NexusWorkspaceProps) {
  return (
    <main className="flex-1 relative z-10 transition-all duration-500 p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Command Center</h1>
            <p className="text-zinc-400 text-sm mt-1">
              General overview of your operations and pending actions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </div>
              <span className="text-emerald-400 text-xs font-medium uppercase tracking-wider">All Systems Operational</span>
            </div>
          </div>
        </div>

        {/* Top Grid: Attention & Hermes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* A. Attention */}
          <div className="lg:col-span-2 bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-amber-500" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Attention Required</h2>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 text-xs font-mono">3 Items</span>
            </div>
            <div className="p-2 flex-1 flex flex-col space-y-1">
              {[
                { title: "Grant Collaborator Capability", desc: "Hermes requested ADMIN access for pablosegali@gmail.com", type: "Approval", time: "10m ago", icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-400/10", action: "APPROVALS" },
                { title: "Stripe Webhook Failed", desc: "Payment reconciliation failed for Deal Room #1042", type: "Incident", time: "1h ago", icon: Webhook, color: "text-red-400", bg: "bg-red-400/10", action: "ACTIVITY" },
                { title: "Proposal Awaiting Approval", desc: "Governance protocol update pending multisig confirmation", type: "Governance", time: "2h ago", icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-400/10", action: "APPROVALS" }
              ].map((item, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => onAction?.(item.action)}
                  className="w-full text-left flex items-start gap-4 p-3 hover:bg-white/[0.04] rounded-xl transition-colors cursor-pointer group"
                >
                  <div className={`p-2.5 rounded-lg ${item.bg} shrink-0 group-hover:scale-105 transition-transform`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-amber-300 transition-colors">{item.title}</h3>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">{item.time}</span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{item.desc}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-medium">
                        {item.type}
                      </span>
                      <span className="text-[11px] text-zinc-500 group-hover:text-amber-400 flex items-center gap-0.5 transition-colors">
                        Revisar <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* E. Hermes Panel */}
          <div className="bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-50 pointer-events-none" />
            <div className="p-5 border-b border-white/[0.08] flex items-center gap-2 relative z-10">
              <BrainCircuit className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Hermes Insights</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center items-center text-center relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <BrainCircuit className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Everything looks stable. There is a pending approval for a new collaborator role that requires your authorization.
              </p>
              <button 
                onClick={() => onAction && onAction('hermes')}
                className="mt-6 flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                <TerminalSquare className="w-4 h-4" />
                Open Hermes Terminal
              </button>
            </div>
          </div>
        </div>

        {/* Middle Grid: Operations Pulse & My Work */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* C. Operations Pulse */}
          <div className="grid grid-cols-2 gap-4 lg:col-span-1">
            {[
              { label: "Active Orgs", value: "12", icon: Building2, color: "text-blue-400", bg: "bg-blue-400/10", action: "CLIENTS" },
              { label: "Open Deals", value: "8", icon: Handshake, color: "text-emerald-400", bg: "bg-emerald-400/10", action: "DATAROOM" },
              { label: "Pending Approvals", value: "4", icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-400/10", action: "APPROVALS" },
              { label: "Unresolved Incidents", value: "1", icon: AlertOctagon, color: "text-red-400", bg: "bg-red-400/10", action: "ACTIVITY" },
            ].map((stat, i) => (
              <button 
                key={i} 
                type="button"
                onClick={() => onAction?.(stat.action)}
                className="w-full text-left bg-[#0A0A0E] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer group"
              >
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white font-mono group-hover:text-amber-300 transition-colors">{stat.value}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1 flex items-center justify-between">
                    <span>{stat.label}</span>
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* B. My Work */}
          <div className="lg:col-span-2 bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">My Work</h2>
              </div>
              <button 
                onClick={() => onAction?.('WORK_ENGINE')}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                Ver Todas <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-2 flex-1 space-y-1">
              {tasks.filter(t => !t.completed).slice(0, 4).map((task) => (
                <div 
                  key={task.id} 
                  className="w-full flex items-center justify-between p-3 hover:bg-white/[0.03] rounded-xl transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => onToggleTask?.(task.id)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <div
                      className="w-5 h-5 rounded border border-white/20 group-hover:border-emerald-500/80 transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                      title="Marcar como completada"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-transparent group-hover:text-emerald-500/80 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm text-zinc-300 group-hover:text-white transition-colors block truncate">
                        {task.title}
                      </span>
                      {task.assignee && (
                        <span className="text-[10px] text-zinc-500 font-mono block">
                          Asignado: {task.assignee}
                        </span>
                      )}
                    </div>
                  </button>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${task.priority === 'HIGH' ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {task.priority}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAction?.('WORK_ENGINE')}
                      className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                      title="Abrir detalles de la tarea"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {tasks.filter(t => !t.completed).length === 0 && (
                <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                  ✓ Todas las tareas operativas están completadas
                </div>
              )}
            </div>
          </div>
        </div>

        {/* D. Recent Activity */}
        <div className="bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Activity</h2>
            </div>
            <button 
              onClick={() => onAction?.('ACTIVITY')}
              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              Ver Registro <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {[
                { user: "System", action: "processed webhook", target: "Stripe Payment Intent #5920", time: "5m ago", actionType: "ACTIVITY" },
                { user: "Pablo Segali", action: "approved access", target: "Deal Room #1041", time: "25m ago", actionType: "DATAROOM" },
                { user: "Hermes", action: "generated report", target: "Monthly Yield Analytics", time: "1h ago", actionType: "KNOWLEDGE" },
                { user: "Valeria", action: "assigned task", target: "Update Compliance Docs", time: "3h ago", actionType: "WORK_ENGINE" }
              ].map((log, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => onAction?.(log.actionType)}
                  className="w-full text-left flex items-start gap-4 p-2 rounded-xl hover:bg-white/[0.02] cursor-pointer transition-colors group"
                >
                  <div className="mt-1 relative flex items-center justify-center w-6 h-6 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10 group-hover:border-blue-400/50 transition-colors" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 group-hover:bg-blue-400 transition-colors" />
                  </div>
                  <div className="flex-1 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <p className="text-sm text-zinc-300">
                      <span className="font-semibold text-white group-hover:text-blue-300 transition-colors">{log.user}</span> {log.action}{" "}
                      <span className="text-white/80">{log.target}</span>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span className="text-xs text-zinc-500">{log.time}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

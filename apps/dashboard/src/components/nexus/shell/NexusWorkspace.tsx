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
import type { NexusAuthContext } from "@/lib/nexus/nexus-rbac";
import type { TaskItem } from "../taskTypes";

interface NexusWorkspaceProps {
  auth: NexusAuthContext;
  sidebarOpen?: boolean;
  onAction?: (action: string) => void;
  tasks?: TaskItem[];
}

export function NexusWorkspace({ auth, sidebarOpen, onAction, tasks = [] }: NexusWorkspaceProps) {
  const isSuperAdmin = auth.role === 'SUPER_ADMIN';
  const isNexusAdmin = !!auth.permissions?.['nexus.manage'];
  const isFinance = !!auth.permissions?.['finance.manage'];
  
  const permissions = auth.permissions || {};
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
            <div className="p-2 flex-1 flex flex-col">
              {[
                { title: "Grant Collaborator Capability", desc: "Hermes requested ADMIN access for pablosegali@gmail.com", type: "Approval", time: "10m ago", icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-400/10" },
                { title: "Stripe Webhook Failed", desc: "Payment reconciliation failed for Deal Room #1042", type: "Incident", time: "1h ago", icon: Webhook, color: "text-red-400", bg: "bg-red-400/10" },
                { title: "Proposal Awaiting Approval", desc: "Governance protocol update pending multisig confirmation", type: "Governance", time: "2h ago", icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-400/10" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-3 hover:bg-white/[0.02] rounded-xl transition-colors cursor-pointer group">
                  <div className={`p-2.5 rounded-lg ${item.bg} shrink-0`}>
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                      <span className="text-[10px] text-zinc-500 whitespace-nowrap">{item.time}</span>
                    </div>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{item.desc}</p>
                    <div className="mt-2">
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 font-medium">
                        {item.type}
                      </span>
                    </div>
                  </div>
                </div>
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
              { label: "Active Orgs", value: "12", icon: Building2, color: "text-blue-400", bg: "bg-blue-400/10" },
              { label: "Open Deals", value: "8", icon: Handshake, color: "text-emerald-400", bg: "bg-emerald-400/10" },
              { label: "Pending Approvals", value: "4", icon: ShieldAlert, color: "text-amber-400", bg: "bg-amber-400/10" },
              { label: "Unresolved Incidents", value: "1", icon: AlertOctagon, color: "text-red-400", bg: "bg-red-400/10" },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0A0A0E] border border-white/[0.08] rounded-2xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-4`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                  <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium mt-1">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* B. My Work */}
          <div className="lg:col-span-2 bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">My Work</h2>
              </div>
              <button className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="p-2 flex-1">
              {tasks.filter(t => !t.completed).slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 hover:bg-white/[0.02] rounded-xl transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded border border-white/20 group-hover:border-emerald-500/50 transition-colors flex items-center justify-center">
                      <CheckSquare className="w-3 h-3 text-transparent group-hover:text-emerald-500/50" />
                    </div>
                    <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${task.priority === 'HIGH' ? 'text-rose-400' : 'text-zinc-500'}`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
              ))}
              {tasks.filter(t => !t.completed).length === 0 && (
                <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                  No pending tasks
                </div>
              )}
            </div>
          </div>
        </div>

        {/* D. Recent Activity */}
        <div className="bg-[#0A0A0E] border border-white/[0.08] rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/[0.08] flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Activity</h2>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {[
                { user: "System", action: "processed webhook", target: "Stripe Payment Intent #5920", time: "5m ago" },
                { user: "Pablo Segali", action: "approved access", target: "Deal Room #1041", time: "25m ago" },
                { user: "Hermes", action: "generated report", target: "Monthly Yield Analytics", time: "1h ago" },
                { user: "Valeria", action: "assigned task", target: "Update Compliance Docs", time: "3h ago" }
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="mt-1 relative flex items-center justify-center w-6 h-6">
                    <div className="absolute inset-0 rounded-full bg-white/5 border border-white/10" />
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                  </div>
                  <div className="flex-1 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                    <p className="text-sm text-zinc-300">
                      <span className="font-semibold text-white">{log.user}</span> {log.action}{" "}
                      <span className="text-white/80">{log.target}</span>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      <span className="text-xs text-zinc-500">{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Command, 
  CheckSquare, 
  AlertOctagon, 
  Activity, 
  Building2, 
  Briefcase, 
  Handshake, 
  BookOpen, 
  GraduationCap, 
  Webhook, 
  Code2, 
  HeartPulse, 
  BrainCircuit, 
  Users, 
  ShieldCheck, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut
} from "lucide-react";
import type { NexusAuthContext } from "@saasfly/shared";

interface NexusSidebarProps {
  auth: NexusAuthContext;
  onAction?: (action: string) => void;
}

export function NexusSidebar({ auth, onAction }: NexusSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const permissions = auth.permissions || {} as Record<string, boolean>;

  const navigation: Array<{
    label: string;
    items: Array<{
      name: string;
      href: string;
      icon: any;
      exact?: boolean;
      show?: boolean;
      external?: boolean;
      action?: string;
    }>;
  }> = [
    {
      label: "OPERATIONS",
      items: [
        { name: "Command Center", href: "/nexus", icon: Command, exact: true },
        { name: "Unified Index", href: "#", action: "UNIFIED_INDEX", icon: LayoutDashboard },
        { name: "My Work", href: "#", action: "WORK_ENGINE", icon: CheckSquare },
        { name: "Approvals", href: "#", action: "APPROVALS", icon: ShieldCheck },
        { name: "Activity & Incidents", href: "#", action: "ACTIVITY", icon: AlertOctagon },
      ]
    },
    {
      label: "CLIENTS & GROWTH",
      items: [
        { name: "Organizations", href: "#", action: "CLIENTS", icon: Building2 },
        { name: "Deals", href: "#", action: "CLIENTS", icon: Briefcase },
        { name: "Deal Rooms", href: "#", action: "DATAROOM", icon: Handshake, show: permissions.dealRoom },
      ]
    },
    {
      label: "KNOWLEDGE",
      items: [
        { name: "Knowledge", href: "#", action: "KNOWLEDGE", icon: BookOpen },
      ]
    },
    {
      label: "SYSTEMS",
      items: [
        { name: "Developers", href: "#", action: "SETTINGS", icon: Code2, show: auth.role === "SUPER_ADMIN" || auth.role === "ADMIN" },
      ]
    },
    {
      label: "HERMES",
      items: [
        { name: "Hermes OS", href: "#", icon: BrainCircuit, action: "hermes" },
      ]
    },
    {
      label: "ADMIN",
      items: [
        { name: "Collaborators", href: "#", action: "COHORTS", icon: Users, show: auth.role === "SUPER_ADMIN" },
        { name: "Settings", href: "#", action: "SETTINGS", icon: Settings, show: permissions.settings },
      ]
    }
  ];

  return (
    <div 
      className={`shrink-0 flex flex-col bg-[#07070B] border-r border-white/[0.08] transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[240px]"
      } z-30 h-full overflow-y-auto custom-scrollbar`}
    >
      <div className="flex items-center justify-between p-4 shrink-0 h-16 border-b border-white/[0.08]">
        {!collapsed && (
          <span className="text-xs font-mono tracking-[0.2em] text-zinc-300 font-bold uppercase">Pandora's Nexus</span>
        )}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-md hover:bg-white/10 text-zinc-400 transition-colors ${collapsed ? 'mx-auto' : ''}`}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {navigation.map((section, idx) => {
          const visibleItems = section.items.filter(item => item.show !== false);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="px-3">
              {!collapsed && (
                <h3 className="mb-2 px-2 text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
                  {section.label}
                </h3>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  if (item.action && onAction) {
                    return (
                      <button
                        key={item.name}
                        onClick={() => onAction(item.action!)}
                        title={collapsed ? item.name : undefined}
                        className={`flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group text-zinc-400 hover:bg-white/5 hover:text-white ${collapsed ? "justify-center" : ""}`}
                      >
                        <item.icon className={`w-4 h-4 shrink-0 group-hover:text-amber-300 ${item.action === 'hermes' ? 'text-purple-400 group-hover:text-purple-300' : 'text-zinc-500'}`} />
                        {!collapsed && <span>{item.name}</span>}
                      </button>
                    );
                  }

                  const isActive = item.exact 
                    ? pathname === item.href 
                    : pathname.startsWith(item.href);
                    
                  const LinkEl = item.external ? "a" : Link;
                  const linkProps = item.external 
                    ? { href: item.href, target: "_blank", rel: "noopener noreferrer" }
                    : { href: item.href };

                  return (
                    <LinkEl
                      key={item.name}
                      {...linkProps}
                      title={collapsed ? item.name : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                        isActive 
                          ? "bg-amber-500/10 text-amber-400" 
                          : "text-zinc-400 hover:bg-white/5 hover:text-white"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                      {!collapsed && <span>{item.name}</span>}
                      {!collapsed && item.external && (
                        <span className="ml-auto text-[9px] uppercase tracking-wider bg-white/10 px-1.5 py-0.5 rounded text-zinc-400">Ext</span>
                      )}
                    </LinkEl>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!collapsed && (
        <div className="p-4 mt-auto border-t border-white/5 bg-[#050508]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {auth.name ? auth.name.substring(0, 2).toUpperCase() : "OP"}
              </span>
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-sm text-white font-medium truncate">{auth.name || "Operator"}</span>
              <span className="text-[10px] font-mono text-amber-500/80 truncate">{auth.role}</span>
            </div>
            <button 
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
                window.location.href = '/';
              }}
              title="Cerrar sesión"
              className="p-2 rounded-md hover:bg-white/10 text-zinc-500 hover:text-white transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

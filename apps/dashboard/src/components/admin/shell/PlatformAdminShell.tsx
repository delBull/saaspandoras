'use client';

/**
 * 🏛️ PLATFORM ADMIN SHELL (F9.3)
 * apps/dashboard/src/components/admin/shell/PlatformAdminShell.tsx
 *
 * Master shell layout for Pandora's Platform Governance Plane.
 * Features the Hermes Portal drawer architecture, responsive sidebar (w-16/w-64),
 * topbar with status badges, and unified inspector.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Cpu,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  Wrench,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Zap,
  Briefcase,
  Compass,
} from 'lucide-react';
import { PlatformInspectorProvider } from '../inspector/PlatformInspectorContext';
import { PlatformInspectorDrawer } from '../inspector/PlatformInspectorDrawer';
import { PlatformActor } from '@/lib/dash-contracts/admin';

interface PlatformAdminShellProps {
  actor: PlatformActor;
  children: React.ReactNode;
  activeSection?: string;
}

export function PlatformAdminShell({ actor, children, activeSection = 'overview' }: PlatformAdminShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const pathname = usePathname();

  const platformNavItems = [
    {
      id: 'overview',
      label: 'HQ Overview',
      href: '/admin',
      icon: LayoutDashboard,
      active: activeSection === 'overview' || pathname === '/admin',
    },
    {
      id: 'guides',
      label: 'Guías del Ecosistema',
      href: '/admin?tab=guides',
      icon: Compass,
      active: activeSection === 'guides' || pathname.includes('tab=guides'),
    },
    {
      id: 'billing',
      label: 'GPU & Contabilidad',
      href: '/admin?tab=billing',
      icon: Cpu,
      active: activeSection === 'billing' || pathname.includes('tab=billing'),
    },
    {
      id: 'crm',
      label: 'HQ Deal Room',
      href: '/admin?tab=crm',
      icon: Briefcase,
      active: activeSection === 'crm' || pathname.includes('tab=crm'),
    },
    {
      id: 'identity',
      label: 'Identidad & RBAC',
      href: 'https://nexus.pandoras.finance/settings',
      icon: UserCheck,
      active: activeSection === 'identity' || pathname.includes('/nexus/settings'),
    },
    {
      id: 'security',
      label: 'Seguridad & Bóveda',
      href: '/admin?tab=security',
      icon: ShieldAlert,
      active: activeSection === 'security' || pathname.includes('tab=security'),
    },
    {
      id: 'operations',
      label: 'Operaciones & Fleet',
      href: '/admin?tab=operations',
      icon: Wrench,
      active: activeSection === 'operations' || pathname.includes('tab=operations'),
    },
  ];

  const tenantNavItems = [
    {
      id: 'tenants',
      label: 'Directorio Tenants',
      href: '/admin?tab=tenants',
      icon: Building2,
      active: activeSection === 'tenants' || pathname.includes('tab=tenants'),
      badge: 'Read-Only',
    },
    {
      id: 'rwa',
      label: 'Pipeline RWA',
      href: '/admin?tab=rwa',
      icon: ShieldCheck,
      active: activeSection === 'rwa' || pathname.includes('tab=rwa'),
      badge: 'Deal Room',
    },
  ];

  return (
    <PlatformInspectorProvider>
      <div className="h-screen w-screen bg-[#08080A] text-white font-sans flex relative overflow-hidden">
        {/* Responsive Sidebar */}
        <aside
          className={`h-full bg-[#0C0C12] border-r border-white/[0.08] flex flex-col justify-between transition-all duration-300 z-30 shrink-0 select-none ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Sidebar Header */}
          <div>
            <div className="h-16 flex items-center px-4 border-b border-white/[0.08] justify-between">
              <Link href="/admin" className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-purple-900/30 shrink-0">
                  🏛️
                </div>
                {!isCollapsed && (
                  <div className="truncate">
                    <span className="font-semibold text-xs text-white tracking-wide block">
                      PANDORA&apos;S OS
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono block">
                      Platform Governance
                    </span>
                  </div>
                )}
              </Link>
            </div>

            {/* Navigation Lists */}
            <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-none">
              {/* Category 1: Platform Internal */}
              <div>
                {!isCollapsed && (
                  <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-2 block">
                    Plataforma (Uso Interno)
                  </span>
                )}
                <nav className="space-y-1">
                  {platformNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          item.active
                            ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-purple-400' : 'text-zinc-400'}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Category 2: Tenant Oversight */}
              <div>
                {!isCollapsed && (
                  <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold mb-2 block">
                    Supervisión Tenants
                  </span>
                )}
                <nav className="space-y-1">
                  {tenantNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                          item.active
                            ? 'bg-cyan-600/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${item.active ? 'text-cyan-400' : 'text-zinc-400'}`} />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!isCollapsed && item.badge && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>

          {/* Sidebar Footer & Collapse Toggle */}
          <div className="p-3 border-t border-white/[0.08] space-y-2">
            <Link
              href="https://nexus.pandoras.finance"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
              title={isCollapsed ? 'Volver a Nexus' : undefined}
            >
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              {!isCollapsed && <span className="truncate">Volver a Nexus</span>}
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all"
              aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Topbar */}
          <header className="h-16 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0C0C12]/80 backdrop-blur-md z-20 shrink-0">
            {/* Breadcrumb / Section info */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xs font-mono text-zinc-500">PLATFORM GOVERNANCE</span>
              <span className="text-zinc-600">/</span>
              <h1 className="text-sm font-semibold text-white truncate">
                {activeSection === 'overview' && 'HQ Global Overview'}
                {activeSection === 'billing' && 'Hermes GPU Compute & Internal Billing'}
                {activeSection === 'tenants' && 'Directorio Maestro de Tenants'}
                {activeSection === 'rwa' && 'Pipeline RWA & Capital Structuring'}
                {activeSection === 'crm' && 'HQ Deal Room (B2B CRM)'}
                {activeSection === 'security' && 'Seguridad & Bóveda Soberana K25'}
                {activeSection === 'operations' && 'Operaciones & Serverless Fleet'}
              </h1>
            </div>

            {/* Status Pills & Actor Badge */}
            <div className="flex items-center gap-3">
              {/* Network Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Base Mainnet
              </div>

              {/* Pooler Pill */}
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono text-cyan-400">
                <Zap className="w-3 h-3" />
                Neon Pooler
              </div>

              {/* Actor Role Badge */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/[0.05] border border-white/[0.1] text-xs">
                <span className="text-sm">
                  {actor.role === 'SUPER_ADMIN' ? '👑' : '🛡️'}
                </span>
                <span className="font-semibold text-white font-mono text-[11px]">
                  {actor.role}
                </span>
              </div>
            </div>
          </header>

          {/* Body Content */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-zinc-800">
            {children}
          </main>

          {/* Footbar */}
          <footer className="h-9 px-6 border-t border-white/[0.08] bg-[#0C0C12]/90 backdrop-blur-md flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0">
            <div className="flex items-center gap-4">
              <span>Hermes Kernel: v2.4-Sovereign</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Growth OS: Active Fabric</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">All Systems Nominal</span>
            </div>
          </footer>
        </div>

        {/* Universal Portal Drawer */}
        <PlatformInspectorDrawer />
      </div>
    </PlatformInspectorProvider>
  );
}

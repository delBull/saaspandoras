'use client';

/**
 * 🏛️ Growth OS Sidebar & Mobile Drawer Navigation
 * apps/dashboard/src/app/growth-os/organizations/[id]/components/GrowthOsSidebar.tsx
 *
 * Implements desktop collapsible sidebar and mobile slide-over drawer with backdrop blur,
 * matching Hermes Portal's modern aesthetic and enabling cross-plane hybrid navigation.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Users,
  Mail,
  Sparkles,
  Wallet,
  ShieldAlert,
  Activity,
  Bot,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  FileText,
  LineChart,
  Workflow
} from 'lucide-react';

interface GrowthOsSidebarProps {
  slugId: string;
  orgName: string;
  hasHermes: boolean;
}

export function GrowthOsSidebar({ slugId, orgName, hasHermes }: GrowthOsSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const basePath = `/growth-os/organizations/${slugId}`;

  const navItems = [
    { label: 'Overview', href: '', icon: LayoutDashboard, section: 'ops' },
    { label: 'Mission Control', href: '/missions', icon: Target, section: 'ops' },
    { label: 'Pipeline & CRM', href: '/pipeline', icon: Users, section: 'ops' },
    { label: 'Email Marketing', href: '/email', icon: Mail, section: 'ops' },
    { label: 'NFT Lab & Passes', href: '/nft-lab', icon: Sparkles, section: 'ops' },
    { label: 'Pay & Finanzas', href: '/finance', icon: Wallet, section: 'ops' },
    { label: 'Governance Center', href: '/governance', icon: ShieldAlert, section: 'gov' },
    { label: 'Activity & Audit', href: '/activity', icon: Activity, section: 'gov' },
  ];

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    return href === '' ? pathname === basePath : pathname.startsWith(fullPath);
  };

  const opsItems = navItems.filter((i) => i.section === 'ops');
  const govItems = navItems.filter((i) => i.section === 'gov');

  return (
    <>
      {/* ── MOBILE HEADER (NAVBAR) ── */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 bg-slate-900 border-b border-slate-800 shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-md">
            G
          </div>
          <div>
            <h2 className="text-white font-bold text-sm leading-tight">Growth OS</h2>
            <p className="text-slate-400 text-xs truncate max-w-[150px]">{orgName}</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
          aria-label="Abrir Menú"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── MOBILE SLIDE-OVER DRAWER & BACKDROP ── */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex-1 flex flex-col max-w-[280px] w-full bg-slate-950 border-r border-slate-800 text-slate-300 z-50 h-full shadow-2xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-xs">
                  G
                </div>
                <span className="text-white font-bold text-sm tracking-tight">Growth OS</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Cerrar Menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              <div className="px-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Operaciones
              </div>
              {opsItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={`${basePath}${item.href}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              <div className="pt-3 px-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Gobernanza & Auditoría
              </div>
              {govItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={`${basePath}${item.href}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Cross-Plane Hybrid Links (Mobile) */}
              <div className="pt-4 mt-4 border-t border-slate-800 space-y-1.5">
                <div className="px-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Navegación Institucional
                </div>
                {hasHermes && (
                  <Link
                    href={`/portal/${slugId}`}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/20 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      <span>Hermes Portal</span>
                    </div>
                    <ExternalLink className="w-3 h-3 text-emerald-400/70" />
                  </Link>
                )}
                <Link
                  href={`/profile/projects/${slugId}/manage`}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/20 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Protocol Tokenomics</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-indigo-400/70" />
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                G
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden">
                  <h2 className="text-white font-bold text-base tracking-tight truncate">Growth OS</h2>
                  <p className="text-xs text-slate-400 truncate">{orgName}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="px-2 pt-1 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Operaciones
            </div>
          )}
          {opsItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
                } rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-slate-400'} shrink-0`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {!isCollapsed && (
            <div className="px-2 pt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Gobernanza & Auditoría
            </div>
          )}
          {govItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'
                } rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-violet-400' : 'text-slate-400'} shrink-0`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Cross-Plane Hybrid Links (Desktop) */}
          <div className={`mt-5 pt-4 border-t border-slate-800/80 ${isCollapsed ? 'px-0 space-y-2' : 'px-1 space-y-1.5'}`}>
            {!isCollapsed && (
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 px-1">
                Capacidades de Negocio
              </div>
            )}
            {hasHermes && (
              <Link
                href={`/portal/${slugId}`}
                title={isCollapsed ? 'Hermes Portal' : undefined}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
                } rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-all text-xs font-semibold`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                  {!isCollapsed && <span className="truncate">Hermes Portal</span>}
                </div>
                {!isCollapsed && <ExternalLink className="w-3 h-3 text-emerald-400/70 shrink-0" />}
              </Link>
            )}
            <Link
              href={`/profile/projects/${slugId}/manage`}
              title={isCollapsed ? 'Protocol Tokenomics' : undefined}
              className={`flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              } rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 transition-all text-xs font-semibold`}
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                {!isCollapsed && <span className="truncate">Tokenomics</span>}
              </div>
              {!isCollapsed && <ExternalLink className="w-3 h-3 text-indigo-400/70 shrink-0" />}
            </Link>
          </div>
        </nav>

        {/* Collapse toggle button */}
        <div className="p-3 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expandir Menú' : 'Colapsar Menú'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}

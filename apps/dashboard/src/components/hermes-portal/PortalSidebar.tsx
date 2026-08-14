'use client';

/**
 * PortalSidebar — Phase 6.1 & 6.5.2.2 Mobile Polish
 * 
 * Navigation for the Hermes Customer Operating Console.
 * Item visibility depends on permissions (UX only — server still enforces).
 * No hardcoded tenants. Identical structure for every organization.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PortalPermission } from '@/lib/portal/permissions';
import type { PortalOrganization } from '@/lib/portal/portal-types';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Fingerprint,
  BookOpen,
  Plug,
  MessageSquare,
  Activity,
  Shield,
  GitBranch,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredPermission: PortalPermission;
  section?: 'primary' | 'secondary';
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Overview',
    href: '',
    icon: LayoutDashboard,
    requiredPermission: 'organization.read',
    section: 'primary',
  },
  {
    label: 'Identity',
    href: '/identity',
    icon: Fingerprint,
    requiredPermission: 'identity.read',
    section: 'primary',
  },
  {
    label: 'Knowledge',
    href: '/knowledge',
    icon: BookOpen,
    requiredPermission: 'knowledge.read',
    section: 'primary',
  },
  {
    label: 'Channels',
    href: '/channels',
    icon: Plug,
    requiredPermission: 'channels.read',
    section: 'primary',
  },
  {
    label: 'Conversations',
    href: '/conversations',
    icon: MessageSquare,
    requiredPermission: 'conversations.read',
    section: 'primary',
  },
  {
    label: 'Activity',
    href: '/activity',
    icon: Activity,
    requiredPermission: 'activity.read',
    section: 'primary',
  },
  {
    label: 'Policies',
    href: '/policies',
    icon: Shield,
    requiredPermission: 'policies.read',
    section: 'secondary',
  },
  {
    label: 'Journeys',
    href: '/journeys',
    icon: GitBranch,
    requiredPermission: 'journeys.read',
    section: 'secondary',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermission: 'settings.read',
    section: 'secondary',
  },
  {
    label: 'Add-ons',
    href: '/addons',
    icon: Boxes,
    requiredPermission: 'organization.read', // Allow everyone to at least see the marketplace
    section: 'secondary',
  },
];

interface PortalSidebarProps {
  organization: PortalOrganization;
  permissions: PortalPermission[];
  collapsed: boolean;
  onToggle: () => void;
  organizationSlug: string;
  onNavClick?: () => void;
}

export function PortalSidebar({
  organization,
  permissions,
  collapsed,
  onToggle,
  organizationSlug,
  onNavClick,
}: PortalSidebarProps) {
  const pathname = usePathname();
  const basePath = `/portal/${organizationSlug}`;

  const visibleItems = NAV_ITEMS.filter(item =>
    permissions.includes(item.requiredPermission)
  );

  const primaryItems = visibleItems.filter(i => i.section === 'primary');
  const secondaryItems = visibleItems.filter(i => i.section === 'secondary');

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    return href === '' ? pathname === basePath : pathname.startsWith(fullPath);
  };

  return (
    <>
      {/* MOBILE SIDEBAR (Drawer) */}
      <aside
        className="md:hidden h-screen bg-[#0C0C12] border-r border-white/[0.08] flex flex-col z-30 w-[260px]"
      >
        <div className="flex items-center h-16 px-4 border-b border-white/[0.06] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-white font-semibold text-sm leading-tight truncate">Hermes</p>
            <p className="text-white/40 text-xs truncate">{organization.name}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <ul className="space-y-1">
            {primaryItems.map(item => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={`${basePath}${item.href}`}
                    onClick={() => onNavClick?.()}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-150 min-h-[44px] ${
                      active ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-violet-400 shrink-0' : 'shrink-0'} />
                    <span className="truncate font-medium">{item.label}</span>
                    {active && <span className="ml-auto w-2 h-2 rounded-full bg-violet-400 shrink-0" />}
                  </Link>
                </li>
              );
            })}
          </ul>
          {secondaryItems.length > 0 && <div className="my-3 mx-3 border-t border-white/[0.06]" />}
          <ul className="space-y-1">
            {secondaryItems.map(item => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={`${basePath}${item.href}`}
                    onClick={() => onNavClick?.()}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-150 min-h-[44px] ${
                      active ? 'bg-white/[0.08] text-white font-medium' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* DESKTOP SIDEBAR (HermesWorkbench Icon Style) */}
      <aside className={`hidden md:flex flex-col items-center py-3 h-screen bg-[#09090C] border-r border-white/10 shrink-0 z-30 select-none transition-all duration-300 ${collapsed ? 'w-16' : 'w-64 items-start px-3'}`}>
        <div className={`mb-4 ${collapsed ? '' : 'flex items-center gap-3 px-2 w-full mt-2'}`}>
            <div className="w-8 h-8 shrink-0 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-lg text-purple-400">
                <span className="text-xs font-bold font-mono">H</span>
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <div className="text-sm font-semibold text-white truncate">Hermes</div>
                <div className="text-[10px] text-zinc-500 font-mono truncate">{organization.name}</div>
              </div>
            )}
        </div>
        
        <div className={`flex-1 flex flex-col gap-0.5 w-full ${collapsed ? 'items-center' : 'px-1'}`}>
            {primaryItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={`${basePath}${item.href}`}
                        className={`relative flex ${collapsed ? 'flex-col items-center justify-center p-3 w-14 h-14' : 'items-center justify-start px-3 py-3 w-full h-11 gap-3'} rounded-xl transition-all group ${
                            active 
                                ? 'text-purple-400 bg-purple-500/10 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]' 
                                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                        }`}
                        title={collapsed ? item.label : undefined}
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        {collapsed ? (
                           <span className="text-[9px] font-mono mt-1 opacity-70 group-hover:opacity-100">{item.label.slice(0, 4)}</span>
                        ) : (
                           <span className="text-sm font-medium tracking-wide opacity-90">{item.label}</span>
                        )}
                    </Link>
                );
            })}
            
            {secondaryItems.length > 0 && <div className={`w-8 h-px bg-white/10 my-2 ${!collapsed && 'w-full'}`} />}
            
            {secondaryItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                    <Link
                        key={item.href}
                        href={`${basePath}${item.href}`}
                        className={`relative flex ${collapsed ? 'flex-col items-center justify-center p-3 w-14 h-14' : 'items-center justify-start px-3 py-3 w-full h-11 gap-3'} rounded-xl transition-all group ${
                            active 
                                ? 'text-purple-400 bg-purple-500/10 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.15)]' 
                                : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                        }`}
                        title={collapsed ? item.label : undefined}
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        {collapsed ? (
                           <span className="text-[9px] font-mono mt-1 opacity-70 group-hover:opacity-100">{item.label.slice(0, 4)}</span>
                        ) : (
                           <span className="text-sm font-medium tracking-wide opacity-90">{item.label}</span>
                        )}
                    </Link>
                );
            })}
        </div>
        
        <div className={`mt-auto mb-4 border-t border-white/10 pt-4 w-full flex ${collapsed ? 'justify-center' : 'justify-end px-4'}`}>
            <button 
                onClick={onToggle}
                className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-white/5"
                title={collapsed ? "Expandir Menú" : "Colapsar Menú"}
            >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
        </div>
      </aside>
    </>
  );
}

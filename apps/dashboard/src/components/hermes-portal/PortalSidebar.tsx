'use client';

/**
 * PortalSidebar — Canonical Hermes Operating System Navigation
 * src/components/hermes-portal/PortalSidebar.tsx
 * 
 * Clean, compact icon-focused navigation for the Hermes Customer Operating Console.
 * Media Studio is included as the canonical Phase 7+ AI media generation suite.
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
  Sparkles,
  Zap,
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
    label: 'Media Studio',
    href: '/media',
    icon: Sparkles,
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
    requiredPermission: 'organization.read',
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

  const isActive = (href: string) => {
    const fullPath = `${basePath}${href}`;
    if (href === '') {
      return pathname === basePath || pathname === `${basePath}/`;
    }
    return pathname.startsWith(fullPath);
  };

  const visibleItems = NAV_ITEMS.filter((item) =>
    permissions.includes(item.requiredPermission)
  );

  const primaryItems = visibleItems.filter((i) => i.section === 'primary' || !i.section);
  const secondaryItems = visibleItems.filter((i) => i.section === 'secondary');

  return (
    <>
      {/* MOBILE DRAWER CONTENT */}
      <aside
        className="md:hidden flex flex-col w-[280px] h-full bg-[#0C0C12] border-r border-white/[0.08] text-white p-4 overflow-y-auto"
        role="navigation"
        aria-label="Menú principal móvil"
      >
        <div className="flex items-center gap-3 px-2 py-3 mb-4 border-b border-white/[0.08]">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate text-white">{organization.name}</p>
            <p className="text-[10px] text-zinc-400 font-mono">Hermes AI OS</p>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                onClick={() => onNavClick?.()}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]
                  ${active
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }
                `}
              >
                <Icon size={18} className={active ? 'text-purple-400' : 'text-zinc-400'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
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
                <div className="text-sm font-semibold text-white truncate">Hermes OS</div>
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
                className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
                title={collapsed ? "Expandir Menú" : "Colapsar Menú"}
            >
                {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
        </div>
      </aside>
    </>
  );
}

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
    <aside
      className="h-screen bg-[#0C0C12] border-r border-white/[0.08] flex flex-col z-30 transition-all duration-300 w-[260px] md:w-auto"
      style={{ width: typeof window !== 'undefined' && window.innerWidth < 768 ? '260px' : (collapsed ? '72px' : '260px') }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center h-16 px-4 border-b border-white/[0.06] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shrink-0 shadow-lg">
          <span className="text-white text-xs font-bold">H</span>
        </div>
        {(!collapsed || typeof window !== 'undefined' && window.innerWidth < 768) && (
          <div className="ml-3 overflow-hidden">
            <p className="text-white font-semibold text-sm leading-tight truncate">Hermes</p>
            <p className="text-white/40 text-xs truncate">{organization.name}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {/* Primary items */}
        <ul className="space-y-1">
          {primaryItems.map(item => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={`${basePath}${item.href}`}
                  onClick={() => onNavClick?.()}
                  className={`
                    flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-150 min-h-[44px]
                    ${active
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 font-semibold shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
                    }
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    size={18}
                    className={active ? 'text-violet-400 shrink-0' : 'shrink-0'}
                  />
                  {(!collapsed || typeof window !== 'undefined' && window.innerWidth < 768) && (
                    <span className="truncate font-medium">{item.label}</span>
                  )}
                  {active && (!collapsed || typeof window !== 'undefined' && window.innerWidth < 768) && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Separator */}
        {secondaryItems.length > 0 && (
          <div className="my-3 mx-3 border-t border-white/[0.06]" />
        )}

        {/* Secondary items */}
        <ul className="space-y-1">
          {secondaryItems.map(item => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={`${basePath}${item.href}`}
                  onClick={() => onNavClick?.()}
                  className={`
                    flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm transition-all duration-150 min-h-[44px]
                    ${active
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                    }
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {(!collapsed || typeof window !== 'undefined' && window.innerWidth < 768) && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="hidden md:block p-2 border-t border-white/[0.06] shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-all text-xs font-medium min-h-[40px]"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

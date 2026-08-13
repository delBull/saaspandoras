'use client';

/**
 * PortalShell — Phase 6.1 & 6.5.2.2 Mobile Polish
 * components/hermes-portal/PortalShell.tsx
 * 
 * The visual frame for the Hermes Customer Operating Console.
 * Mobile-first responsive layout with slide-over backdrop drawer.
 */

import React, { useState } from 'react';
import type { PortalContext } from '@/lib/portal/portal-types';
import { PortalSidebar } from '@/components/hermes-portal/PortalSidebar';
import { PortalHeader } from '@/components/hermes-portal/PortalHeader';
import { Menu, X } from 'lucide-react';

interface PortalShellProps {
  context: PortalContext;
  children: React.ReactNode;
}

export function PortalShell({ context, children }: PortalShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#07070B] text-white font-sans flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 bg-[#0C0C12] border-b border-white/[0.08] sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-bold">H</span>
          </div>
          <span className="font-semibold text-sm tracking-tight text-white">{context.organization.name}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-white/70 hover:text-white rounded-lg bg-white/[0.05] active:bg-white/10 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Slide-Over Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar & Mobile Slide-Over Drawer */}
      <div className={`
        fixed top-0 bottom-0 left-0 z-50 transition-transform duration-300 md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <PortalSidebar
          organization={context.organization}
          permissions={context.tenant.permissions}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(c => !c)}
          organizationSlug={context.organization.slug}
          onNavClick={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 w-full"
        style={{ marginLeft: 0 }}
      >
        <div className="hidden md:block" style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}>
          <PortalHeader
            organization={context.organization}
            role={context.tenant.role}
            organizationSlug={context.organization.slug}
          />
        </div>

        {/* Page content */}
        <main
          className="flex-1 p-3 sm:p-6 lg:p-8 transition-all duration-300"
          style={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 768 ? (sidebarCollapsed ? '72px' : '260px') : '0px' }}
        >
          <div className="md:hidden mb-4">
            <PortalHeader
              organization={context.organization}
              role={context.tenant.role}
              organizationSlug={context.organization.slug}
            />
          </div>
          {children}
        </main>
      </div>

      {/* Background ambient gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute top-0 left-0 w-[450px] md:w-[600px] h-[450px] md:h-[600px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            transform: 'translate(-30%, -30%)',
          }}
        />
      </div>
    </div>
  );
}

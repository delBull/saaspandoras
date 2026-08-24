'use client';

/**
 * PortalShell — Phase 6.1 & Hermes Channel Mesh (Fase 1: Mobile Web Portal)
 * components/hermes-portal/PortalShell.tsx
 * 
 * The visual frame for the Hermes Customer Operating Console.
 * Mobile-first responsive layout with slide-over backdrop drawer.
 * Reference: DOCUMENTACIÓN/Hermes/ROADMAP_HERMES_CHANNEL_MESH.md
 */

import React, { useState } from 'react';
import type { PortalContext } from '@/lib/portal/portal-types';
import { PortalSidebar } from '@/components/hermes-portal/PortalSidebar';
import { PortalHeader } from '@/components/hermes-portal/PortalHeader';
import { PortalInspector } from '@/components/hermes-portal/PortalInspector';
import { HermesTerminalBar } from '@/components/hermes-portal/HermesTerminalBar';
import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface PortalShellProps {
  context: PortalContext;
  children: React.ReactNode;
}

export function PortalShell({ context, children }: PortalShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(true);
  const [inspectorExpanded, setInspectorExpanded] = useState(true);
  const pathname = usePathname();

  const toggleSidebar = () => {
    const newCollapsed = !desktopCollapsed;
    setDesktopCollapsed(newCollapsed);
    if (!newCollapsed) setInspectorExpanded(false);
  };

  const toggleInspector = () => {
    const newExpanded = !inspectorExpanded;
    setInspectorExpanded(newExpanded);
    if (newExpanded) setDesktopCollapsed(true);
  };
  
  // Inspector is hidden on the Overview page so the Hermes Intelligence Chat can take its place
  const isOverview = pathname === `/portal/${context.organization.slug}`;

  return (
    <div className="min-h-screen bg-[#08080A] text-white font-sans flex relative overflow-x-hidden">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 bg-[#0C0C12] border-b border-white/[0.08] fixed top-0 w-full z-40 backdrop-blur-md">
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
        fixed top-0 bottom-0 left-0 z-50 transition-transform duration-300 md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <PortalSidebar
          organization={context.organization}
          permissions={context.tenant.permissions}
          collapsed={desktopCollapsed}
          onToggle={toggleSidebar}
          organizationSlug={context.organization.slug}
          onNavClick={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main content area (including Header and Inspector) */}
      <div className="flex-1 flex flex-col min-h-screen w-full relative pt-14 md:pt-0">
        
        {/* Global Top Bar (Spans full width above Inspector) */}
        <div className="hidden md:block z-20 sticky top-0">
          <PortalHeader
            organization={context.organization}
            role={context.tenant.role}
            organizationSlug={context.organization.slug}
          />
        </div>

        {/* Content Row: Main Page + Optional Inspector */}
        <div className="flex-1 flex flex-row overflow-hidden relative">
          <main className="flex-1 overflow-y-auto pb-20 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3rem)] mr-0 sm:mr-2">
            {children}
          </main>

          {/* Desktop Right Inspector - Hidden on Overview */}
          {!isOverview && (
            <div className={`hidden xl:block shrink-0 pr-6 pl-2 pt-6 pb-20 transition-all duration-300 ${inspectorExpanded ? 'w-[400px]' : 'w-[80px]'}`}>
              <PortalInspector 
                organization={context.organization} 
                expanded={inspectorExpanded}
                onToggle={toggleInspector}
              />
            </div>
          )}
        </div>
      </div>

      {/* Global Terminal Bar sticky at bottom */}
      <HermesTerminalBar sidebarCollapsed={desktopCollapsed} />

    </div>
  );
}

'use client';

/**
 * PortalShell — Phase 6.1
 * components/hermes-portal/PortalShell.tsx
 * 
 * The visual frame for the Hermes Customer Operating Console.
 * 
 * Receives already-authorized context from the Server Layout.
 * Does NOT determine authorization — that happened server-side.
 * 
 * Design: "Mission Control for an AI Operating System"
 * Premium + Cognitive + Operational
 */

import React, { useState } from 'react';
import type { PortalContext } from '@/lib/portal/portal-types';
import { PortalSidebar } from './PortalSidebar';
import { PortalHeader } from './PortalHeader';

interface PortalShellProps {
  context: PortalContext;
  children: React.ReactNode;
}

export function PortalShell({ context, children }: PortalShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#07070B] text-white font-sans flex">
      {/* Sidebar */}
      <PortalSidebar
        organization={context.organization}
        permissions={context.tenant.permissions}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        organizationSlug={context.organization.slug}
      />

      {/* Main content area */}
      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '260px' }}
      >
        {/* Header */}
        <PortalHeader
          organization={context.organization}
          role={context.tenant.role}
          organizationSlug={context.organization.slug}
        />

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Background ambient gradient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-5"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            transform: 'translate(-30%, -30%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-3"
          style={{
            background: 'radial-gradient(circle, #2563eb 0%, transparent 70%)',
            transform: 'translate(30%, 30%)',
          }}
        />
      </div>
    </div>
  );
}

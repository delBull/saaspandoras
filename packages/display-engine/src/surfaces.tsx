"use client";

import React, { ReactNode } from "react";
import { SovereignDisplayProvider } from "./provider";
import { SovereignDisplayProfile } from "./types";

export interface SurfaceProviderProps {
  children: ReactNode;
  initialProfile?: SovereignDisplayProfile;
}

/**
 * Wrapper localizado para la superficie del Dashboard administrativo.
 * Inyecta el SovereignDisplayProvider sin contaminar el RootLayout global.
 */
export const DashboardProvider = ({ children, initialProfile }: SurfaceProviderProps) => {
  return (
    <SovereignDisplayProvider initialProfile={initialProfile}>
      {children}
    </SovereignDisplayProvider>
  );
};

/**
 * Wrapper localizado para la superficie de Nexus (Auth/Deals/Gate).
 */
export const NexusProvider = ({ children, initialProfile }: SurfaceProviderProps) => {
  return (
    <SovereignDisplayProvider initialProfile={initialProfile}>
      {children}
    </SovereignDisplayProvider>
  );
};

/**
 * Wrapper localizado para los Portales de Tenants / Deal Rooms (ej. S'Narai Portal).
 */
export const PortalProvider = ({ children, initialProfile }: SurfaceProviderProps) => {
  return (
    <SovereignDisplayProvider initialProfile={initialProfile}>
      {children}
    </SovereignDisplayProvider>
  );
};

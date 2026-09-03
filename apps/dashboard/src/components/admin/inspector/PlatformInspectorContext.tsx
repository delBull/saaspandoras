'use client';

/**
 * 🏛️ PLATFORM INSPECTOR CONTEXT (F9.3)
 * apps/dashboard/src/components/admin/inspector/PlatformInspectorContext.tsx
 *
 * Universal drawer inspector context for the Platform Governance Plane,
 * mirroring the Hermes Portal Drawer architecture.
 */

import React, { createContext, useContext, useState } from 'react';

export type PlatformInspectorTargetType = 
  | 'TENANT' 
  | 'GPU_EVENT' 
  | 'RWA_DEAL' 
  | 'COLLABORATOR' 
  | 'ENDPOINT'
  | 'SYSTEM_METRIC';

export interface PlatformInspectorData {
  type: PlatformInspectorTargetType;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'violet' | 'amber' | 'blue' | 'zinc' | 'rose';
  attributes?: Record<string, string | number | boolean>;
  rawPayload?: any;
  actionHref?: string;
  actionLabel?: string;
}

interface PlatformInspectorContextType {
  data: PlatformInspectorData | null;
  isOpen: boolean;
  inspect: (data: PlatformInspectorData | null) => void;
  close: () => void;
}

const PlatformInspectorContext = createContext<PlatformInspectorContextType>({
  data: null,
  isOpen: false,
  inspect: () => {},
  close: () => {},
});

export function PlatformInspectorProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PlatformInspectorData | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const inspect = (item: PlatformInspectorData | null) => {
    if (item) {
      setData(item);
      setIsOpen(true);
    } else {
      setData(null);
      setIsOpen(false);
    }
  };

  const close = () => {
    setIsOpen(false);
  };

  return (
    <PlatformInspectorContext.Provider value={{ data, isOpen, inspect, close }}>
      {children}
    </PlatformInspectorContext.Provider>
  );
}

export function usePlatformInspector() {
  return useContext(PlatformInspectorContext);
}

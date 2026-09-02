'use client';

import React, { createContext, useContext, useState } from 'react';

export interface InspectorData {
  title?: string;
  type?: string;
  description?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'violet' | 'amber' | 'blue' | 'zinc';
  attributes?: Record<string, string>;
  complianceNote?: string;
}

interface InspectorContextType {
  data: InspectorData | null;
  inspect: (data: InspectorData | null) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  toggle: () => void;
}

const InspectorContext = createContext<InspectorContextType>({
  data: null,
  inspect: () => {},
  expanded: true,
  setExpanded: () => {},
  toggle: () => {},
});

export function InspectorProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<InspectorData | null>(null);
  const [expanded, setExpanded] = useState<boolean>(true);

  const toggle = () => setExpanded((prev) => !prev);

  return (
    <InspectorContext.Provider value={{ data, inspect: setData, expanded, setExpanded, toggle }}>
      {children}
    </InspectorContext.Provider>
  );
}

export function useInspector() {
  return useContext(InspectorContext);
}

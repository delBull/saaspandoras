'use client';

import React from 'react';
import { HermesModulePlaceholder } from '@/components/hermes-portal/HermesModulePlaceholder';
import { GitBranch } from 'lucide-react';

export default function JourneysPage() {
  return (
    <HermesModulePlaceholder 
      title="Agent Journeys"
      description="Diseña flujos de trabajo autónomos. Define las metas estratégicas que Hermes debe perseguir (ej. Captar Leads, Resolver Tickets)."
      icon={GitBranch}
      features={[
        "Orquestación de tareas complejas",
        "Manejo de estado multi-paso",
        "Condiciones de éxito (Goal engine)",
        "Fallback a operadores humanos"
      ]}
    />
  );
}

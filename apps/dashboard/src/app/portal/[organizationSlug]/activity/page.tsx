'use client';

import React from 'react';
import { HermesModulePlaceholder } from '@/components/hermes-portal/HermesModulePlaceholder';
import { Activity } from 'lucide-react';

export default function ActivityPage() {
  return (
    <HermesModulePlaceholder 
      title="Event Spine & Activity"
      description="El libro mayor inmutable de Hermes. Todo lo que hace el agente, las decisiones que toma y las acciones que ejecuta se registran aquí para total transparencia."
      icon={Activity}
      features={[
        "Registro inmutable de decisiones",
        "Trazabilidad cognitiva en tiempo real",
        "Métricas operativas y latencias",
        "Exportación de logs de cumplimiento"
      ]}
    />
  );
}

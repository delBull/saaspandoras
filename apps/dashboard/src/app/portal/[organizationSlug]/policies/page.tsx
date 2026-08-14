'use client';

import React from 'react';
import { HermesModulePlaceholder } from '@/components/hermes-portal/HermesModulePlaceholder';
import { Shield } from 'lucide-react';

export default function PoliciesPage() {
  return (
    <HermesModulePlaceholder 
      title="Cognitive Policies"
      description="El motor de reglas y gobernanza de Hermes. Aquí defines las barreras de protección, el tono de voz y los límites operativos del agente."
      icon={Shield}
      features={[
        "Filtros de contenido y lenguaje",
        "Reglas de escalamiento a humanos",
        "Límites transaccionales y de ejecución",
        "Alineación con la marca y compliance"
      ]}
    />
  );
}

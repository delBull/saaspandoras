'use client';

import React from 'react';
import { HermesModulePlaceholder } from '@/components/hermes-portal/HermesModulePlaceholder';
import { Boxes } from 'lucide-react';

export default function AddonsPage() {
  return (
    <HermesModulePlaceholder 
      title="Add-ons & Integrations"
      description="El Marketplace cognitivo de Hermes. Conecta y extiende las capacidades de tu agente con módulos especializados de terceros o herramientas internas de Pandora's."
      icon={Boxes}
      features={[
        "Instalación de paquetes 1-clic",
        "Conectores on-chain (Thirdweb, Uniswap)",
        "Sistemas de Gobernanza y DAO integrados",
        "Orquestadores externos de flujo de trabajo"
      ]}
    />
  );
}

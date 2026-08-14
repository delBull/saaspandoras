'use client';

import React from 'react';
import { HermesModulePlaceholder } from '@/components/hermes-portal/HermesModulePlaceholder';
import { Plug } from 'lucide-react';

export default function ChannelsPage() {
  return (
    <HermesModulePlaceholder 
      title="Omnichannel Mesh"
      description="Conecta a Hermes con el mundo exterior. Configura en qué canales escucha y responde tu agente operativo."
      icon={Plug}
      features={[
        "Integración con Telegram TMA & Bots",
        "Webhooks y APIs custom",
        "Discord y plataformas sociales",
        "Widgets de soporte integrados en web"
      ]}
    />
  );
}

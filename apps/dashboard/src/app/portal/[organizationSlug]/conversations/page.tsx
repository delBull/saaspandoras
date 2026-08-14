'use client';

import React from 'react';
import { HermesModulePlaceholder } from '@/components/hermes-portal/HermesModulePlaceholder';
import { MessageSquare } from 'lucide-react';

export default function ConversationsPage() {
  return (
    <HermesModulePlaceholder 
      title="Conversational Memory"
      description="El hilo continuo de interacciones. Revisa las conversaciones que Hermes mantiene con tus usuarios y clientes en todos los canales."
      icon={MessageSquare}
      features={[
        "Visualizador de chat multicanal",
        "Análisis de sentimiento por conversación",
        "Intervención humana (Hand-off manual)",
        "Marcado de respuestas como conocimiento"
      ]}
    />
  );
}

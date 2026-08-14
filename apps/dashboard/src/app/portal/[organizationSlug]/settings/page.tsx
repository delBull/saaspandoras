'use client';

import React from 'react';
import { HermesModulePlaceholder } from '@/components/hermes-portal/HermesModulePlaceholder';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <HermesModulePlaceholder 
      title="System Preferences"
      description="Configuraciones globales del tenant y preferencias de rendimiento del Kernel de Hermes."
      icon={Settings}
      features={[
        "Facturación y uso de tokens",
        "Llaves de API e integraciones base",
        "Configuración del portal Whitelabel",
        "Manejo de copias de seguridad de memoria"
      ]}
    />
  );
}

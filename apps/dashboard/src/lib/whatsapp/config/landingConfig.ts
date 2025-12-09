// =====================================================
// CONFIGURACIÓN DE LANDING PAGES - FLOWS INDEPENDIENTES
// Mapeo específico de cada landing page a su flujo
// =====================================================

import type { FlowType } from '../core/simpleRouter';

// Configuración de cada landing page y su flujo correspondiente
export const LANDING_FLOW_CONFIG = {
  // Landing: /start
  'start': {
    flowType: 'eight_q' as FlowType,
    name: 'Evaluación 8 Preguntas',
    description: 'Filtro de viabilidad para protocolos de utilidad',
    message: 'Hola, quiero iniciar mi evaluación de 8 preguntas',
    color: 'blue',
    icon: '📋'
  },
  
  // Landing: /utility-protocol
  'utility-protocol': {
    flowType: 'utility' as FlowType,
    name: 'Consultoría Utility Protocol',
    description: 'Arquitectura W2E y protocolos de utilidad',
    message: 'Estoy interesado en crear un utility protocol funcional',
    color: 'purple',
    icon: '🏗️'
  },
  
  // Landing: /founders
  'founders': {
    flowType: 'high_ticket' as FlowType,
    name: 'Programa Founders',
    description: 'Inner Circle para founders con capital',
    message: 'Hola, soy founder y quiero aplicar al programa Founders de Pandora\'s. Tengo capital disponible.',
    color: 'yellow',
    icon: '👑'
  },
  
  // Soporte general
  'support': {
    flowType: 'support' as FlowType,
    name: 'Soporte Técnico',
    description: 'Ayuda técnica y resolución de problemas',
    message: 'Necesito ayuda técnica con mi proyecto',
    color: 'red',
    icon: '🆘'
  },
  
  // Contacto humano
  'human': {
    flowType: 'human' as FlowType,
    name: 'Agente Humano',
    description: 'Escalado a especialista humano',
    message: 'Quiero hablar con un agente humano',
    color: 'green',
    icon: '👨‍💼'
  }
} as const;

// URLs de WhatsApp pre-configuradas para cada landing
export const getWhatsAppUrl = (landingKey: keyof typeof LANDING_FLOW_CONFIG, phoneNumber?: string) => {
  const config = LANDING_FLOW_CONFIG[landingKey];
  const phone = phoneNumber || process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE || "5213221374392";
  
  const message = encodeURIComponent(config.message);
  return `https://wa.me/${phone}?text=${message}`;
};

// Validar si un usuario puede acceder a un flujo específico
export function canUserAccessFlow(userPhone: string, requestedFlow: FlowType): Promise<boolean> {
  // Esta función se usará para validar restricciones
  // Por ahora siempre retorna true (se puede extender)
  return Promise.resolve(true);
}

// Obtener configuración de landing por URL
export function getLandingConfigByUrl(url: string) {
  if (!url || typeof url !== 'string') {
    return LANDING_FLOW_CONFIG.start;
  }
  
  const path = url.split('?')[0]?.replace('/', '').replace('dashboard/', '') || 'start';
  
  // Mapear URLs a keys de configuración
  const urlMapping: Record<string, keyof typeof LANDING_FLOW_CONFIG> = {
    '': 'start',
    'start': 'start',
    'dashboard/start': 'start',
    'dashboard/utility-protocol': 'utility-protocol',
    'utility-protocol': 'utility-protocol',
    'dashboard/founders': 'founders',
    'founders': 'founders'
  };
  
  const configKey = urlMapping[path] || 'start';
  const config = LANDING_FLOW_CONFIG[configKey];
  
  // Fallback to start if config is undefined
  return config || LANDING_FLOW_CONFIG.start;
}

// Mensajes específicos por landing para analytics
export const LANDING_ANALYTICS = {
  'start': { category: 'lead_generation', event: 'eight_q_started' },
  'utility-protocol': { category: 'utility_consultation', event: 'utility_flow_started' },
  'founders': { category: 'high_ticket', event: 'founders_flow_started' },
  'support': { category: 'support', event: 'support_flow_started' },
  'human': { category: 'human_escalation', event: 'human_flow_started' }
} as const;

// Configuración de restricciones por flujo
export const FLOW_RESTRICTIONS = {
  // Un usuario solo puede estar en un flujo a la vez
  oneFlowPerUser: true,
  
  // Flujos que requieren validación adicional
  requiresValidation: ['high_ticket'],
  
  // Flujos que permiten múltiples sesiones (para soporte)
  allowMultipleSessions: ['support', 'human'],
  
  // Tiempo máximo por flujo (en horas)
  maxFlowDuration: {
    'eight_q': 24,
    'utility': 72,
    'high_ticket': 168, // 7 días
    'support': 48,
    'human': 24
  }
} as const;
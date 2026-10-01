export interface ExecutiveToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  authorizedRoles: string[];
}

/**
 * 👑 Executive Tools (Boss Mode)
 * 
 * These tools allow the Founder/OWNER to execute administrative actions via natural language
 * on any Hermes channel (WhatsApp, Telegram, Dashboard).
 * 
 * They are protected by the ToolAuthorizationGate and require 'governance.admin' or 'platform.decrees'.
 */

export const ActivateTenantTool: ExecutiveToolSchema = {
  name: 'executive_activate_tenant',
  description: 'Activa un tenant (proyecto) y le asigna un plan o paquete específico de forma inmediata.',
  parameters: {
    type: 'object',
    properties: {
      tenantSlug: {
        type: 'string',
        description: 'El slug o identificador del tenant (ej. snarai, pandoras, delta)',
      },
      vertical: {
        type: 'string',
        enum: ['GROWTH_OS', 'RWA', 'ACADEMY', 'HERMES_OS'],
        description: 'La vertical en la que se va a activar el paquete',
      },
      planId: {
        type: 'string',
        description: 'El identificador del paquete/plan (ej. growth, enterprise, pro)',
      },
    },
    required: ['tenantSlug', 'vertical', 'planId'],
  },
  authorizedRoles: ['OWNER'], // Strict Advesarial Gate
};

export const AssignAdminTool: ExecutiveToolSchema = {
  name: 'executive_assign_admin',
  description: 'Asigna a un colaborador o administrador como el encargado directo de un tenant.',
  parameters: {
    type: 'object',
    properties: {
      tenantSlug: {
        type: 'string',
        description: 'El slug del tenant a asignar',
      },
      collaboratorEmailOrPhone: {
        type: 'string',
        description: 'El correo, teléfono o ID del colaborador que será el nuevo admin',
      },
      roleLevel: {
        type: 'string',
        enum: ['TENANT_ADMIN', 'OPERATOR', 'VIEWER'],
        description: 'El nivel de acceso a otorgar',
      },
    },
    required: ['tenantSlug', 'collaboratorEmailOrPhone', 'roleLevel'],
  },
  authorizedRoles: ['OWNER'],
};

export const ApprovePaymentTool: ExecutiveToolSchema = {
  name: 'executive_approve_payment',
  description: 'Aprueba manualmente una intención de pago o transferencia externa (fiat/crypto) para liquidarla en el ecosistema.',
  parameters: {
    type: 'object',
    properties: {
      paymentIntentId: { type: 'string', description: 'El ID del Payment Intent' },
      resolution: { type: 'string', enum: ['APPROVE', 'REJECT'] },
      amount: { type: 'number', description: 'Monto exacto a aprobar' },
      currency: { type: 'string', description: 'Moneda (USD, MXN, USDC)' },
      tenantId: { type: 'string', description: 'El orgId o slug del tenant beneficiario/pagador' },
      vertical: { type: 'string', description: 'La vertical del pago (GROWTH_OS, RWA, etc)' },
      destinationWallet: { type: 'string', description: 'Wallet de destino acordada' },
      notes: { type: 'string', description: 'Razón ejecutiva' },
    },
    required: ['paymentIntentId', 'resolution', 'amount', 'currency', 'tenantId', 'vertical', 'destinationWallet'],
  },
  authorizedRoles: ['OWNER'],
};

export const ExecutiveToolsRegistry = [
  ActivateTenantTool,
  AssignAdminTool,
  ApprovePaymentTool,
];

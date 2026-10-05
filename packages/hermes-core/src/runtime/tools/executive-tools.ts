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

export const ProvisionCollaboratorTool: ExecutiveToolSchema = {
  name: 'executive_provision_collaborator',
  description: 'Aprovisiona y aprueba a un colaborador que está en estado PENDING, asignándole un rol dentro del ecosistema.',
  parameters: {
    type: 'object',
    properties: {
      collaboratorEmail: {
        type: 'string',
        description: 'El correo electrónico del colaborador pendiente a aprobar',
      },
      role: {
        type: 'string',
        enum: ['VIEWER', 'OPERATOR', 'MARKETING', 'ADMIN', 'SUPER_ADMIN'],
        description: 'El rol a asignar al colaborador. Por defecto VIEWER si no se especifica.',
      },
      action: {
        type: 'string',
        enum: ['APPROVE', 'REJECT'],
        description: 'Acción a tomar sobre el colaborador',
      }
    },
    required: ['collaboratorEmail', 'action'],
  },
  authorizedRoles: ['OWNER'],
};

export const ExecutiveBriefingTool: ExecutiveToolSchema = {
  name: 'executive_get_briefing',
  description: 'Obtiene el resumen ejecutivo del día (briefing) con pendientes, leads y alertas del ecosistema.',
  parameters: { type: 'object', properties: {}, required: [] },
  authorizedRoles: ['OWNER'],
};

export const ExecutiveCapabilitiesTool: ExecutiveToolSchema = {
  name: 'executive_get_capabilities',
  description: 'Muestra la lista de capacidades y comandos ejecutivos disponibles para el Fundador.',
  parameters: { type: 'object', properties: {}, required: [] },
  authorizedRoles: ['OWNER'],
};

export const FinancialSignatureTool: ExecutiveToolSchema = {
  name: 'executive_financial_signature',
  description: 'Firma y ejecuta una propuesta financiera pendiente (settlement).',
  parameters: {
    type: 'object',
    properties: {
      proposalId: { type: 'string', description: 'El ID de la propuesta financiera' },
      signature: { type: 'string', description: 'La firma criptográfica o código de aprobación' },
    },
    required: ['proposalId', 'signature'],
  },
  authorizedRoles: ['OWNER'],
};

export const FinancialProposalTool: ExecutiveToolSchema = {
  name: 'executive_financial_proposal',
  description: 'Prepara un pre-vuelo (preflight) para una propuesta financiera (distribución, transferencia).',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', description: 'La acción financiera (ej. distribute, transfer)' },
      tenantId: { type: 'string', description: 'El ID del tenant' },
      recipient: { type: 'string', description: 'El receptor de los fondos' },
      amountUsd: { type: 'number', description: 'El monto en USD' },
      purpose: { type: 'string', description: 'Propósito de la propuesta' },
    },
    required: ['action', 'tenantId', 'recipient', 'amountUsd', 'purpose'],
  },
  authorizedRoles: ['OWNER'],
};

export const CodeApprovalTool: ExecutiveToolSchema = {
  name: 'executive_code_approval',
  description: 'Aprueba un parche o cambio de código propuesto en el ecosistema.',
  parameters: {
    type: 'object',
    properties: {
      proposalId: { type: 'string', description: 'El ID del parche o propuesta de código' },
    },
    required: ['proposalId'],
  },
  authorizedRoles: ['OWNER'],
};

export const CodeDiagnosisTool: ExecutiveToolSchema = {
  name: 'executive_code_diagnosis',
  description: 'Diagnostica un error de código o stack trace reportado.',
  parameters: {
    type: 'object',
    properties: {
      rawError: { type: 'string', description: 'El stack trace o mensaje de error a diagnosticar' },
    },
    required: ['rawError'],
  },
  authorizedRoles: ['OWNER'],
};

export const OperationalActionTool: ExecutiveToolSchema = {
  name: 'executive_operational_action',
  description: 'Crea un plan operativo para una acción que requiere confirmación ejecutiva.',
  parameters: {
    type: 'object',
    properties: {
      action: { type: 'string', description: 'La acción a realizar' },
      target: { type: 'string', description: 'El recurso objetivo' },
      payload: { type: 'object', description: 'Carga útil de la acción' },
      title: { type: 'string', description: 'Título del plan' },
      description: { type: 'string', description: 'Descripción detallada' },
      blastRadius: { type: 'string', description: 'Radio de impacto estimado' },
    },
    required: ['action', 'target'],
  },
  authorizedRoles: ['OWNER'],
};

export const RegisterContactTool: ExecutiveToolSchema = {
  name: 'executive_register_contact',
  description: 'Registra un nuevo contacto ordenado directamente por el Fundador.',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Nombre del contacto' },
      phone: { type: 'string', description: 'Teléfono del contacto' },
      email: { type: 'string', description: 'Email del contacto' },
      notes: { type: 'string', description: 'Instrucción o nota adjunta' },
    },
    required: ['name'],
  },
  authorizedRoles: ['OWNER'],
};

export const AddDirectiveTool: ExecutiveToolSchema = {
  name: 'executive_add_directive',
  description: 'Registra una directiva fundacional de nivel cero.',
  parameters: {
    type: 'object',
    properties: {
      directiveText: { type: 'string', description: 'El texto exacto de la directiva' },
    },
    required: ['directiveText'],
  },
  authorizedRoles: ['OWNER'],
};

export const PromoteContactTool: ExecutiveToolSchema = {
  name: 'executive_promote_contact',
  description: 'Promueve el rol de un contacto existente.',
  parameters: {
    type: 'object',
    properties: {
      targetIdentifier: { type: 'string', description: 'Email, teléfono o nombre del contacto a promover' },
      targetRole: { type: 'string', description: 'El rol al cual promover (ej. ADMIN_OPERATIONS, SUPER_ADMIN)' },
      notes: { type: 'string', description: 'Notas ejecutivas' },
    },
    required: ['targetIdentifier', 'targetRole'],
  },
  authorizedRoles: ['OWNER'],
};

export const SendWhatsAppTool: ExecutiveToolSchema = {
  name: 'executive_send_whatsapp',
  description: 'Despacha un mensaje directo de WhatsApp a un colaborador o número.',
  parameters: {
    type: 'object',
    properties: {
      targetNameOrPhone: { type: 'string', description: 'Nombre del colaborador o número de teléfono destino' },
      messageToSend: { type: 'string', description: 'Contenido del mensaje a enviar' },
    },
    required: ['targetNameOrPhone', 'messageToSend'],
  },
  authorizedRoles: ['OWNER'],
};

export const AuditTenantTool: ExecutiveToolSchema = {
  name: 'executive_audit_tenant',
  description: 'Realiza una inspección profunda del estado de un tenant o proyecto.',
  parameters: {
    type: 'object',
    properties: {
      tenantSlug: { type: 'string', description: 'El slug o identificador del tenant a auditar' },
    },
    required: ['tenantSlug'],
  },
  authorizedRoles: ['OWNER'],
};

export const AuditLeadsTool: ExecutiveToolSchema = {
  name: 'executive_audit_leads',
  description: 'Audita y muestra los leads y CRM del ecosistema.',
  parameters: { type: 'object', properties: {}, required: [] },
  authorizedRoles: ['OWNER'],
};

export const AuditLogsTool: ExecutiveToolSchema = {
  name: 'executive_audit_logs',
  description: 'Revisa y audita los logs de seguridad y eventos del sistema.',
  parameters: { type: 'object', properties: {}, required: [] },
  authorizedRoles: ['OWNER'],
};

export const AuditSchemaTool: ExecutiveToolSchema = {
  name: 'executive_audit_schema',
  description: 'Inspecciona la paridad del esquema de base de datos y migraciones.',
  parameters: { type: 'object', properties: {}, required: [] },
  authorizedRoles: ['OWNER'],
};

export const ConfirmPlanTool: ExecutiveToolSchema = {
  name: 'executive_confirm_plan',
  description: 'Confirma y ejecuta el plan operativo actualmente pendiente.',
  parameters: { type: 'object', properties: {}, required: [] },
  authorizedRoles: ['OWNER'],
};

export const CancelPlanTool: ExecutiveToolSchema = {
  name: 'executive_cancel_plan',
  description: 'Cancela y descarta el plan operativo actualmente pendiente.',
  parameters: { type: 'object', properties: {}, required: [] },
  authorizedRoles: ['OWNER'],
};

export const ExecutiveToolsRegistry = [
  ActivateTenantTool,
  AssignAdminTool,
  ApprovePaymentTool,
  ProvisionCollaboratorTool,
  ExecutiveBriefingTool,
  ExecutiveCapabilitiesTool,
  FinancialSignatureTool,
  FinancialProposalTool,
  CodeApprovalTool,
  CodeDiagnosisTool,
  OperationalActionTool,
  RegisterContactTool,
  AddDirectiveTool,
  PromoteContactTool,
  SendWhatsAppTool,
  AuditTenantTool,
  AuditLeadsTool,
  AuditLogsTool,
  AuditSchemaTool,
  ConfirmPlanTool,
  CancelPlanTool,
];

/**
 * 🏛️ PLATFORM CAPABILITY REGISTRY & AUTHORIZATION ENGINE (F9.2)
 * apps/dashboard/src/lib/admin/platform-capability-registry.service.ts
 *
 * Enforces Platform Governance authority with resourceScope,
 * risk classification (LOW, MEDIUM, HIGH, CRITICAL), and strict
 * role-to-capability validation.
 */

import type { PlatformRole, PlatformActor } from '@/lib/dash-contracts/admin';
export type { PlatformRole, PlatformActor };

export type PlatformCapability =
  | 'platform.tenants.read'
  | 'platform.tenants.markup.update'
  | 'platform.tenants.suspend'
  | 'platform.rwa.review'
  | 'platform.rwa.approve'
  | 'platform.contract.deploy'
  | 'platform.treasury.read'
  | 'platform.credits.adjust'
  | 'platform.treasury.sweep'
  | 'platform.collaborators.manage'
  | 'platform.identity.admins.manage'
  | 'platform.security.audit'
  | 'platform.books.unlock'
  | 'admin.whitelabel'
  // Dominio Comercial (HQ CRM)
  | 'hq.crm.read'
  | 'hq.crm.enrich'
  | 'hq.crm.outreach'
  | 'hq.crm.classify'
  | 'hq.crm.deal.close'
  // Dominio Tenant Hermes
  | 'tenant.hermes.outreach'
  // Dominio Integración (Developer Hub & Webhooks)
  | 'platform.integration.webhook.intake'
  | 'platform.integration.keys.read'
  | 'platform.integration.keys.manage'
  // Dominio Operaciones & Provisioning
  | 'ops.tenant.provision'
  | 'ops.tenant.bootstrap';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL_A' | 'CRITICAL_B' | 'CRITICAL';

export type GovernanceRequirement = 
  | 'DIRECT_EXECUTION' 
  | 'REINFORCED_AUTH' 
  | 'SECOND_APPROVAL' 
  | 'MULTI_PARTY_2FA'
  | 'DUAL_KEY_TIME_WINDOW';

export type PlatformResourceScope = 
  | 'all' 
  | 'assigned' 
  | { tenantId?: string; projectId?: string };

export interface PlatformCapabilityDefinition {
  capability: PlatformCapability;
  resource: 'Platform' | 'Tenant' | 'RWA Project' | 'Treasury' | 'Identity' | 'Audit' | 'HQ CRM' | 'Integration' | 'Operations';
  allowedScopes: Array<'all' | 'assigned' | 'scoped'>;
  riskLevel: RiskLevel;
  governanceRequirement: GovernanceRequirement;
  description: string;
}

export interface AuthorizationEvaluationResult {
  granted: boolean;
  capability: PlatformCapability;
  actorRole: PlatformRole;
  effectiveScope: PlatformResourceScope;
  riskLevel: RiskLevel;
  governanceRequirement: GovernanceRequirement;
  reason?: string;
}

export class PlatformCapabilityRegistryService {
  private static readonly CAPABILITY_CATALOG: Record<PlatformCapability, PlatformCapabilityDefinition> = {
    'platform.tenants.read': {
      capability: 'platform.tenants.read',
      resource: 'Tenant',
      allowedScopes: ['all', 'assigned', 'scoped'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Observabilidad de organizaciones, estados y productos en Tenant Lens',
    },
    'platform.tenants.markup.update': {
      capability: 'platform.tenants.markup.update',
      resource: 'Tenant',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'MEDIUM',
      governanceRequirement: 'REINFORCED_AUTH',
      description: 'Ajustar el porcentaje de margen sobre cómputo para un tenant',
    },
    'platform.tenants.suspend': {
      capability: 'platform.tenants.suspend',
      resource: 'Tenant',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'HIGH',
      governanceRequirement: 'SECOND_APPROVAL',
      description: 'Suspender temporalmente el acceso y cómputo de un tenant',
    },
    'platform.rwa.review': {
      capability: 'platform.rwa.review',
      resource: 'RWA Project',
      allowedScopes: ['all', 'assigned', 'scoped'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Revisión técnica y debida diligencia de proyectos de tokenización RWA',
    },
    'platform.rwa.approve': {
      capability: 'platform.rwa.approve',
      resource: 'RWA Project',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'HIGH',
      governanceRequirement: 'SECOND_APPROVAL',
      description: 'Aprobar formalmente el paso de un proyecto RWA a fase de despliegue',
    },
    'platform.contract.deploy': {
      capability: 'platform.contract.deploy',
      resource: 'RWA Project',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'CRITICAL_B',
      governanceRequirement: 'DUAL_KEY_TIME_WINDOW',
      description: 'Desplegar smart contracts de tokenización y gobernanza en red Base',
    },
    'platform.treasury.read': {
      capability: 'platform.treasury.read',
      resource: 'Treasury',
      allowedScopes: ['all'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Consultar balances globales, depósitos y contabilidad interna de GPU',
    },
    'platform.credits.adjust': {
      capability: 'platform.credits.adjust',
      resource: 'Treasury',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'HIGH',
      governanceRequirement: 'SECOND_APPROVAL',
      description: 'Acreditar o debitar saldo manualmente a un tenant con auditoría obligatoria',
    },
    'platform.treasury.sweep': {
      capability: 'platform.treasury.sweep',
      resource: 'Treasury',
      allowedScopes: ['all'],
      riskLevel: 'CRITICAL_B',
      governanceRequirement: 'DUAL_KEY_TIME_WINDOW',
      description: 'Ejecutar transferencia o barrido de fondos hacia la tesorería de Pandora',
    },
    'platform.collaborators.manage': {
      capability: 'platform.collaborators.manage',
      resource: 'Identity',
      allowedScopes: ['all'],
      riskLevel: 'MEDIUM',
      governanceRequirement: 'REINFORCED_AUTH',
      description: 'Invitar colaboradores y configurar permisos desde el Drawer RBAC',
    },
    'platform.identity.admins.manage': {
      capability: 'platform.identity.admins.manage',
      resource: 'Identity',
      allowedScopes: ['all'],
      riskLevel: 'CRITICAL_A',
      governanceRequirement: 'MULTI_PARTY_2FA',
      description: 'Alta o baja de billeteras en la whitelist de administradores de plataforma',
    },
    'platform.security.audit': {
      capability: 'platform.security.audit',
      resource: 'Audit',
      allowedScopes: ['all'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Consultar logs de auditoría hash-chain y eventos de seguridad',
    },
    'platform.books.unlock': {
      capability: 'platform.books.unlock',
      resource: 'Audit',
      allowedScopes: ['all'],
      riskLevel: 'CRITICAL_B',
      governanceRequirement: 'DUAL_KEY_TIME_WINDOW',
      description: 'Desbloqueo de libros contables de la plataforma con quórum multifirma (Libro Constitucional)',
    },
    'admin.whitelabel': {
      capability: 'admin.whitelabel',
      resource: 'Tenant',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'HIGH',
      governanceRequirement: 'REINFORCED_AUTH',
      description: 'Configurar parámetros Whitelabel (dominio, colores, logo) para un Tenant',
    },
    'hq.crm.read': {
      capability: 'hq.crm.read',
      resource: 'HQ CRM',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Leer contexto de los prospectos B2B (HQ Leads)',
    },
    'hq.crm.enrich': {
      capability: 'hq.crm.enrich',
      resource: 'HQ CRM',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Actualizar metadatos no sensibles y deduplicar leads',
    },
    'hq.crm.outreach': {
      capability: 'hq.crm.outreach',
      resource: 'HQ CRM',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'MEDIUM',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Iniciar conversaciones automatizadas o manuales (nurturing) con HQ Leads',
    },
    'hq.crm.classify': {
      capability: 'hq.crm.classify',
      resource: 'HQ CRM',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Cambiar la calificación de un HQ Lead (NEW -> QUALIFIED)',
    },
    'hq.crm.deal.close': {
      capability: 'hq.crm.deal.close',
      resource: 'HQ CRM',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'HIGH',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Cierre formal de un acuerdo comercial (CLOSED_WON)',
    },
    // Dominio Tenant Hermes
    'tenant.hermes.outreach': {
      capability: 'tenant.hermes.outreach',
      resource: 'Tenant',
      allowedScopes: ['scoped'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Envío de mensajes conversacionales de outreach o bienvenida a prospectos propios del tenant',
    },
    // Dominio Integración
    'platform.integration.webhook.intake': {
      capability: 'platform.integration.webhook.intake',
      resource: 'Integration',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Ingesta pública o autenticada de prospectos vía Webhook',
    },
    'platform.integration.keys.read': {
      capability: 'platform.integration.keys.read',
      resource: 'Integration',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'MEDIUM',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'Visualización de credenciales de API en Developer Hub',
    },
    'platform.integration.keys.manage': {
      capability: 'platform.integration.keys.manage',
      resource: 'Integration',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'HIGH',
      governanceRequirement: 'REINFORCED_AUTH',
      description: 'Generación, rotación o revocación de API Keys de integración',
    },
    // Dominio Operaciones & Provisioning
    'ops.tenant.provision': {
      capability: 'ops.tenant.provision',
      resource: 'Operations',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'CRITICAL_B',
      governanceRequirement: 'SECOND_APPROVAL',
      description: 'Creación y aprovisionamiento formal de un tenant en infraestructura viva',
    },
    'ops.tenant.bootstrap': {
      capability: 'ops.tenant.bootstrap',
      resource: 'Operations',
      allowedScopes: ['all', 'scoped'],
      riskLevel: 'HIGH',
      governanceRequirement: 'REINFORCED_AUTH',
      description: 'Inicialización de Sovereign Knowledge Vault y namespaces del tenant',
    }
  };

  /**
   * Obtiene la definición de una capacidad de plataforma.
   */
  public static getDefinition(capability: PlatformCapability): PlatformCapabilityDefinition {
    const def = this.CAPABILITY_CATALOG[capability];
    if (!def) {
      throw new Error(`[PlatformCapabilityRegistry] Unknown capability: ${capability}`);
    }
    return def;
  }

  /**
   * Evalúa si un actor tiene autoridad para ejecutar una capability sobre un scope determinado.
   */
  public static evaluateAuthorization(
    actor: PlatformActor,
    capability: PlatformCapability,
    targetScope: PlatformResourceScope = 'all'
  ): AuthorizationEvaluationResult {
    const def = this.getDefinition(capability);

    // Fail-closed por defecto
    const baseResult: AuthorizationEvaluationResult = {
      granted: false,
      capability,
      actorRole: actor.role,
      effectiveScope: targetScope,
      riskLevel: def.riskLevel,
      governanceRequirement: def.governanceRequirement,
    };

    const isCritical = 
      def.riskLevel === 'CRITICAL' || 
      def.riskLevel === 'CRITICAL_A' || 
      def.riskLevel === 'CRITICAL_B';

    // ── Invariante 1: Agentes Autónomos (F9.10) ──
    // Los agentes delegados tienen estrictamente prohibida la ejecución autónoma de HIGH y CRITICAL
    if (actor.actorType === 'AGENT_DELEGATE') {
      if (def.riskLevel === 'HIGH' || isCritical) {
        return {
          ...baseResult,
          granted: false,
          reason: `Los agentes delegados (AGENT_DELEGATE) tienen estrictamente prohibida la ejecución de capacidades ${def.riskLevel} sin mediación humana directa.`,
        };
      }
      // Los agentes delegados están explícitamente autorizados para sus capabilities de outreach (LOW)
      if (capability === 'hq.crm.outreach' || capability === 'tenant.hermes.outreach') {
        return { ...baseResult, granted: true };
      }
    }

    // ── Invariante 2: Aislamiento de Scope de Recursos (F9.10) ──
    if (typeof targetScope === 'object' && (targetScope.tenantId || targetScope.projectId)) {
      if (!def.allowedScopes.includes('scoped')) {
        return {
          ...baseResult,
          granted: false,
          reason: `La capacidad '${capability}' es de ámbito global ('all') y no admite invocación sobre un tenant o proyecto individual.`,
        };
      }
    }

    // 1. SUPER_ADMIN tiene autoridad sobre todo
    if (actor.role === 'SUPER_ADMIN') {
      // Si la acción es crítica (A o B) y requiere 2FA Discord o Timelock, verificar 2FA
      if (isCritical) {
        if (!actor.isDiscord2faVerified) {
          return {
            ...baseResult,
            granted: false,
            reason: `La capacidad crítica '${capability}' (${def.riskLevel}) requiere verificación 2FA Discord previa.`,
          };
        }
      }
      return { ...baseResult, granted: true };
    }

    // 2. Acciones CRITICAL están estrictamente prohibidas para roles inferiores a SUPER_ADMIN
    if (isCritical) {
      return {
        ...baseResult,
        granted: false,
        reason: `La capacidad crítica '${capability}' (${def.riskLevel}) es exclusiva de SUPER_ADMIN.`,
      };
    }

    // 3. ADMIN
    if (actor.role === 'ADMIN') {
      if (def.governanceRequirement === 'REINFORCED_AUTH' && !actor.isDiscord2faVerified) {
        return {
          ...baseResult,
          granted: false,
          reason: `La capacidad '${capability}' (${def.riskLevel}) requiere verificación 2FA Discord previa para ADMIN.`,
        };
      }
      // Puede ejecutar capacidades sin REINFORCED_AUTH
      return { ...baseResult, granted: true };
    }

    // 4. OPERATOR
    if (actor.role === 'OPERATOR') {
      // OPERATOR solo puede ejecutar LOW y ciertas MEDIUM operativas
      const operatorAllowed: PlatformCapability[] = [
        'platform.tenants.read',
        'platform.tenants.markup.update',
        'platform.rwa.review',
        'platform.security.audit',
        'platform.collaborators.manage',
      ];
      if (operatorAllowed.includes(capability)) {
        return { ...baseResult, granted: true };
      }
      return {
        ...baseResult,
        granted: false,
        reason: `El rol OPERATOR no posee privilegios para '${capability}'.`,
      };
    }

    // 5. AUDITOR
    if (actor.role === 'VIEWER') {
      // Solo lecturas LOW
      if (def.riskLevel === 'LOW') {
        return { ...baseResult, granted: true };
      }
      return {
        ...baseResult,
        granted: false,
        reason: `El rol AUDITOR posee privilegios estrictamente de solo lectura (LOW).`,
      };
    }

    return baseResult;
  }

  /**
   * Garantía fail-closed para Server Actions y API Routes.
   * Lanza excepción tipada si el actor no posee la capacidad.
   */
  public static requireCapability(
    actor: PlatformActor,
    capability: PlatformCapability,
    targetScope: PlatformResourceScope = 'all'
  ): void {
    const result = this.evaluateAuthorization(actor, capability, targetScope);
    if (!result.granted) {
      throw new Error(
        `[PlatformAuth] 403 Forbidden: ${result.reason || `Actor no autorizado para '${capability}'.`}`
      );
    }
  }

  /**
   * Retorna todo el catálogo de capabilities de plataforma.
   */
  public static getAllDefinitions(): PlatformCapabilityDefinition[] {
    return Object.values(this.CAPABILITY_CATALOG);
  }
}

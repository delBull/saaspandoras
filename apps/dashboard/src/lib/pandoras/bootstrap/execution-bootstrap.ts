import { OrganizationRuntime, OrganizationConfig } from './organization-runtime';
import { ExecutionIdentitySnapshot } from '../core/contracts';

/**
 * ExecutionBootstrap
 * Fachada de aplicación (SaaS) que orquesta la recolección de datos de la BD
 * y su empaquetado en un ExecutionIdentitySnapshot puro para el Kernel.
 */
export class ExecutionBootstrap {
  private orgRuntime = new OrganizationRuntime();

  /**
   * Genera el Snapshot inmutable a partir de un TenantID y un UserId.
   * Este método es llamado por el Gateway (Server Action / API Route) ANTES de invocar a Hermes o al SO.
   */
  async hydrateIdentity(tenantId: string, userId: string, channel: string): Promise<ExecutionIdentitySnapshot> {
    // 1. Extraer el contexto real desde la base de datos
    const orgConfig = await this.orgRuntime.loadTenantConfig(tenantId);
    
    // Aquí el Bootstrap Layer también podría verificar suscripciones o packs instalados
    if (!orgConfig.installedPacks.includes('pandoras.hermes')) {
      throw new Error(`[Bootstrap] El tenant ${tenantId} no tiene el Pack Hermes instalado.`);
    }

    console.log(`[Bootstrap] Ensamblando Identidad para ${orgConfig.name}...`);
    
    // 2. Mapear los datos de la DB al formato genérico del Kernel.
    // Esto construye la identidad sin que el Kernel sepa de dónde vinieron los datos.
    const snapshot: ExecutionIdentitySnapshot = {
      organization: {
        id: orgConfig.tenantId,
        name: orgConfig.name,
        brand: {
          logoUrl: orgConfig.brand.logoUrl,
          palette: { primary: orgConfig.brand.primaryColor }
        },
        voice: 'formal',
        locale: orgConfig.locale
      },
      actor: {
        userId: userId,
        roles: ['admin'] // Simulando resolución de DB
      },
      environment: {
        stage: 'production',
        timezone: orgConfig.timezone,
        region: 'us-east-1',
        language: 'es',
        units: 'metric'
      },
      capabilities: {
        available: ['generate.image', 'telegram.send', 'hermes.chat']
      },
      packs: {
        installed: orgConfig.installedPacks
      },
      providers: {
        llm: {
          providerId: 'openai',
          model: orgConfig.policies.allowedLlms[0] || 'gpt-4o'
        }
      },
      policies: {
        limits: {
          budgetUsd: orgConfig.policies.maxBudgetUsd,
          allowedModels: orgConfig.policies.allowedLlms,
          securityLevel: 'standard'
        }
      },
      metadata: {
        executionId: `exec_${Date.now()}`,
        correlationId: `corr_${Date.now()}`,
        traceId: `trace_${Date.now()}`,
        sourceApp: channel,
        version: '1.0'
      }
    };

    return Object.freeze(snapshot);
  }
}

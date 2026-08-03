import { db } from '@/db';
import { projects, integrationClients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { IdentityPack, DEFAULT_IDENTITY_PACK } from '@pandoras/identity-sdk';
import { CapabilityId, CapabilityEngine, SubscriptionTier } from '@pandoras/capability-sdk';
import crypto from 'crypto';

export interface ProvisionTenantInput {
  tenantSlug: string;
  companyName: string;
  contactEmail: string;
  tier: SubscriptionTier;
  customCapabilities?: CapabilityId[];
  brandConfig?: Partial<IdentityPack['brand']>;
  voiceConfig?: Partial<IdentityPack['voice']>;
  isPublicMarketplace?: boolean;
}

export interface ProvisioningResult {
  success: boolean;
  tenantId: string;
  projectId: number;
  apiKey: string;
  capabilitiesEnabled: CapabilityId[];
  botWebhookUrl: string;
  adminCredentials: {
    email: string;
    temporaryToken: string;
  };
}

/**
 * 🚀 PANDORA'S PLATFORM PROVISIONING ENGINE
 * 
 * Ejecuta la secuencia automatizada de aprovisionamiento de un nuevo Tenant:
 * 1. Crea registro de Organización/Proyecto en NeonDB.
 * 2. Asigna Plan & Habilita Capacidades (Capabilities).
 * 3. Inyecta Identity Pack (Brand, Colors, Voice).
 * 4. Genera API Key de integración (Client Key).
 * 5. Genera endpoints de comunicación (Telegram/WhatsApp/Voice).
 */
export class PlatformProvisioningEngine {
  public static async provisionTenant(input: ProvisionTenantInput): Promise<ProvisioningResult> {
    const { tenantSlug, companyName, contactEmail, tier, customCapabilities, brandConfig, voiceConfig, isPublicMarketplace = false } = input;
    const cleanSlug = tenantSlug.toLowerCase().trim();

    // 1. Determinar capacidades activadas por Tier o Custom
    const defaultCapabilities = CapabilityEngine.getCapabilitiesForTier(tier);
    const capabilitiesEnabled: CapabilityId[] = Array.from(new Set([...defaultCapabilities, ...(customCapabilities || [])]));

    // 2. Construir Identity Pack inicial
    const identityPack: IdentityPack = {
      tenantId: cleanSlug,
      brand: {
        ...DEFAULT_IDENTITY_PACK.brand,
        name: companyName,
        shortName: companyName.substring(0, 10).toUpperCase(),
        legalName: `${companyName} S.A. de C.V.`,
        ...brandConfig,
      },
      palette: DEFAULT_IDENTITY_PACK.palette,
      voice: {
        ...DEFAULT_IDENTITY_PACK.voice,
        agentName: `Hermes (${companyName})`,
        ...voiceConfig,
      },
      channels: {
        webDomain: `${cleanSlug}.pandoras.app`,
      }
    };

    // 3. Generar API Key segura
    const rawApiKey = `pk_live_${crypto.randomBytes(16).toString('hex')}`;
    const clientId = crypto.randomUUID();

    // 4. Crear registro en DB de Proyectos / Tenants (Add-Only / Idempotente)
    let existingProject = await db.query.projects.findFirst({
      where: eq(projects.slug, cleanSlug)
    });

    let projectId: number;

    if (existingProject) {
      projectId = existingProject.id;
      await db.update(projects)
        .set({
          title: companyName,
          w2eConfig: {
            ...(existingProject.w2eConfig as any || {}),
            tier,
            capabilities: capabilitiesEnabled,
            identityPack,
            isPublicMarketplace,
            provisionedAt: new Date().toISOString(),
          } as any
        })
        .where(eq(projects.id, projectId));
    } else {
      const [newProject] = await db.insert(projects).values({
        slug: cleanSlug,
        title: companyName,
        symbol: cleanSlug.substring(0, 4).toUpperCase(),
        description: `Organización autónoma para ${companyName}`,
        w2eConfig: {
          tier,
          capabilities: capabilitiesEnabled,
          identityPack,
          isPublicMarketplace,
          provisionedAt: new Date().toISOString(),
        } as any,
        metadata: {
          contactEmail,
          scope: 'enterprise_b2b',
        } as any,
      }).returning();

      projectId = newProject.id;
    }

    // 5. Registrar API Client
    try {
      await db.insert(integrationClients).values({
        clientId,
        name: `${companyName} (Tenant Client)`,
        apiKey: rawApiKey,
        projectId,
        scopes: ['read:state', 'write:lead', 'execute:agora'],
        status: 'active',
      } as any);
    } catch (e) {
      console.warn(`[Provisioning Engine] Integration client insert skipped (may exist):`, e);
    }

    const botWebhookUrl = `https://dash.pandoras.finance/api/v1/projects/${cleanSlug}/bot/webhook`;
    const temporaryToken = crypto.randomBytes(8).toString('hex');

    return {
      success: true,
      tenantId: cleanSlug,
      projectId,
      apiKey: rawApiKey,
      capabilitiesEnabled,
      botWebhookUrl,
      adminCredentials: {
        email: contactEmail,
        temporaryToken
      }
    };
  }
}

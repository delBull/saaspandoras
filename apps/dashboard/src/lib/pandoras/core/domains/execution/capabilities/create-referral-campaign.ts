import { Capability, CapabilityContext, CapabilityResult } from '../contracts/capability-contracts';
import { db } from '~/db';
import { campaigns, projects } from '~/db/schema';
import { eq, and } from 'drizzle-orm';

export interface CreateReferralCampaignInput {
  // Input fields from intent payload
}

export interface CreateReferralCampaignOutput {
  campaignId: number;
  status: string;
  message: string;
}

export class CreateReferralCampaignCapability implements Capability<CreateReferralCampaignInput, CreateReferralCampaignOutput> {
  readonly id = 'CREATE_REFERRAL_CAMPAIGN';
  readonly version = 'v1';

  async execute(input: CreateReferralCampaignInput, context: CapabilityContext): Promise<CapabilityResult<CreateReferralCampaignOutput>> {
    try {
      if (!context.organizationId || !context.intentId) {
        return {
          status: 'failed',
          error: {
            category: 'VALIDATION_ERROR',
            message: 'Missing organizationId or intentId in context',
            retryable: false
          }
        };
      }

      const campaignName = `Referral Campaign (Intent: ${context.intentId})`;

      // 1. Map organizationId to projectId (since campaigns require projectId)
      let targetProjectId = 1; // Default fallback
      
      const slug = context.organizationId.startsWith('org_') 
        ? context.organizationId.slice(4) 
        : context.organizationId;
        
      const projectRecords = await db.select({ id: projects.id })
        .from(projects)
        .where(eq(projects.slug, slug))
        .limit(1);
        
      const firstProject = projectRecords[0];
      if (firstProject) {
        targetProjectId = firstProject.id;
      } else {
        return {
          status: 'failed',
          error: {
            category: 'NOT_FOUND',
            message: `Project not found for organizationId: ${context.organizationId}`,
            retryable: false
          }
        };
      }

      // 2. Crear campaña (Idempotency is now handled by ExecutionOS generally, 
      // but we can still check if it already exists as defense-in-depth)
      const existingCampaigns = await db.select()
        .from(campaigns)
        .where(
          and(
            eq(campaigns.projectId, targetProjectId),
            eq(campaigns.name, campaignName)
          )
        )
        .limit(1);

      const existingCampaign = existingCampaigns[0];
      if (existingCampaign) {
        return {
          status: 'succeeded',
          data: {
            campaignId: existingCampaign.id,
            status: existingCampaign.status,
            message: 'Campaign already existed (idempotent result)'
          }
        };
      }

      // 3. Insertar la nueva campaña
      const insertedCampaigns = await db.insert(campaigns).values({
        projectId: targetProjectId,
        name: campaignName,
        campaignType: 'user_acquisition',
        scope: 'b2c',
        source: 'manual',
        type: 'conversion',
        status: 'active'
      }).returning({ id: campaigns.id, status: campaigns.status });

      const newCampaign = insertedCampaigns[0];
      if (!newCampaign) {
        return {
          status: 'failed',
          error: {
            category: 'UNKNOWN_ERROR',
            message: 'Failed to insert campaign (no record returned)',
            retryable: true
          }
        };
      }

      // 4. Retornar resultado exitoso
      return {
        status: 'succeeded',
        data: {
          campaignId: newCampaign.id,
          status: newCampaign.status,
          message: 'Referral campaign created successfully'
        }
      };
    } catch (error: any) {
      return {
        status: 'failed',
        error: {
          category: 'UNKNOWN_ERROR',
          message: error.message || 'Failed to create referral campaign',
          retryable: true
        }
      };
    }
  }
}

import { Capability, CapabilityContext, CapabilityResult } from '../contracts/capability-contracts';
import { db } from '~/db';
import { marketingLeads, projects } from '~/db/schema';
import { eq, and } from 'drizzle-orm';

export const VALID_CRM_STAGES = [
  'LEAD',
  'ENGAGED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
  'NURTURING'
] as const;

export type ValidCrmStage = typeof VALID_CRM_STAGES[number];

export interface CrmUpdateStageInput {
  leadId: string;
  projectId: number;
  stage: string;
}

export interface CrmUpdateStageOutput {
  leadId: string;
  newStage: string;
}

export class CrmUpdateStageCapability implements Capability<CrmUpdateStageInput, CrmUpdateStageOutput> {
  readonly id = 'CRM_UPDATE_STAGE';
  readonly version = 'v1';

  async execute(input: CrmUpdateStageInput, context: CapabilityContext): Promise<CapabilityResult<CrmUpdateStageOutput>> {
    try {
      if (!context.organizationId) {
        return {
          status: 'failed',
          error: {
            category: 'VALIDATION_ERROR',
            message: 'Missing canonicalOrgId (organizationId) in context',
            retryable: false
          }
        };
      }

      // Guardrail 2: Lista Blanca de Estados para crmStage
      const requestedStage = input.stage.toUpperCase() as ValidCrmStage;
      if (!VALID_CRM_STAGES.includes(requestedStage)) {
        return {
          status: 'failed',
          error: {
            category: 'VALIDATION_ERROR',
            message: `Invalid CRM Stage: ${input.stage}. Must be one of: ${VALID_CRM_STAGES.join(', ')}`,
            retryable: false
          }
        };
      }

      // Guardrail 1: Mapeo y Caché Server-Side de canonicalOrgId <-> projectId
      // Validar que el lead exista, pertenezca al projectId suministrado y el projectId corresponda al tenant (canonicalOrgId)
      
      const leadRecords = await db.select({ 
        id: marketingLeads.id, 
        projectId: marketingLeads.projectId 
      })
      .from(marketingLeads)
      .where(
        and(
          eq(marketingLeads.id, input.leadId),
          eq(marketingLeads.projectId, input.projectId)
        )
      )
      .limit(1);

      const lead = leadRecords[0];

      if (!lead) {
        return {
          status: 'failed',
          error: {
            category: 'NOT_FOUND',
            message: `Lead ${input.leadId} not found in project ${input.projectId}`,
            retryable: false
          }
        };
      }

      // Resolver projectId contra el canonicalOrgId (context.organizationId)
      const projectRecords = await db.select({ 
        id: projects.id,
        organizationId: projects.organizationId,
        slug: projects.slug
      })
      .from(projects)
      .where(eq(projects.id, lead.projectId))
      .limit(1);

      const project = projectRecords[0];

      // Verificamos si organizationId (uuid) del proyecto coincide con context.organizationId.
      // A veces context.organizationId es un slug ('snarai'), por ende hacemos fallback al slug
      const isOrgIdMatch = project && project.organizationId === context.organizationId;
      const isSlugMatch = project && project.slug === context.organizationId;

      if (!project || (!isOrgIdMatch && !isSlugMatch)) {
        return {
          status: 'failed',
          error: {
            category: 'VALIDATION_ERROR',
            message: `TenantMismatchSecurityViolation: Project ${lead.projectId} does not belong to authorized context ${context.organizationId}`,
            retryable: false
          }
        };
      }

      // Mutación Drizzle real
      const updatedLeads = await db.update(marketingLeads)
        .set({ crmStage: requestedStage })
        .where(
          and(
            eq(marketingLeads.id, input.leadId),
            eq(marketingLeads.projectId, input.projectId)
          )
        )
        .returning({ id: marketingLeads.id, crmStage: marketingLeads.crmStage });

      const updatedLead = updatedLeads[0];
      if (!updatedLead) {
        return {
          status: 'failed',
          error: {
            category: 'UNKNOWN_ERROR',
            message: 'Failed to update CRM stage (no record returned)',
            retryable: true
          }
        };
      }

      return {
        status: 'succeeded',
        data: {
          leadId: updatedLead.id,
          newStage: updatedLead.crmStage
        }
      };
    } catch (error: any) {
      return {
        status: 'failed',
        error: {
          category: 'UNKNOWN_ERROR',
          message: error.message || 'Failed to update CRM stage',
          retryable: true
        }
      };
    }
  }
}

/**
 * Control Plane Composition Root
 * 
 * Única fuente de verdad para las dependencias del Control Plane.
 * La UI y Server Actions NUNCA instancian repositorios directamente.
 * 
 * ADR-013: Application Layer permanece infraestructura-agnóstica.
 */
import { PostgresOperationalIntentRepository } from '~/lib/pandoras/infrastructure/repositories/postgres-operational-intent-repository';
import { PostgresGovernanceEventRepository } from '~/lib/pandoras/infrastructure/repositories/postgres-governance-event-repository';
import { PostgresMissionRepository } from '~/lib/pandoras/infrastructure/repositories/postgres-mission-repository';
import { PostgresApprovalTransaction } from '~/lib/pandoras/infrastructure/transactions/postgres-approval-transaction';
import { GovernanceEventBus } from '~/lib/pandoras/core/domains/governance/events/governance-event-bus';
import { ApprovalService } from '~/lib/pandoras/core/domains/governance/approval-service';
import { ApproveIntentCommand } from '~/lib/pandoras/core/domains/control-plane/application/commands/approve-intent';
import { RejectIntentCommand } from '~/lib/pandoras/core/domains/control-plane/application/commands/reject-intent';
import { GetOrganizationOverviewQuery } from '~/lib/pandoras/core/domains/control-plane/application/queries/get-organization-overview';
import { GetActiveMissionsQuery } from '~/lib/pandoras/core/domains/control-plane/application/queries/get-active-missions';
import { GetPendingIntentsQuery } from '~/lib/pandoras/core/domains/control-plane/application/queries/get-pending-intents';
import { GetMissionAuditTrailQuery } from '~/lib/pandoras/core/domains/control-plane/application/queries/get-mission-audit-trail';

// ============================================================================
// Infrastructure Adapters (private to this module)
// ============================================================================
const intentRepo = new PostgresOperationalIntentRepository();
const governanceEventRepo = new PostgresGovernanceEventRepository();
const missionRepo = new PostgresMissionRepository();
const approvalTransaction = new PostgresApprovalTransaction();
const eventBus = GovernanceEventBus.getInstance();

// ============================================================================
// Domain Services
// ============================================================================
const approvalService = new ApprovalService(approvalTransaction, eventBus);

// ============================================================================
// Application — Commands
// ============================================================================
export const approveIntentCommand = new ApproveIntentCommand(approvalService);
export const rejectIntentCommand = new RejectIntentCommand(approvalService);

// ============================================================================
// Application — Queries
// ============================================================================
export const getOverviewQuery = new GetOrganizationOverviewQuery(intentRepo, missionRepo);
export const getMissionsQuery = new GetActiveMissionsQuery(missionRepo);
export const getPendingIntentsQuery = new GetPendingIntentsQuery(intentRepo);
export const getAuditTrailQuery = new GetMissionAuditTrailQuery(governanceEventRepo);

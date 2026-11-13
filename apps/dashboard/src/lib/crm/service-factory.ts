/**
 * Fábrica de servicios CRM (P0.2).
 *
 * Punto único de composición: repositorio, verificación de referencias, fuente de
 * equipos (P0.1) y sustrato de aprobaciones. Las rutas no instancian adaptadores.
 */

import { DrizzleTeamMembershipRepository } from '@/lib/authorization/drizzle-team-membership-repository';
import { DrizzleReassignmentRequestStore } from '@/lib/authorization/drizzle-reassignment-request-store';
import { DrizzleCrmReferenceChecker, DrizzleCrmRepository } from './drizzle-crm-repository';
import { OpportunityService } from './opportunity-service';

export function getOpportunityService(): OpportunityService {
  return new OpportunityService({
    repository: new DrizzleCrmRepository(),
    references: new DrizzleCrmReferenceChecker(),
    teams: new DrizzleTeamMembershipRepository(),
    reassignmentRequests: new DrizzleReassignmentRequestStore(),
  });
}

export function getCrmRepository(): DrizzleCrmRepository {
  return new DrizzleCrmRepository();
}

export function getReassignmentRequests(): DrizzleReassignmentRequestStore {
  return new DrizzleReassignmentRequestStore();
}

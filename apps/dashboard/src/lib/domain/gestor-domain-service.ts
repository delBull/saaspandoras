import { CommercialDecisionEngine } from './commercial-decision-engine';
import { RecommendationDTO, LeadTimelineEventDTO } from './dto';

/**
 * @deprecated Use CommercialDecisionEngine instead.
 * This service acts as a retrocompatibility proxy for older clients.
 */
export class GestorDomainService {
  /**
   * @deprecated Use CommercialDecisionEngine.getDecisions() instead.
   */
  static async getRecommendations(projectId: number, ambassadorId: string): Promise<RecommendationDTO[]> {
    return CommercialDecisionEngine.getDecisions(projectId, ambassadorId);
  }

  /**
   * @deprecated Use CommercialDecisionEngine.getActivityStream() instead.
   */
  static async getLeadTimeline(leadId: string): Promise<LeadTimelineEventDTO[]> {
    return CommercialDecisionEngine.getActivityStream(leadId);
  }
}

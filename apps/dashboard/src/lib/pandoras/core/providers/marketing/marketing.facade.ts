import { ExecutionRequest, ExecutionResult } from '../../contracts';
import { MarketingDomainService } from '@/lib/domain/marketing-domain-service';

/**
 * La Fachada oculta la implementación real (servicios, DB, helpers).
 * El Provider le delega el `ExecutionRequest`.
 */
export class MarketingFacade {
  static async handleLaunchCampaign(request: ExecutionRequest): Promise<any> {
    const { identity, input } = request;
    // Asumimos que tenantId es nuestro projectId en el sistema legacy por ahora,
    // o viene en el metadata/input
    const projectId = identity.tenantId ? parseInt(identity.tenantId, 10) : (input.projectId || 0);

    const result = await MarketingDomainService.launchCampaign(projectId, input.campaignData || {});
    return result;
  }

  static async handleGetStats(request: ExecutionRequest): Promise<any> {
    const { identity } = request;
    const projectId = identity.tenantId ? parseInt(identity.tenantId, 10) : 0;
    
    const stats = await MarketingDomainService.getProjectMarketingStats(projectId);
    return stats;
  }
}

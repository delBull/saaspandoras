import { AbstractProvider } from '../abstract-provider';
import { ExecutionRequest, ExecutionResult, ProviderDefinition } from '../../contracts';
import { MarketingFacade } from './marketing.facade';

export class MarketingProvider extends AbstractProvider {
  get definition(): ProviderDefinition {
    return {
      id: 'growth_marketing_provider_v1',
      name: 'Growth OS Marketing Provider',
      version: '1.0.0',
      capabilities: [
        'marketing.launchCampaign',
        'marketing.getStats'
      ],
      health: 'HEALTHY',
      priority: 100,
    };
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    try {
      switch (request.capability) {
        case 'marketing.launchCampaign': {
          const data = await MarketingFacade.handleLaunchCampaign(request);
          return this.createSuccessResult(request.capability, data);
        }
        case 'marketing.getStats': {
          const stats = await MarketingFacade.handleGetStats(request);
          return this.createSuccessResult(request.capability, stats);
        }
        default:
          return this.createErrorResult(
            request.capability,
            'UNSUPPORTED_CAPABILITY',
            `El provider ${this.definition.id} no soporta la capability ${request.capability}.`
          );
      }
    } catch (error: any) {
      return this.createErrorResult(
        request.capability,
        'EXECUTION_FAILED',
        error.message || 'Error desconocido en MarketingProvider',
        error
      );
    }
  }
}

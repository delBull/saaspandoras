import { AbstractProvider } from '../../providers/abstract-provider';
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
          return { success: true, actionExecuted: request.capability, data };
        }
        case 'marketing.getStats': {
          const stats = await MarketingFacade.handleGetStats(request);
          return { success: true, actionExecuted: request.capability, data: stats };
        }
        default:
          return {
            success: false,
            actionExecuted: request.capability,
            data: null,
            error: {
              code: 'UNSUPPORTED_CAPABILITY',
              message: `El provider ${this.definition.id} no soporta la capability ${request.capability}.`
            }
          };
      }
    } catch (error: any) {
      return {
        success: false,
        actionExecuted: request.capability,
        data: null,
        error: {
          code: 'EXECUTION_FAILED',
          message: error.message || 'Error desconocido en MarketingProvider',
          details: error
        }
      };
    }
  }
}

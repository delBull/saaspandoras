import { ExecutionIdentitySnapshot, RuntimeMetadata, OrganizationIdentity, ActorIdentity, EnvironmentContext } from '../contracts';
import { 
  ITenantResolver, 
  IBrandResolver, 
  IPolicyResolver, 
  IUserResolver, 
  ILocalizationResolver, 
  ICapabilityContextResolver 
} from './resolvers';

export interface IdentityResolutionRequest {
  tenantId: string;
  userId: string;
  sourceApp: string; // ej: 'hermes', 'snarai'
}

/**
 * Ensamblador que orquesta la construcción del Snapshot Inmutable.
 * Delega en resolvers modulares para construir los 7 pilares del contexto.
 */
export class ExecutionIdentityAssembler {
  constructor(
    private tenantResolver: ITenantResolver,
    private brandResolver: IBrandResolver,
    private policyResolver: IPolicyResolver,
    private userResolver: IUserResolver,
    private localizationResolver: ILocalizationResolver,
    private capabilityResolver: ICapabilityContextResolver
  ) {}

  /**
   * Ensambla y congela (Snapshot) la identidad para una nueva ejecución.
   */
  public async assemble(request: IdentityResolutionRequest): Promise<ExecutionIdentitySnapshot> {
    const [
      tenant,
      branding,
      policy,
      user,
      localization,
      capabilities
    ] = await Promise.all([
      this.tenantResolver.resolve(request.tenantId),
      this.brandResolver.resolve(request.tenantId),
      this.policyResolver.resolve(request.tenantId),
      this.userResolver.resolve(request.userId),
      this.localizationResolver.resolve(request.tenantId, request.userId),
      this.capabilityResolver.resolve(request.tenantId)
    ]);

    const metadata: RuntimeMetadata = {
      executionId: `exec_${Date.now()}`,
      correlationId: `corr_${Date.now()}`,
      traceId: `trace_${Date.now()}`,
      sourceApp: request.sourceApp,
      version: '1.0'
    };

    // Map legacy resolver outputs → ExecutionIdentitySnapshot contract (ADR-007)
    const organization: OrganizationIdentity = {
      id: tenant.id,
      name: tenant.organization,
      brand: { palette: undefined, logoUrl: undefined },
      voice: branding.voice,
      locale: localization.locale,
    };

    const actor: ActorIdentity = {
      userId: user.id,
      roles: user.roles,
      permissions: user.permissions,
      wallet: user.wallet,
    };

    const environment: EnvironmentContext = {
      stage: (tenant.environment as EnvironmentContext['stage']) ?? 'development',
      timezone: localization.timezone,
      region: tenant.region,
      language: localization.language,
      units: (localization.units as EnvironmentContext['units']) ?? 'metric',
    };

    // Devolvemos el Snapshot. Una vez creado, NO DEBE mutar.
    return Object.freeze({
      organization,
      actor,
      environment,
      capabilities: { available: Object.keys(capabilities) },
      packs: { installed: [] },
      providers: {},
      policies: {
        limits: {
          budgetUsd: policy.budgetUsd,
          allowedModels: policy.allowedModels,
          securityLevel: (policy.securityLevel as 'standard' | 'high' | 'critical'),
        }
      },
      metadata,
    });
  }
}


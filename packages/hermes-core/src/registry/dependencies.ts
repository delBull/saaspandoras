export interface IIdentityResolver {
    resolveIdentity(channelId: string, channel: string): Promise<any>;
}
export interface IPlatformCapabilityRegistry {
    requireCapability(actor: any, capability: string, targetScope?: any): void;
}
export interface IPlatformAuditLedger {
    logEvent(event: any): Promise<void>;
}
export interface INexusTeamNotificationDispatcher {
    dispatch(event: any): Promise<void>;
}
export interface ICapabilityRegistry {
    executeCapability(cap: string, params: any): Promise<any>;
}
export interface ISetupProgressService {
    updateProgress(tenantId: string, step: string): Promise<void>;
}
export interface ITenantProvisioningService {
    provision(params: any): Promise<any>;
}
export interface IDiscordWebhookService {
    send(params: any): Promise<void>;
}

class HermesDependencyRegistry {
    private deps: Record<string, any> = {};

    register(key: string, service: any) {
        this.deps[key] = service;
    }

    get<T>(key: string): T {
        if (!this.deps[key]) {
            console.warn(`[HermesRegistry] Dependency ${key} is not registered yet. Falling back to dynamic require.`);
            // Fallback for development/extirpation
            try {
                if (key === 'IdentityResolver') return require('@saasfly/shared').IdentityResolver;
                if (key === 'PlatformCapabilityRegistryService') return require('@/lib/admin/platform-capability-registry.service').PlatformCapabilityRegistryService;
                if (key === 'PlatformAuditLedgerService') return require('@/lib/admin/platform-audit-ledger.service').PlatformAuditLedgerService;
                if (key === 'NexusTeamNotificationDispatcher') return require('@saasfly/shared').NexusTeamNotificationDispatcher;
                if (key === 'capabilityRegistry') return require('@/lib/growth/capability-registry.service').capabilityRegistry;
                if (key === 'SetupProgressService') return require('@saasfly/shared').SetupProgressService;
                if (key === 'tenantProvisioningService') return require('@saasfly/shared').tenantProvisioningService;
                if (key === 'DiscordWebhookService') return require('@/lib/integrations/discord/webhook').DiscordWebhookService;
            } catch (e) {
                // Ignore
            }
        }
        return this.deps[key] as T;
    }
}

export const hermesRegistry = new HermesDependencyRegistry();

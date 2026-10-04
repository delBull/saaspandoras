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
            throw new Error(`[HermesRegistry] FATAL: Dependency ${key} is not registered. You must initialize DI before using this component.`);
        }
        return this.deps[key] as T;
    }
}

export const hermesRegistry = new HermesDependencyRegistry();

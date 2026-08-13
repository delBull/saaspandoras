import { AddOnRegistryService, HermesAddOnManifest } from './registry';

export type InstallationState = 
  | 'INSTALLING'
  | 'CONFIGURING'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'PAUSED'
  | 'DEPRECATED'
  | 'RETIRED';

export interface InstallationRecord {
  id: string; // uuid
  tenantId: string;
  addonId: string;
  addonVersion: string;
  state: InstallationState;
  configuration: Record<string, any>;
  installedAt: Date;
  updatedAt: Date;
}

export class AddOnInstallationManager {
  // Mock DB for architectural test
  private static installations: Map<string, InstallationRecord> = new Map();

  /** Transiciona a INSTALLING y genera un record en Tenant DB */
  static async requestInstallation(tenantId: string, addonId: string, version: string): Promise<InstallationRecord> {
    const addon = AddOnRegistryService.getAddOn(addonId, version);
    if (!addon) {
      throw new Error(`Add-On ${addonId}@${version} not found in Registry`);
    }

    const installation: InstallationRecord = {
      id: `${tenantId}-${addonId}`, // Simplified for mockup
      tenantId,
      addonId,
      addonVersion: version,
      state: 'INSTALLING',
      configuration: {},
      installedAt: new Date(),
      updatedAt: new Date(),
    };

    this.installations.set(installation.id, installation);
    console.log(`[InstallationManager] Add-On ${addonId} requested for ${tenantId}. State: INSTALLING`);
    
    // Auto-transition to CONFIGURING as it requires tenant inputs
    await this.transitionState(installation.id, 'CONFIGURING');
    
    return this.installations.get(installation.id)!;
  }

  /** Guarda la configuración del Tenant y transiciona a PENDING_APPROVAL o ACTIVE */
  static async configure(tenantId: string, installationId: string, config: Record<string, any>): Promise<InstallationRecord> {
    const installation = this.installations.get(installationId);
    if (!installation) throw new Error("Installation not found");
    if (installation.state !== 'CONFIGURING' && installation.state !== 'PENDING_APPROVAL') {
      throw new Error("Can only configure when in CONFIGURING or PENDING_APPROVAL states");
    }

    installation.configuration = config;
    installation.updatedAt = new Date();

    const addon = AddOnRegistryService.getAddOn(installation.addonId, installation.addonVersion);
    
    // Check if Human Approval is required based on AddOn Manifest (Mock logic)
    const requiresApproval = addon?.governanceRequirements?.length ? true : false;

    if (requiresApproval) {
      await this.transitionState(installationId, 'PENDING_APPROVAL');
    } else {
      await this.transitionState(installationId, 'ACTIVE');
    }

    return installation;
  }

  /** Approves an installation that is PENDING_APPROVAL */
  static async approve(tenantId: string, installationId: string): Promise<InstallationRecord> {
    const installation = this.installations.get(installationId);
    if (!installation) throw new Error("Installation not found");
    if (installation.state !== 'PENDING_APPROVAL') {
      throw new Error("Can only approve when in PENDING_APPROVAL state");
    }

    await this.transitionState(installationId, 'ACTIVE');
    return installation;
  }

  /** Pausa un Add-On activo */
  static async pause(tenantId: string, installationId: string): Promise<InstallationRecord> {
    const installation = this.installations.get(installationId);
    if (!installation) throw new Error("Installation not found");
    if (installation.state !== 'ACTIVE') {
      throw new Error("Can only pause ACTIVE Add-Ons");
    }

    await this.transitionState(installationId, 'PAUSED');
    return installation;
  }

  static async getActiveAddOns(tenantId: string): Promise<HermesAddOnManifest[]> {
    const active = Array.from(this.installations.values())
      .filter(i => i.tenantId === tenantId && i.state === 'ACTIVE');
    
    return active.map(i => AddOnRegistryService.getAddOn(i.addonId, i.addonVersion)!)
      .filter(Boolean); // removes undefined
  }

  private static async transitionState(installationId: string, newState: InstallationState) {
    const installation = this.installations.get(installationId);
    if (installation) {
      const oldState = installation.state;
      installation.state = newState;
      installation.updatedAt = new Date();
      console.log(`[InstallationManager] ${installation.addonId} state transitioned: ${oldState} -> ${newState}`);
    }
  }
}

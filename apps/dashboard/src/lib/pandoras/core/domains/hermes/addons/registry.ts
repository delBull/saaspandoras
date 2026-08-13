export type AddOnCategory = 'CAPABILITY' | 'STRATEGY' | 'JOURNEY' | 'INTEGRATION';

export type AddOnDefinitionStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED';

export interface CapabilityDefinition {
  id: string;
  name: string;
}

export interface KnowledgeOverlayDefinition {
  id: string;
  source: string;
  category: string;
}

export interface JourneyDefinition {
  id: string;
  source: string;
}

export interface StyleOverlayDefinition {
  mode: string;
  warmth: 'high' | 'medium' | 'low';
  exclusivity: 'high' | 'medium' | 'low';
  directness: 'high' | 'medium' | 'low';
  pressure: 'high' | 'medium' | 'low';
  personalization: 'high' | 'medium' | 'low';
  informality?: 'constrained' | 'high' | 'low';
}

export interface ChannelRequirement {
  channel: 'whatsapp' | 'telegram' | 'email';
  isRequired: boolean;
}

export interface GovernanceRequirement {
  rule: string;
  description: string;
}

export interface CompatibilityContract {
  minHermesVersion: string;
}

export interface HermesAddOnManifest {
  id: string;
  version: string;
  name: string;
  description: string;

  category: AddOnCategory[];
  status: AddOnDefinitionStatus;

  capabilities?: CapabilityDefinition[];
  knowledgeOverlays?: KnowledgeOverlayDefinition[];
  journeys?: JourneyDefinition[];
  styleOverlay?: StyleOverlayDefinition;
  requiredChannels?: ChannelRequirement[];
  governanceRequirements?: GovernanceRequirement[];
  configurationSchema?: Record<string, any>;
  compatibility?: CompatibilityContract;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  errors: string[];
}

export class AddOnRegistryService {
  private static addOns: Map<string, HermesAddOnManifest> = new Map();

  /** Registra un Add-On en el catálogo maestro */
  static register(manifest: HermesAddOnManifest): void {
    const key = `${manifest.id}@${manifest.version}`;
    this.addOns.set(key, manifest);
    console.log(`[AddOnRegistry] Registered Add-On: ${key}`);
  }

  /** Obtiene todos los Add-Ons disponibles en el ecosistema */
  static getAvailableAddOns(): HermesAddOnManifest[] {
    return Array.from(this.addOns.values());
  }

  /** Obtiene un Add-On específico por su ID y Versión */
  static getAddOn(id: string, version: string): HermesAddOnManifest | undefined {
    return this.addOns.get(`${id}@${version}`);
  }

  /** Verifica compatibilidad entre dos Add-Ons o con el Core */
  static validateCompatibility(addonIds: string[]): CompatibilityResult {
    // Basic stub for architectural representation
    return {
      isCompatible: true,
      errors: []
    };
  }
}

import { AddOnCapability } from './addon-capability';
import { AddOnGovernanceRequirements } from './addon-governance';
import { AddOnCompatibility } from './addon-compatibility';

export type AddOnType = 
  | 'CAPABILITY'
  | 'KNOWLEDGE_OVERLAY'
  | 'JOURNEY_PACK'
  | 'CHANNEL_EXTENSION'
  | 'COMPOSITE';

export type AddOnDefinitionStatus = 'AVAILABLE' | 'DEPRECATED';

export interface KnowledgeOverlay {
  id: string;
  source: string;
  category: string;
}

export interface JourneyDefinition {
  id: string;
  source: string;
}

export interface HermesAddOnManifest {
  /** ID global del Add-On (ej. 'vip_family_concierge') */
  id: string;
  name: string;
  version: string;
  
  type: AddOnType;
  description: string;

  /** Qué capacidades declaradas introduce este Add-On */
  capabilities: AddOnCapability[];

  knowledgeOverlays?: KnowledgeOverlay[];
  journeyDefinitions?: JourneyDefinition[];
  styleOverlay?: {
    mode?: string;
    exclusivity?: string;
    [key: string]: any;
  };

  /** Esquema JSON para la configuración del tenant */
  configurationSchema?: Record<string, unknown>;

  /** Declarativo: requerimientos que el Governance Engine evaluará */
  governanceRequirements: AddOnGovernanceRequirements;
  
  compatibility: AddOnCompatibility;
  
  status: AddOnDefinitionStatus;
}

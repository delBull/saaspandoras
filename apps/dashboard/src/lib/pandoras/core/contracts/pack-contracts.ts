/**
 * Pack Contracts
 * Define la estructura de aplicaciones instalables (Packs) dentro de Pandora's OS.
 */

import { CapabilityId } from './capability-contracts';

export interface PackIdentity {
  voice: 'professional' | 'casual' | 'technical' | string;
  domain: string; // ej: 'real_estate', 'legal', 'finance'
  tone: string; // ej: 'premium advisory'
}

export interface PackKnowledgeDefinition {
  sources: {
    type: 'document_repository' | 'vector_store' | 'api' | 'database';
    id: string; // Referencia lógica a la fuente, no la data directa.
  }[];
}

export interface PackActionDefinition {
  id: string;
  execution: {
    workflow?: string; // Nombre del workflow sugerido (el OS decide si lo usa)
    capability?: CapabilityId;
  };
}

export interface PackGoalTemplate {
  id: string;
  name: string;
  milestones: string[];
}

export interface PackMissionTemplate {
  template: string; // ID de la plantilla
  initialState: string;
}

export interface PackLifecycle {
  onInstall?: string[];
  onActivate?: string[];
  onUpgrade?: string[];
  onDeactivate?: string[];
  onUninstall?: string[];
}

/**
 * La declaración formal de un Pack.
 */
export interface PackManifest {
  id: string;
  name: string;
  version: string;
  type: 'organization-pack' | 'system-pack';
  requires: CapabilityId[]; // Capacidades necesarias del SO
  provides: string[]; // Qué roles/servicios provee
  
  identity?: PackIdentity;
  knowledge?: PackKnowledgeDefinition;
  
  goals: PackGoalTemplate[];
  missions: PackMissionTemplate[];
  actions: PackActionDefinition[];
  
  lifecycle?: PackLifecycle;
}

/**
 * Representa la instalación viva de un Pack dentro de una Organización.
 */
export interface InstalledPack {
  organizationId: string;
  packId: string;
  version: string;
  status: 'active' | 'inactive' | 'error';
  installedAt: string;
  configOverrides?: Record<string, any>;
}

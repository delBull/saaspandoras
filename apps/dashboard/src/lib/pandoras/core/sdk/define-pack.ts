
import { CapabilityDefinition, CapabilityAdapter } from '../capabilities/capability-runtime';

/**
 * Metadata distribution structure for a Pandora's OS Pack.
 * This acts as the installation manifest for the OS.
 */
export interface PackManifest {
  /** Uniquely identifies this pack within the Pandora's ecosystem (e.g. 'pandoras.snarai') */
  id: string;
  
  /** SemVer version of the Pack itself */
  version: string;
  
  /** SemVer expression describing compatible OS runtime versions (e.g. '^1.0.0') */
  sdkVersion: string;
  
  /** Human readable display name */
  name: string;
  
  /** Organization or author */
  author?: string;
  
  /** Categories for future marketplace indexing */
  categories?: string[];
  
  /** Tags for fast filtering */
  tags?: string[];
  
  /** 
   * Declarative definitions the pack provides.
   * NOTE: The Pack only DECLARES them. The OS registers them upon installation.
   */
  workflows?: import('./define-workflow').WorkflowPack<any, string>[];
  capabilities?: CapabilityDefinition[];
  adapters?: { capabilityId: string; adapter: CapabilityAdapter<any, any> }[];
  
  // Future extensions for the ecosystem
  knowledge?: any[]; // For Knowledge Engine
  prompts?: any[]; // Default prompts
  assets?: any[]; // Default images/templates
}

/**
 * Developer Experience wrapper to define a Pack with strict typings.
 */
export function definePack(manifest: PackManifest): PackManifest {
  // En el futuro, aquí se puede añadir validación estática del manifest (e.g. validación con Zod)
  return manifest;
}

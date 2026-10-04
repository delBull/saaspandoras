/**
 * Hermes OS — Pack Runtime Types
 * Defines the core abstractions for Source Packs and Compiled Runtimes.
 */

// Lifecycle state of a pack within a tenant
export type PackState =
  | 'registered'
  | 'resolved'
  | 'validated'
  | 'installed'
  | 'configured'
  | 'running'
  | 'paused'
  | 'upgrading'
  | 'failed';

export interface RuntimeCapability {
  runtime: 'memory' | 'conversation' | 'media' | 'discovery' | 'identity' | 'scheduling' | 'connector';
  version: string; // e.g. "^1.0.0"
}

// Declarative knowledge item — each file is a first-class indexed asset
export interface KnowledgeItem {
  id: string;
  source: string; // relative path to .md file within the pack
  category: 'narrative' | 'thesis' | 'support' | 'process' | 'context' | 'objection_handling';
  priority: 'high' | 'medium' | 'low';
  embeddable: boolean; // Can be embedded into vector store for RAG
  discoverable: boolean; // Should be surfaced by Discovery Runtime (SEO / LLMs)
}

// Declarative journey reference — journeys live as files, not inline code
export interface JourneyRef {
  id: string;
  source: string; // relative path to .md or .yaml file within the pack
  isDefault?: boolean;
}

export interface DiscoveryConfig {
  entities: string[];
  topics: string[];
  schemas: string[]; // e.g. ['Product', 'FAQPage', 'Organization']
  generateLanding: boolean;
  generateLLMsTxt: boolean;
  generateSitemap: boolean;
}

export interface MediaRequest {
  stage: string;
  type: 'infographic' | 'cta_image' | 'explainer_video' | 'social_asset';
  topic: string;
}

export interface PackOutputs {
  conversation: boolean;
  seo: boolean;
  media: boolean;
  widget: boolean;
  llms: boolean;
  analytics: boolean;
}

/**
 * Source Pack Manifest (Declarative Definition)
 * The pristine source of truth provided by developers or the Registry.
 */
export interface PackManifest {
  id: string;
  version: string;
  // solution_pack = full stack (knowledge + journey + discovery + media + conversation)
  // Use granular types only for single-domain packs
  type: 'identity' | 'knowledge' | 'journey' | 'discovery' | 'conversation' | 'media' | 'solution_pack' | 'combo';
  publisher: string;
  description: string;

  // OS Dependencies
  capabilities: RuntimeCapability[];
  dependencies: string[]; // IDs of other required Packs

  // Declarative Domain Definitions (loaded from files by the Compiler)
  knowledge?: KnowledgeItem[];
  journeys?: JourneyRef[];
  discovery?: DiscoveryConfig;
  conversation?: Record<string, any>;
  media?: { requests: MediaRequest[] };
  events?: { emits: string[] };

  // Compiler Output Gates
  outputs?: PackOutputs;

  permissions?: string[];
}

/**
 * Compiled Runtime Manifest
 * The final optimized output of the Pack Compiler for a specific tenant.
 * Only metadata and checksums are stored — never the full manifest JSON.
 */
export interface CompiledRuntimeManifest {
  manifestVersion: string;
  resolvedOverrides: Record<string, any>;
  checksum: string; // sha256 to detect tampering
  compiledAt: Date;
  compiledBy: string; // Compiler version e.g. 'hermes-compiler-v1.0.0'
  status: PackState;
}

/**
 * Hermes OS — Discovery Compiler Types
 * 
 * Discovery works in two layers:
 *   1. CompiledDiscoveryManifest → semantic model (AST)
 *   2. Renderers → convert the manifest to outputs (llms.txt, sitemap, JSON-LD)
 */

import { CompiledRuntimeManifest } from './pack-types';

// ── Input ──────────────────────────────────────────────────────────────────
// Discovery compiler reads the CompiledRuntimeManifest, never the Source Pack.
export interface DiscoveryCompilerInput {
  tenantId: number;
  runtimeManifest: CompiledRuntimeManifest & { resolvedOverrides: Record<string, any> };
}

// ── Entity Graph ────────────────────────────────────────────────────────────
// The bridge between Discovery, Hermes, Media Co, Analytics, and Sofía.
export interface DiscoveryEntity {
  id: string;
  name: string;
  type: 'organization' | 'product' | 'person' | 'concept' | 'location' | 'event';
  aliases: string[];
  relatedTopics: string[];
  relatedIntents: string[];
  schemaType: string; // e.g. "Product", "Organization", "FAQPage"
}

export interface DiscoveryTopic {
  id: string;
  label: string;
  searchIntent: 'informational' | 'transactional' | 'navigational' | 'commercial';
  relatedEntities: string[]; // entity IDs
  suggestedPages: string[];
  mediaNeeded?: string[]; // e.g. ['infographic', 'video']
}

export interface DiscoveryFAQ {
  question: string;
  answer: string;
  relatedEntityId?: string;
  relatedTopicId?: string;
}

export interface DiscoveryPage {
  path: string;         // e.g. '/inversion', '/tokenizacion'
  title: string;
  description: string;
  entities: string[];
  topics: string[];
  schemaType?: string;
  priority: number;     // 0.0–1.0 for sitemap
  changefreq: 'daily' | 'weekly' | 'monthly';
}

export interface EntityGraphEdge {
  from: string;  // entity/topic ID
  to: string;    // entity/topic ID
  relation: 'related_to' | 'part_of' | 'answers' | 'leads_to' | 'requires';
}

export interface EntityGraph {
  entities: DiscoveryEntity[];
  topics: DiscoveryTopic[];
  edges: EntityGraphEdge[];
}

// ── CompiledDiscoveryManifest ───────────────────────────────────────────────
// The semantic model produced by the Discovery Compiler.
// This is what ALL consumers (Hermes, Media, LLMs, SEO) use.
// Only the metadata+checksum is persisted to DB — not the full object.
export interface CompiledDiscoveryManifest {
  tenantId: number;

  // Semantic model
  faqs: DiscoveryFAQ[];
  pages: DiscoveryPage[];
  graph: EntityGraph;

  // Compilation metadata (persisted to DB)
  checksum: string;          // sha256 of the discovery model
  runtimeChecksum: string;   // Checksum of the RuntimeManifest used as input
  generatedAt: Date;
  compiledBy: string;        // 'hermes-discovery-compiler-v1.0.0'
}

// ── Renderer Interface ──────────────────────────────────────────────────────
// Renderers take the CompiledDiscoveryManifest and produce output formats.
// Discovery Compiler never touches these — it only produces the manifest.
export interface IDiscoveryRenderer<T> {
  render(manifest: CompiledDiscoveryManifest, tenantContext: Record<string, any>): T;
}

import * as crypto from 'crypto';
import { CompiledRuntimeManifest } from './pack-types';
import {
  CompiledDiscoveryManifest,
  DiscoveryEntity,
  DiscoveryTopic,
  DiscoveryFAQ,
  DiscoveryPage,
  EntityGraph,
  EntityGraphEdge,
} from './discovery-types';

/**
 * Hermes OS — Discovery Compiler
 *
 * Reads the CompiledRuntimeManifest and produces a CompiledDiscoveryManifest.
 * 
 * Discovery knows NOTHING about tenants by name (S'Narai, Oscar, etc.).
 * Everything comes from the compiled runtime — tenantId + resolvedOverrides.
 *
 * Pipeline:
 *   CompiledRuntimeManifest → DiscoveryCompiler → CompiledDiscoveryManifest
 *                                                          ↓
 *                                            LLMsRenderer | SitemapRenderer
 *                                            SchemaRenderer | EntityGraphAPI
 */
export class DiscoveryCompiler {

  /**
   * Compile a full DiscoveryManifest from the tenant's CompiledRuntimeManifest.
   */
  async compile(
    tenantId: number,
    runtimeManifest: CompiledRuntimeManifest & { resolvedOverrides: Record<string, any> }
  ): Promise<CompiledDiscoveryManifest> {
    const overrides = runtimeManifest.resolvedOverrides;
    const packs = overrides?.packs || {};

    // 1. Extract discovery config from all installed packs' resolvedOverrides
    const allDiscoveryConfigs = Object.values(packs)
      .map((packData: any) => packData?.discovery)
      .filter(Boolean);

    // Merge entities and topics across all packs
    const rawEntities: string[] = allDiscoveryConfigs.flatMap((d: any) => d?.entities || []);
    const rawTopics: string[] = allDiscoveryConfigs.flatMap((d: any) => d?.topics || []);
    const rawSchemas: string[] = allDiscoveryConfigs.flatMap((d: any) => d?.schemas || []);
    const rawFAQs: any[] = allDiscoveryConfigs.flatMap((d: any) => d?.faqs || []);

    // 2. Build Entity Graph
    const graph = this.buildEntityGraph(rawEntities, rawTopics, rawSchemas);

    // 3. Build FAQ model from knowledge slots if present
    const faqs = this.extractFAQs(packs, rawFAQs);

    // 4. Generate Pages from topics and entities
    const pages = this.generatePages(graph);

    // 5. Compute checksums
    const manifestInput = JSON.stringify({ tenantId, entities: rawEntities, topics: rawTopics, faqs });
    const checksum = crypto.createHash('sha256').update(manifestInput).digest('hex');

    const discoveryManifest: CompiledDiscoveryManifest = {
      tenantId,
      faqs,
      pages,
      graph,
      checksum,
      runtimeChecksum: runtimeManifest.checksum,
      generatedAt: new Date(),
      compiledBy: 'hermes-discovery-compiler-v1.0.0',
    };

    console.log(`[DiscoveryCompiler] Compiled for tenant ${tenantId}:`);
    console.log(`  Entities: ${graph.entities.length}`);
    console.log(`  Topics: ${graph.topics.length}`);
    console.log(`  FAQs: ${faqs.length}`);
    console.log(`  Pages: ${pages.length}`);
    console.log(`  Checksum: ${checksum.substring(0, 16)}...`);

    return discoveryManifest;
  }

  private buildEntityGraph(rawEntities: string[], rawTopics: string[], schemaTypes: string[]): EntityGraph {
    // Map raw entity strings → DiscoveryEntity objects
    const entities: DiscoveryEntity[] = rawEntities.map((name, i) => ({
      id: `entity_${i}_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name,
      type: 'concept', // Default — can be overridden by future enrichment
      aliases: [],
      relatedTopics: rawTopics.map((t, ti) => `topic_${ti}`).slice(0, 3),
      relatedIntents: [],
      schemaType: schemaTypes[i] || 'Thing',
    }));

    // Map raw topic strings → DiscoveryTopic objects
    const topics: DiscoveryTopic[] = rawTopics.map((label, i) => ({
      id: `topic_${i}`,
      label,
      searchIntent: 'informational' as const,
      relatedEntities: entities.slice(0, 2).map(e => e.id),
      suggestedPages: [`/${label.toLowerCase().replace(/\s+/g, '-')}`],
      mediaNeeded: ['infographic'],
    }));

    // Build edges: entity ↔ topic
    const edges: EntityGraphEdge[] = [];
    for (const entity of entities) {
      for (const topicId of entity.relatedTopics) {
        edges.push({ from: entity.id, to: topicId, relation: 'related_to' });
      }
    }

    return { entities, topics, edges };
  }

  private extractFAQs(packs: Record<string, any>, rawFAQs: any[]): DiscoveryFAQ[] {
    // If FAQs are provided explicitly in discovery config, use them
    if (rawFAQs.length > 0) {
      return rawFAQs.map(faq => ({
        question: faq.question || '',
        answer: faq.answer || '',
        relatedEntityId: faq.relatedEntityId,
        relatedTopicId: faq.relatedTopicId,
      }));
    }

    // Otherwise, generate placeholder FAQs from knowledge slots as a starting point
    // These will be enriched by the Knowledge Compiler in a future sprint
    return [];
  }

  private generatePages(graph: EntityGraph): DiscoveryPage[] {
    const pages: DiscoveryPage[] = [];

    // Home page
    pages.push({
      path: '/',
      title: 'Inicio',
      description: 'Plataforma principal',
      entities: graph.entities.slice(0, 3).map(e => e.id),
      topics: graph.topics.slice(0, 3).map(t => t.id),
      schemaType: 'WebSite',
      priority: 1.0,
      changefreq: 'weekly',
    });

    // Generate one page per topic
    for (const topic of graph.topics) {
      pages.push({
        path: `/${topic.label.toLowerCase().replace(/\s+/g, '-')}`,
        title: topic.label,
        description: `Información sobre ${topic.label}`,
        entities: topic.relatedEntities,
        topics: [topic.id],
        schemaType: 'Article',
        priority: 0.8,
        changefreq: 'monthly',
      });
    }

    return pages;
  }
}

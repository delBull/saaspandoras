import { CompiledDiscoveryManifest, IDiscoveryRenderer } from '../../runtimes/discovery-types';

/**
 * Schema Renderer
 * Produces JSON-LD structured data from the CompiledDiscoveryManifest.
 * Each page gets its own JSON-LD block based on schemaType.
 */
export class SchemaRenderer implements IDiscoveryRenderer<Record<string, any>[]> {
  render(manifest: CompiledDiscoveryManifest, tenantContext: Record<string, any>): Record<string, any>[] {
    const baseUrl = tenantContext.website || `https://tenant-${manifest.tenantId}.pandoras.finance`;
    const projectName = tenantContext.projectName || 'Project';
    const schemas: Record<string, any>[] = [];

    // Organization schema (always present)
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: projectName,
      url: baseUrl,
    });

    // Product schema for each product entity
    for (const entity of manifest.graph.entities.filter(e => e.schemaType === 'Product')) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: entity.name,
        description: `Investment product: ${entity.name}`,
        url: baseUrl,
      });
    }

    // FAQPage schema if FAQs exist
    if (manifest.faqs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: manifest.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      });
    }

    return schemas;
  }
}

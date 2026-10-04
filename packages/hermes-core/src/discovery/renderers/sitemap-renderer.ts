import { CompiledDiscoveryManifest, IDiscoveryRenderer } from '../../runtimes/discovery-types';

/**
 * Sitemap Renderer
 * Produces an XML sitemap string from the CompiledDiscoveryManifest pages.
 * Hermes is invisible — serves as a standard /sitemap.xml for the tenant.
 */
export class SitemapRenderer implements IDiscoveryRenderer<string> {
  render(manifest: CompiledDiscoveryManifest, tenantContext: Record<string, any>): string {
    const baseUrl = tenantContext.website || `https://tenant-${manifest.tenantId}.pandoras.finance`;
    const today = new Date().toISOString().split('T')[0];

    const urlEntries = manifest.pages.map(page => `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;
  }
}

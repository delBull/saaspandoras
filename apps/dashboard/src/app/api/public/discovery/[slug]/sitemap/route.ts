import { NextRequest, NextResponse } from 'next/server';
import { resolveDiscoveryManifest } from '@/lib/hermes/discovery/discovery-router';
import { SitemapRenderer } from '@/lib/hermes/discovery/renderers/sitemap-renderer';

// GET /api/public/discovery/[slug]/sitemap
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { manifest, tenantContext } = await resolveDiscoveryManifest(slug);

    const renderer = new SitemapRenderer();
    const xml = renderer.render(manifest, tenantContext);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

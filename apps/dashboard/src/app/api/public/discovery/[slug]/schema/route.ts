import { NextRequest, NextResponse } from 'next/server';
import { resolveDiscoveryManifest } from '@saasfly/hermes-core';
import { SchemaRenderer } from '@saasfly/hermes-core';

// GET /api/public/discovery/[slug]/schema
// Returns JSON-LD schemas for the tenant (Organization, Product, FAQPage)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { manifest, tenantContext } = await resolveDiscoveryManifest(slug);

    const renderer = new SchemaRenderer();
    const schemas = renderer.render(manifest, tenantContext);

    return NextResponse.json(schemas, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

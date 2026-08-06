import { NextRequest, NextResponse } from 'next/server';
import { resolveDiscoveryManifest } from '@/lib/hermes/discovery/discovery-router';
import { LLMsRenderer } from '@/lib/hermes/discovery/renderers/llms-renderer';

// GET /api/public/discovery/[slug]/llms
// Serves as the source for /llms.txt on the tenant's site
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { manifest, tenantContext } = await resolveDiscoveryManifest(slug);

    const renderer = new LLMsRenderer();
    const output = renderer.render(manifest, tenantContext);

    return new NextResponse(output, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

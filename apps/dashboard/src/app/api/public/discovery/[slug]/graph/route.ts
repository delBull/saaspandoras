import { NextRequest, NextResponse } from 'next/server';
import { resolveDiscoveryManifest } from '@/lib/hermes/discovery/discovery-router';

// GET /api/public/discovery/[slug]/graph
// Returns the full Entity Graph — consumed by Hermes, Media Co, Sofía, Analytics
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { manifest } = await resolveDiscoveryManifest(slug);

    return NextResponse.json({
      entities: manifest.graph.entities,
      topics: manifest.graph.topics,
      edges: manifest.graph.edges,
      generatedAt: manifest.generatedAt,
      checksum: manifest.checksum,
    }, {
      status: 200,
      headers: { 'Cache-Control': 'public, max-age=600' },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

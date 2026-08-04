/**
 * GET /api/v1/tenant/[tenantId]/manifest — Fetch the TenantRuntimeManifest
 *
 * This is the bootstrap endpoint Hermes Runtime calls on startup.
 * Returns a TenantRuntimeManifest that tells the Runtime everything it needs:
 * capabilities, active providers, connectors, and knowledge packs.
 *
 * Authentication: Requires X-Pandoras-Key or internal admin token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { RuntimeManifestFactory, type TenantRuntimeManifest } from '@pandoras/runtime-sdk';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  // Strict API Key Authentication Check (IntegrationKeyService / Environment Key)
  const apiKey = req.headers.get('x-pandoras-key') || req.headers.get('x-api-key');
  const expectedSecretKey = process.env.PANDORAS_SECRET_KEY || process.env.PANDORAS_PUBLIC_KEY;
  const isDev = process.env.NODE_ENV === 'development' || tenantId === 'sandbox';

  if (!isDev) {
    if (!apiKey) {
      return NextResponse.json({ error: 'Unauthorized: X-Pandoras-Key missing' }, { status: 401 });
    }
    if (expectedSecretKey && apiKey !== expectedSecretKey && !apiKey.startsWith('pk_test_') && !apiKey.startsWith('sk_test_')) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key format or key' }, { status: 401 });
    }
  }

  try {
    // Fetch from DB — look up tenant by slug
    const project = await db.select().from(projects).where(eq(projects.slug, tenantId)).limit(1);
    
    const firstProject = project && project.length > 0 ? project[0] : null;
    const dbConfig = firstProject && firstProject.tenantRuntimeConfig 
      ? (firstProject.tenantRuntimeConfig as Partial<TenantRuntimeManifest>)
      : null;

    const tier = dbConfig?.tier ?? 'PROFESSIONAL';
    
    // Merge DB config on top of the factory default
    const manifest: TenantRuntimeManifest = {
      ...RuntimeManifestFactory.createDefault(tenantId, tenantId, tier),
      ...(dbConfig || {}),
      providers: {
        llm: {
          provider: 'ollama',
          model: 'llama3.1:8b',
          baseUrl: process.env.OLLAMA_BASE_URL ?? process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434',
          ...(dbConfig?.providers?.llm || {})
        },
        whatsapp: {
          provider: 'meta',
          tier: 'enterprise',
          phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
          tokenRef: 'vault:whatsapp_token', // Vault key reference, never raw
          ...(dbConfig?.providers?.whatsapp || {})
        },
        ...dbConfig?.providers
      },
      manifestVersion: '4.2.0',
    };

    if (!RuntimeManifestFactory.validate(manifest)) {
      return NextResponse.json({ error: 'Invalid manifest — check tenant configuration' }, { status: 500 });
    }

    return NextResponse.json(manifest, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 60s on the caller
      },
    });
  } catch (err) {
    console.error('[manifest/route] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

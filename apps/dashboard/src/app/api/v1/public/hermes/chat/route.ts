import { NextResponse } from 'next/server';
import { db } from '@/db';
import { publicIntegrations } from '@/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { HermesRuntime, getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/hermes/knowledge/types';

// In-memory rate limiting (Replace with Redis in production)
const rateLimitCache = new Map<string, { count: number, resetTime: number }>();

function checkRateLimit(ip: string, policy: { requestsPerMinute: number }): boolean {
  const now = Date.now();
  const limitInfo = rateLimitCache.get(ip);
  if (!limitInfo || now > limitInfo.resetTime) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (limitInfo.count >= policy.requestsPerMinute) {
    return false;
  }
  limitInfo.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const apiKey = authHeader.replace('Bearer ', '').trim();

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Public API Key' }, { status: 401 });
    }

    // 1. Hash key and Validate against public_integrations
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const integrationRecords = await db.select()
      .from(publicIntegrations)
      .where(eq(publicIntegrations.apiKeyHash, hash))
      .limit(1);

    const integration = integrationRecords[0];

    if (!integration || !integration.isActive) {
      return NextResponse.json({ error: 'Invalid or revoked Public Integration Key' }, { status: 403 });
    }

    // Guardrail 3: Whitelist Restrictiva de Capabilities
    const capabilities = integration.allowedCapabilities as string[];
    if (!capabilities.includes('hermes:chat:public')) {
      return NextResponse.json({ error: 'Integration key not authorized for public chat' }, { status: 403 });
    }

    // Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const policy = integration.rateLimitPolicy as { requestsPerMinute: number };
    if (!checkRateLimit(ip, policy)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { message, sessionId = `anon_${Date.now()}` } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message payload' }, { status: 400 });
    }

    // Resolve canonicalOrgId
    const orgContext = await OrganizationSDK.resolve(integration.canonicalOrgId, 'HERMES');

    // Setup strictly limited Public Knowledge Scope
    const restrictedScope: ControlPlaneContext = {
      organizationId: orgContext.organizationId,
      actorId: sessionId,
      role: 'VIEWER',
      permissions: [], // Highly restricted
      identity: {
         name: 'Anonymous Public Visitor'
      }
    };

    const runtime = getDefaultRuntime();
    const response = await runtime.respond({
      organizationId: orgContext.organizationId,
      conversationId: `public_session_${sessionId}`,
      message: {
        id: `msg_public_${Date.now()}`,
        role: 'USER',
        content: message,
        createdAt: new Date(),
      },
      controlPlaneContext: restrictedScope,
    });

    return NextResponse.json({
      success: true,
      sessionId,
      reply: response.content
    });

  } catch (error: any) {
    console.error('[PublicHermesChat] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

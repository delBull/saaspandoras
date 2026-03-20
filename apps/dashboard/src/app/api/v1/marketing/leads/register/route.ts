import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  marketingLeads, 
  marketingLeadEvents, 
  users, 
  integrationClients,
  marketingLeadStatusEnum,
  marketingLeadIntentEnum
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { IdentityService } from '@/lib/marketing/identity-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/marketing/leads/register
 * 
 * Scalable endpoint for multi-tenant lead ingestion.
 * 
 * Header: x-api-key - Validated against integration_clients
 * Body: {
    "email": "user@example.com",
    "name": "John Doe", (optional)
    "intent": "whitelist", (optional, default: explore)
    "consent": true, (required)
    "metadata": {} (optional)
 }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const client = await IntegrationKeyService.validateKey(apiKey);
    if (!client) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    // 2. Parse & Validate Body
    const body = await req.json();
    let { email, name, phoneNumber, walletAddress, fingerprint, origin, intent, consent, metadata, projectId } = body;

    // Resolve Project Context - Ensure it's never null/undefined for the DB
    const targetProjectId = Number(projectId === 'external' ? 1 : (projectId || client.projectId || 1));

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    if (consent !== true) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
    }

    // 3. Identity Layer Lookup (Deduplication)
    const identityHash = IdentityService.getIdentityHash(email, walletAddress, fingerprint);

    const [existingLead, existingUser] = await Promise.all([
      db.query.marketingLeads.findFirst({
        where: and(
            eq(marketingLeads.projectId, targetProjectId),
            eq(marketingLeads.email, email.toLowerCase())
        )
      }),
      db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase())
      })
    ]);

    // 4. Intent Scoring Logic
    let score = 50; 
    if (intent === 'invest') score += 30;
    else if (intent === 'whitelist') score += 20;
    if (existingUser) score += 20;
    if (walletAddress) score += 15;
    if (phoneNumber) score += 10; // Extra score for phone (higher commitment)
    score = Math.min(score, 100);

    // 5. Ingest Lead (Upsert)
    // Create a base object for both insert values and update set
    const baseLeadData = {
      userId: existingUser?.id || null,
      projectId: targetProjectId,
      email: email.toLowerCase(),
      name: name || null,
      phoneNumber: phoneNumber || null,
      walletAddress: walletAddress || existingUser?.walletAddress || null,
      fingerprint: fingerprint || null,
      identityHash: identityHash,
      origin: origin || null,
      intent: (intent || 'explore') as any,
      consent: true,
      metadata: metadata || {},
      status: 'active' as any,
      score: score,
      updatedAt: new Date(),
    };

    const [result] = await db.insert(marketingLeads)
      .values({
        ...baseLeadData,
        createdAt: new Date(), // Only for insert
      })
      .onConflictDoUpdate({
        target: [marketingLeads.projectId, marketingLeads.email],
        set: baseLeadData // updatedAt will capture the change
      })
      .returning();

    // 6. Log Event
    if (result) {
      await db.insert(marketingLeadEvents).values({
        leadId: result.id,
        type: 'lead_created',
        payload: { 
          source: body.projectId === 'external' ? 'widget_global' : 'widget_v1',
          origin,
          calculatedScore: score,
          isVerifiedUser: !!existingUser,
          isNewLead: !existingLead
        }
      });
    }

    console.log(`📥 [Growth OS] Registration successful: ${email} for Project ${targetProjectId}`);

    return NextResponse.json({
      success: true,
      message: 'Lead registered successfully',
      isNewLead: !existingLead,
      data: result ? {
        id: result.id,
        score: result.score,
        status: result.status
      } : null
    });

  } catch (error) {
    console.error('❌ Marketing Lead Registration Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(req: NextRequest) {
    const origin = req.headers.get("origin") || "*";
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key",
        "Access-Control-Allow-Credentials": "true",
      },
    });
}

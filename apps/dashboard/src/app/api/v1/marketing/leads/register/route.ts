import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { 
  marketingLeads, 
  marketingLeadEvents, 
  users, 
  integrationClients,
  marketingLeadStatusEnum,
  marketingLeadIntentEnum,
  projects
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
    const rawAuth = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key') || (rawAuth?.startsWith('Bearer ') ? rawAuth.substring(7) : null);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    // Use request origin/referer as fallback for origin if not provided in body
    const requestOrigin = req.headers.get('origin') || req.headers.get('referer');

    if (!apiKey) {
      console.warn(`[Growth OS] Missing API Key in registration attempt from IP: ${ip}, Origin: ${requestOrigin}`);
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const client = await IntegrationKeyService.validateKey(apiKey);
    if (!client) {
      console.warn(`[SECURITY] Invalid API Key attempt: ${apiKey.substring(0, 12)}... from IP: ${ip}, Origin: ${requestOrigin}`);
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    const { keyType, keyEnv, projectId: clientProjectId } = client;

    // 2. Parse & Validate Body
    const body = await req.json();
    let { email, name, phoneNumber, walletAddress, fingerprint, origin, intent, consent, metadata, projectId } = body;

    if (!origin && requestOrigin) {
      origin = requestOrigin;
    }

    // Resolve Project Context - Support both ID (numeric) and Slug (string)
    let targetProjectId: number;
    let resolutionMethod = 'unknown';

    if (projectId === 'external' || !projectId) {
      targetProjectId = Number(clientProjectId || 1);
      resolutionMethod = projectId === 'external' ? 'explicit_external' : 'client_default';
    } else if (isNaN(Number(projectId))) {
      // It's a slug, try to find it
      const projectBySlug = await db.query.projects.findFirst({
        where: eq(projects.slug, projectId),
        columns: { id: true }
      });
      
      if (projectBySlug) {
        targetProjectId = projectBySlug.id;
        resolutionMethod = 'slug_match';
      } else {
        // FALLBACK: If slug doesn't match, use the client's associated project
        targetProjectId = Number(clientProjectId || 1);
        resolutionMethod = 'slug_mismatch_fallback';
        console.warn(`⚠️ [Growth OS] Slug mismatch: Received "${projectId}", falling back to Client Project ID ${targetProjectId}`);
      }
    } else {
      targetProjectId = Number(projectId);
      resolutionMethod = 'explicit_id';
    }

    // 1.5 Security Check: Allowed Domains (ONLY FOR PUBLIC KEYS)
    const projectContext = await db.query.projects.findFirst({
      where: eq(projects.id, targetProjectId),
      columns: { allowedDomains: true, slug: true }
    });

    if (!projectContext) {
      console.error(`❌ [Growth OS] Project Context not found for ID ${targetProjectId} (Method: ${resolutionMethod})`);
      return NextResponse.json({ error: 'Invalid project context' }, { status: 404 });
    }

    const isSecretKey = keyType === 'secret';

    if (!isSecretKey && projectContext?.allowedDomains && Array.isArray(projectContext.allowedDomains) && projectContext.allowedDomains.length > 0) {
      const isAllowed = projectContext.allowedDomains.some(domain => requestOrigin?.toLowerCase().includes(domain.toLowerCase()));
      if (!isAllowed) {
        console.warn(`[SECURITY] Public Lead blocked for Domain ${requestOrigin} (Project: ${projectContext.slug}, IP: ${ip})`);
        return NextResponse.json({ 
          error: 'Unauthorized domain for this Growth SDK instance',
          details: process.env.NODE_ENV === 'development' ? `Domain ${requestOrigin} not in [${projectContext.allowedDomains.join(',')}]` : undefined
        }, { status: 403 });
      }
    } else if (isSecretKey) {
      console.info(`[AUDIT] Secret Key Registration for Project: ${projectContext.slug} (IP: ${ip}, UA: ${userAgent})`);
    }


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

    // 3.5 Replay Protection / Deduplication
    if (existingLead && existingLead.updatedAt) {
      const lastUpdate = new Date(existingLead.updatedAt).getTime();
      const now = new Date().getTime();
      if (now - lastUpdate < 30000) { // 30 seconds window
        console.info(`[DEDUPE] Lead already registered recently: ${email} for Project ${targetProjectId}`);
        return NextResponse.json({
          success: true,
          message: 'Lead already registered recently',
          isNewLead: false,
          data: {
            id: existingLead.id,
            score: existingLead.score,
            status: existingLead.status
          }
        });
      }
    }

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
      intent: (['invest', 'explore', 'whitelist', 'earn', 'other'].includes(intent) ? intent : 'explore') as any,
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

    if (process.env.NODE_ENV !== 'production') {
      console.log(`📥 [Growth OS] Registration successful: ${email} for Project ${targetProjectId}`);
    }

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
        "Access-Control-Allow-Headers": "Content-Type, x-api-key, Authorization",
        "Access-Control-Allow-Credentials": "true",
      },
    });
}

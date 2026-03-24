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
import { eq, and, or } from 'drizzle-orm';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { IdentityService } from '@/lib/marketing/identity-service';
import { resolveGrowthAction } from '@/lib/marketing/growth-engine/engine';
import { executeGrowthActions, computeNextGrowthMetadata } from '@/lib/marketing/growth-engine/actions';
import { IdentityResolver } from '@/lib/marketing/identity-resolver';
import { AttributionManager } from '@/lib/marketing/scoring-engine';


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

    const isInternalDashboard = requestOrigin?.includes('pandoras.finance') || requestOrigin?.includes('localhost');
    
    let client;
    if (!apiKey && isInternalDashboard) {
      // Use the core Pandora project for internal dashboard leads
      // Try by ID 1 first (Staging/Legacy) then by slug (Production-safe)
      client = await db.query.integrationClients.findFirst({
        where: or(
          eq(integrationClients.projectId, 1),
          eq(integrationClients.name, 'Pandoras Protocol')
        )
      });
      
      console.info(`[Growth OS] Internal Dashboard Lead bypass for Origin: ${requestOrigin}. Client found: ${!!client}`);
    }
 else if (apiKey) {
      client = await IntegrationKeyService.validateKey(apiKey);
    }

    if (!client) {
      // Fallback: If it's internal dashboard and no integration client exists, 
      // check if the main project exists at least.
      if (isInternalDashboard) {
        const mainProject = await db.query.projects.findFirst({
          where: eq(projects.slug, 'pandoras-protocol')
        });
        
        if (mainProject) {
          // Construct a virtual client for the internal logic
          client = {
            projectId: mainProject.id,
            name: 'Internal Dashboard (Legacy Fallback)',
            environment: 'production'
          } as any;
          console.info(`[Growth OS] Using Virtual Internal Client for Project: ${mainProject.slug}`);
        }
      }
    }

    if (!client) {
      console.warn(`[SECURITY] Invalid or missing API Key attempt: ${apiKey?.substring(0, 12) || 'NONE'} from IP: ${ip}, Origin: ${requestOrigin}`);
      return NextResponse.json({ error: 'Invalid or missing API Key' }, { status: 403 });
    }

    const { keyType = 'secret', keyEnv = 'production', projectId: clientProjectId } = client as any;

    // 2. Parse & Validate Body
    const body = await req.json();
    let { email, name, phoneNumber, walletAddress, fingerprint, origin, intent, consent, metadata, projectId, scope: bodyScope } = body;

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
      const projectBySlug = await db.query.projects.findFirst({
        where: eq(projects.slug, projectId),
        columns: { id: true }
      });
      
      if (projectBySlug) {
        targetProjectId = projectBySlug.id;
        resolutionMethod = 'slug_match';
      } else {
        targetProjectId = Number(clientProjectId || 1);
        resolutionMethod = 'slug_mismatch_fallback';
      }
    } else {
      targetProjectId = Number(projectId);
      resolutionMethod = 'explicit_id';
    }

    // --- DUAL ENGINE AUTO-ROUTING ---
    // Detect Scope & Owner Context based on Origin or Explicit Body
    const B2B_PATHWAYS = ['/founders', '/protocol', '/protocol-story', '/start', '/utility', '/help', '/growth-os'];
    const isB2BOrigin = origin && B2B_PATHWAYS.some(path => origin.includes(path));
    
    // Rule: If it's B2B origin OR explicitly b2b in body -> scope: b2b
    // Rule: B2B is ALWAYS owner: pandora. B2C is usually owner: client unless it's Pandoras own B2C
    const scope = (bodyScope === 'b2b' || isB2BOrigin) ? 'b2b' : 'b2c';
    const ownerContext = (scope === 'b2b' || targetProjectId === 1) ? 'pandora' : 'client';
    const leadType = scope === 'b2b' ? 'founder_prospect' : 'user_prospect';

    // 1.5 Security Check: Allowed Domains (ONLY FOR PUBLIC KEYS)
    const projectContext = await db.query.projects.findFirst({
      where: eq(projects.id, targetProjectId),
      columns: { 
        allowedDomains: true, 
        slug: true, 
        title: true, 
        businessCategory: true,
        discordWebhookUrl: true 
      }
    });

    if (!projectContext) {
      return NextResponse.json({ error: 'Invalid project context' }, { status: 404 });
    }

    // ... (Keep existing domain verification logic)
    const isSecretKey = keyType === 'secret';
    if (!isSecretKey && projectContext?.allowedDomains && Array.isArray(projectContext.allowedDomains) && projectContext.allowedDomains.length > 0) {
      const isAllowed = projectContext.allowedDomains.some(domain => requestOrigin?.toLowerCase().includes(domain.toLowerCase()));
      if (!isAllowed) {
        return NextResponse.json({ error: 'Unauthorized domain' }, { status: 403 });
      }
    }

    if (consent !== true) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
    }

    // --- TAG PREFIXING SYSTEM ---
    const prefix = scope === 'b2b' ? 'B2B_' : 'B2C_';
    let processedMetadata = metadata || {};
    if (processedMetadata.tags && Array.isArray(processedMetadata.tags)) {
      processedMetadata.tags = processedMetadata.tags.map((t: string) => 
        t.startsWith('B2B_') || t.startsWith('B2C_') ? t : `${prefix}${t.toUpperCase()}`
      );
    } else if (!processedMetadata.tags) {
       // Add default tag based on intent
       processedMetadata.tags = [`${prefix}${intent?.toUpperCase() || 'EXPLORE'}`];
    }

    const existingUser = email ? await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase())
    }) : null;

    // --- IDENTITY LAYER RESOLUTION (Foundational SaaS) ---
    const identityId = await IdentityResolver.resolveIdentity({
      fingerprint,
      email,
      walletAddress,
      // If we have a user from the session or auth, pass it here
      userId: existingUser?.id || null
    });

    const identityHash = IdentityService.getIdentityHash(email, walletAddress, fingerprint);

    // 4. Ingest Lead (Upsert)
    const baseLeadData = {
      userId: existingUser?.id || null,
      projectId: targetProjectId,
      ownerContext: ownerContext as any,
      scope: scope as any,
      identityId: identityId, // NEW: Unified Identity ID
      leadType,
      email: email?.toLowerCase() || null,
      name: name || null,
      phoneNumber: phoneNumber || null,
      walletAddress: walletAddress || existingUser?.walletAddress || null,
      fingerprint: fingerprint || null,
      identityHash: identityHash,
      origin: origin || null,
      intent: (['invest', 'explore', 'whitelist', 'earn', 'other'].includes(intent) ? intent : 'explore') as any,
      consent: true,
      metadata: processedMetadata,
      status: 'active' as any,
      score: 50,
      updatedAt: new Date(),
    };

    const [result] = await db.insert(marketingLeads)
      .values({ ...baseLeadData, createdAt: new Date() })
      .onConflictDoUpdate({
        target: [marketingLeads.projectId, marketingLeads.identityHash],
        set: { ...baseLeadData, updatedAt: new Date() }
      })
      .returning();

    // 4.5. Log Attribution Touch (Foundational SaaS)
    if (result) {
      const campaignId = body.campaignId || processedMetadata.campaignId || null;
      await AttributionManager.logTouch(
        result.id,
        campaignId,
        'lead_captured',
        { 
          origin: result.origin, 
          method: resolutionMethod,
          identityId: identityId
        }
      );
    }

    // 5. CRM Synchronization (Isolated for B2B)
    if (scope === 'b2b' && result) {
      const { syncLeadAsClient } = await import('@/actions/leads');
      await syncLeadAsClient({
        name: result.name || undefined,
        email: result.email || undefined,
        source: origin || 'direct',
        metadata: processedMetadata
      });
    }

    // 6. Growth Engine Trigger
    const GROWTH_ENGINE_V2 = true;
    if (GROWTH_ENGINE_V2 && result) {
      const engineResult = resolveGrowthAction('LEAD_CAPTURED', {
        id: result.id,
        email: result.email,
        name: result.name,
        phoneNumber: result.phoneNumber,
        intent: result.intent as string,
        projectId: result.projectId,
        scope: result.scope as 'b2b' | 'b2c',
        metadata: result.metadata
      });
      
      if (engineResult) {
        await executeGrowthActions(engineResult.actions, {
          lead: result as any,
          project: {
            id: targetProjectId,
            slug: projectContext.slug,
            name: projectContext?.title || 'Protocolo Ecosystem',
            discordWebhookUrl: projectContext?.discordWebhookUrl
          } as any
        });
      }
    }

    if (!result) {
        return NextResponse.json({ error: 'Failed to process lead' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Lead registered as ${scope.toUpperCase()}`,
      data: { id: result.id, scope: result.scope, ownerContext: result.ownerContext }
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

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
import { eq, and, or, sql, ilike } from 'drizzle-orm';
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

    console.error(`[Growth OS] ➡️  New Lead Registration attempt from IP: ${ip}, API Key: ${apiKey?.substring(0, 10)}...`);

    // Use request origin/referer as fallback for origin if not provided in body
    const requestOrigin = req.headers.get('origin') || req.headers.get('referer');
    const xInternalService = req.headers.get('x-internal-service');

    const isInternalDashboard = 
      requestOrigin?.includes('pandoras.finance') || 
      requestOrigin?.includes('localhost') ||
      requestOrigin?.includes('saaspandoras') ||
      xInternalService === 'pandoras-v2';
    
    let client;
    if (!apiKey && isInternalDashboard) {
      console.error(`[Growth OS] Internal Service Bypass Detected. Origin: ${requestOrigin}, Service: ${xInternalService}`);
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
          where: (projects, { ilike }) => ilike(projects.slug, 'pandoras-protocol')
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

    // 2. Parse & Validate Body (Greedy Capture)
    const body = await req.json();
    
    // Support both flat (Narai) and structured (Pandoras) formats
    let email = body.email || body.userEmail;
    let name = body.name || body.userName || body.metadata?.name;
    let phoneNumber = body.phoneNumber || body.phone || body.whatsapp || body.metadata?.whatsapp || body.metadata?.phone || body.metadata?.phoneNumber;
    let walletAddress = body.walletAddress || body.wallet || body.metadata?.wallet;
    let fingerprint = body.fingerprint || body.fp;
    let origin = body.origin || requestOrigin;
    let intent = (body.intent || body.metadata?.intent || 'explore').toLowerCase();
    let consent = body.consent ?? true; // Default to true if not provided but request reaches here
    let bodyScope = body.scope;
    let projectId = body.projectId;

    // Collect everything else into metadata automatically
    const knownKeys = ['email', 'userEmail', 'name', 'userName', 'phoneNumber', 'phone', 'whatsapp', 'walletAddress', 'wallet', 'fingerprint', 'fp', 'origin', 'intent', 'consent', 'metadata', 'projectId', 'scope'];
    let metadata = { ...(body.metadata || {}) };
    
    Object.keys(body).forEach(key => {
      if (!knownKeys.includes(key)) {
        metadata[key] = body[key];
      }
    });

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
        where: (projects, { ilike }) => ilike(projects.slug, projectId),
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

    console.error(`[Growth OS] 🎯 Project Resolved: ID=${targetProjectId}, Method=${resolutionMethod}, Requested=${projectId}`);

    // --- DUAL ENGINE AUTO-ROUTING ---
    // Detect Scope & Owner Context based on Origin or Explicit Body
    const B2B_PATHWAYS = ['/founders', '/protocol', '/protocol-story', '/start', '/utility', '/help', '/growth-os'];
    const isB2BOrigin = origin && B2B_PATHWAYS.some(path => origin.includes(path));
    
    // Rule: If it's B2B origin OR explicitly b2b in body -> scope: b2b
    // Rule: B2B is ALWAYS owner: pandora. B2C is usually owner: client unless it's Pandoras own B2C
    const scope = (bodyScope === 'b2b' || isB2BOrigin) ? 'b2b' : 'b2c';

    // 1.5 Security Check: Allowed Domains (ONLY FOR PUBLIC KEYS)
    const projectContext = await db.query.projects.findFirst({
      where: eq(projects.id, targetProjectId),
      columns: { 
        allowedDomains: true, 
        slug: true, 
        title: true, 
        businessCategory: true,
        discordWebhookUrl: true,
        description: true,
        tagline: true
      }
    });

    if (!projectContext) {
      return NextResponse.json({ error: 'Invalid project context' }, { status: 404 });
    }

    // --- REFINED ECOSYSTEM SEPARATION (Phase 2.1) ---
    // Core Pandora projects: pandoras_access
    // Everything else: 'client' protocol
    const isCorePandora = projectContext.slug === 'pandoras_access';
    const ownerContext = isCorePandora ? 'pandora' : 'client';
    const leadType = scope === 'b2b' ? 'founder_prospect' : 'user_prospect';

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

    if (!identityHash) {
      return NextResponse.json({ error: 'Failed to resolve identity' }, { status: 400 });
    }

    // 4. Ingest Lead (Smart Upsert with Metadata Merge)
    const existingLead = await db.query.marketingLeads.findFirst({
      where: and(
        eq(marketingLeads.projectId, targetProjectId),
        eq(marketingLeads.identityHash, (identityHash as string))
      ),
      columns: { id: true, metadata: true }
    });

    const alreadyRegistered = !!existingLead;
    let finalMetadata = processedMetadata;

    if (existingLead) {
      // Merge: Keep old growth data, update other fields
      const oldMeta = (existingLead.metadata as any) || {};
      finalMetadata = {
        ...oldMeta,
        ...processedMetadata,
        growth: oldMeta.growth || processedMetadata.growth // Prioritize old growth history
      };
    }

    const baseLeadData = {
      userId: existingUser?.id || null,
      projectId: targetProjectId,
      ownerContext: ownerContext as any,
      scope: scope as any,
      identityId: identityId,
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
      metadata: finalMetadata,
      status: 'active' as any,
      score: existingLead ? undefined : 50, // Don't reset score on re-reg
      updatedAt: new Date(),
    };

    const [result] = await (async () => {
      try {
        if (existingLead) {
          return await db.update(marketingLeads)
            .set(baseLeadData)
            .where(eq(marketingLeads.id, existingLead.id as any))
            .returning();
        } else {
          return await db.insert(marketingLeads)
            .values({ ...baseLeadData, createdAt: new Date() })
            .returning();
        }
      } catch (dbErr: any) {
        console.error('🚨 [Postgres Fatal] Error during Lead Ingestion:', dbErr);
        throw dbErr;
      }
    })();

    // 4.5. Log Attribution Touch (Foundational SaaS)
    if (result) {
      const campaignId = body.campaignId || processedMetadata.campaignId || null;
      await AttributionManager.logTouch(
        result.id.toString(),
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
      // Re-resolve phone from body as last-resort (in case DB upsert didn't preserve it)
      const resolvedPhone = result.phoneNumber || phoneNumber || 
        body.metadata?.whatsapp || body.metadata?.phone || body.metadata?.phoneNumber || null;

      const engineResult = resolveGrowthAction('LEAD_CAPTURED', {
        id: result.id,
        email: result.email,
        name: result.name,
        phoneNumber: resolvedPhone,
        intent: result.intent as string,
        projectId: result.projectId,
        scope: result.scope as 'b2b' | 'b2c',
        metadata: result.metadata
      });
      
      console.error(`[Growth OS] 🧠 Engine Result: Actions=${JSON.stringify(engineResult?.actions || [])}, Rule=${engineResult?.ruleId}`);
      
      // A lead is "new" if it has no prior growth execution history
      const existingGrowthMeta = (result.metadata as any)?.growth;
      const isNewLead = !existingGrowthMeta?.executedActions || Object.keys(existingGrowthMeta.executedActions).length === 0;
      
      // Force VIP bypass for high-intent invest leads regardless of prior registration
      // (user may have re-submitted with a higher intent — always re-trigger VIP path)
      const isVipIntent = result.intent === 'invest' || 
        (result.metadata as any)?.tags?.some((t: string) => t?.toUpperCase?.().includes('FULL_UNIT'));
      const forceBypass = body.forceBypass === true || metadata?.forceBypass === true || isNewLead || isVipIntent;
      
      if (isVipIntent && existingGrowthMeta?.executedActions?.['SEND_VIP_CONCIERGE_WELCOME']) {
        // Reset VIP concierge flag so it can re-fire with correct project context
        delete existingGrowthMeta.executedActions['SEND_VIP_CONCIERGE_WELCOME'];
        console.error(`[Growth OS] 🎖️ VIP intent detected — resetting VIP concierge for re-fire.`);
      }

      if (isNewLead) {
        console.error(`[Growth OS] 🆕 New lead detected — bypassing cooldown to ensure welcome email & notifications fire.`);
      }

      if (engineResult && engineResult.actions.length > 0) {
        console.error(`[Growth OS] 🚀 Triggering ${engineResult.actions.length} actions for ${result.email}... (ForceBypass: ${forceBypass})`);
        console.error(`[Growth OS] 📩 Executing actions: ${JSON.stringify(engineResult.actions)} for Project: ${projectContext?.slug} (category: ${projectContext?.businessCategory})`);
        await executeGrowthActions(engineResult.actions, {
          lead: { ...result, phoneNumber: resolvedPhone } as any,
          project: {
            id: targetProjectId,
            slug: projectContext.slug,
            name: projectContext?.title || 'Protocolo Ecosystem',
            businessCategory: projectContext?.businessCategory || 'other',
            differentiator: projectContext?.tagline || projectContext?.description || null,
            discordWebhookUrl: projectContext?.discordWebhookUrl || null
          } as any
        }, { 
          ruleId: engineResult.ruleId || 'LEAD_CAPTURED',
          bypassCooldown: forceBypass 
        });
      }

      // --- MARKET ATTACK TRIGGER ---
      if (isVipIntent) {
        console.error(`[Growth OS] 🛡️ High-Intent VIP detected (${result.email}). Launching Market Attack sequence...`);
        const { MarketingEngine } = await import('@/lib/marketing/engine');
        await MarketingEngine.startCampaign("Market Attack", { leadId: result.id });
      }
    }

    if (!result) {
        return NextResponse.json({ error: 'Failed to process lead' }, { status: 500 });
    }

    // 🔔 Bull's Lab Webhook Emission (fire-and-forget, never blocks main flow)
    try {
      const { WebhookService } = await import('@/lib/integrations/webhook-service');
      await WebhookService.queueEvent('system', alreadyRegistered ? 'lead.returning' : 'lead.new', {
        event: alreadyRegistered ? 'lead.returning' : 'lead.new',
        timestamp: new Date().toISOString(),
        data: {
          lead_id: result.id,
          email: result.email,
          name: result.name,
          wallet_address: result.walletAddress,
          phone_number: result.phoneNumber,
          project_id: result.projectId,
          project_slug: projectContext?.slug,
          status: result.status,
          quality: result.quality,
          intent: result.intent,
          score: result.score,
          source: result.origin,
          already_registered: alreadyRegistered,
        }
      });
    } catch (_) { /* Non-critical — never block lead registration */ }

    return NextResponse.json({ 
      success: true, 
      id: result.id, 
      identityId,
      alreadyRegistered,
      message: alreadyRegistered ? 'Already on the list' : 'Lead captured successfully'
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

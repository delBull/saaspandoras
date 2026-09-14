import { NextResponse } from 'next/server';
import { db } from '@/db';
import { publicIntegrations, marketingLeads, projects } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import crypto from 'crypto';
import { IdentityResolver } from '@/lib/marketing/identity-resolver';
import { IdentityService } from '@/lib/marketing/identity-service';

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

    // 1. Validate Public API Key
    const hash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const integrationRecords = await db.select()
      .from(publicIntegrations)
      .where(eq(publicIntegrations.apiKeyHash, hash))
      .limit(1);

    const integration = integrationRecords[0];

    if (!integration || !integration.isActive) {
      return NextResponse.json({ error: 'Invalid or revoked Public Integration Key' }, { status: 403 });
    }

    // 2. Enforce capabilities whitelist
    const capabilities = integration.allowedCapabilities as string[];
    if (!capabilities.includes('leads:capture:public')) {
      return NextResponse.json({ error: 'Integration key not authorized for lead capture' }, { status: 403 });
    }

    // 3. Rate Limiting Check
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const policy = integration.rateLimitPolicy as { requestsPerMinute: number };
    if (!checkRateLimit(ip, policy)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    // 4. Parse & Validate Payload
    const body = await req.json();
    const { 
      email, 
      phoneNumber, 
      name, 
      fingerprint, 
      walletAddress, 
      consent = true,
      metadata = {} 
    } = body;

    if (!consent) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
    }

    if (!email && !walletAddress && !phoneNumber) {
      return NextResponse.json({ error: 'Must provide email, phone, or wallet' }, { status: 400 });
    }

    // 5. Resolve Project via canonicalOrgId (server-side, zero trust on client)
    const project = await db.query.projects.findFirst({
      where: eq(projects.slug, integration.canonicalOrgId),
      columns: { id: true, slug: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Misconfigured Integration: Tenant not found' }, { status: 500 });
    }
    const targetProjectId = project.id;

    // 6. Identity Resolution
    const identityId = await IdentityResolver.resolveIdentity({
      fingerprint: fingerprint || ip, // fallback to ip if no fp
      email,
      walletAddress
    });
    
    const identityHash = IdentityService.getIdentityHash(email, walletAddress, fingerprint || ip);

    // 7. Upsert Lead (Secure, Isolated Write)
    const orConditions = [];
    if (email) orConditions.push(eq(marketingLeads.email, email.toLowerCase()));
    if (walletAddress) orConditions.push(eq(marketingLeads.walletAddress, walletAddress));
    if (fingerprint) orConditions.push(eq(marketingLeads.fingerprint, fingerprint));
    if (identityHash) {
      orConditions.push(eq(marketingLeads.identityHash, identityHash));
    }

    const existingLead = await db.query.marketingLeads.findFirst({
      where: and(
        eq(marketingLeads.projectId, targetProjectId),
        or(...orConditions)
      ),
      columns: { id: true, metadata: true }
    });

    const origin = req.headers.get('origin') || req.headers.get('referer') || integration.landingPublicId;
    let finalMetadata = { ...metadata };
    
    if (existingLead) {
      finalMetadata = { ...(existingLead.metadata as any), ...metadata };
    }

    const leadData = {
      projectId: targetProjectId,
      identityId,
      email: email?.toLowerCase() || null,
      phoneNumber: phoneNumber || null,
      name: name || null,
      walletAddress: walletAddress || null,
      fingerprint: fingerprint || ip,
      identityHash,
      origin,
      intent: 'explore' as const,
      consent: true,
      metadata: finalMetadata,
      status: 'active' as const,
      crmStage: 'LEAD',
      updatedAt: new Date()
    };

    let result;
    if (existingLead) {
      [result] = await db.update(marketingLeads)
        .set(leadData)
        .where(eq(marketingLeads.id, existingLead.id as any))
        .returning();
    } else {
      [result] = await db.insert(marketingLeads)
        .values({ ...leadData, createdAt: new Date() })
        .returning();
    }

    if (!result) {
      return NextResponse.json({ error: 'Failed to insert lead' }, { status: 500 });
    }

    // Returning minimal info
    return NextResponse.json({
      success: true,
      leadId: result.id,
      identityId,
      message: existingLead ? 'Lead updated' : 'Lead captured successfully'
    });

  } catch (error: any) {
    console.error('[PublicLeadCapture] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

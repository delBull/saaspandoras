import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { marketingLeads, goldenLinks, projects } from '@saasfly/db/schema';
import { eq, and } from '@saasfly/db-core';
import crypto from 'crypto';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { resolveNexusTmaSession } from '@/lib/nexus/nexus-tma-auth';

// ── TYPES & VALIDATION ────────────────────────────────────────────────────────

interface InjectLeadPayload {
  name: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  idempotencyKey: string;
}

function validatePayload(body: any): InjectLeadPayload | null {
  if (!body || typeof body !== 'object') return null;
  if (!body.name || typeof body.name !== 'string') return null;
  if (!body.email && !body.phoneNumber) return null; // Must have at least one contact method
  if (!body.idempotencyKey || typeof body.idempotencyKey !== 'string') return null;
  
  return {
    name: body.name.substring(0, 100),
    email: body.email ? body.email.toLowerCase().substring(0, 100) : undefined,
    phoneNumber: body.phoneNumber ? body.phoneNumber.replace(/[^0-9+]/g, '').substring(0, 20) : undefined,
    companyName: body.companyName ? body.companyName.substring(0, 100) : undefined,
    idempotencyKey: body.idempotencyKey.substring(0, 64)
  };
}

// ── AUTHENTICATION ────────────────────────────────────────────────────────────

async function authenticateRequest(req: NextRequest): Promise<{ 
  canonicalOrgId: string, 
  collaboratorId: number | null,
  error?: string,
  status?: number
}> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { canonicalOrgId: '', collaboratorId: null, error: 'Missing Authorization header', status: 401 };
  }

  // 1. Integration Key (Service)
  if (authHeader.startsWith('Bearer pk_') || authHeader.startsWith('Bearer sk_')) {
    const rawKey = authHeader.replace('Bearer ', '').trim();
    const client = await IntegrationKeyService.validateKey(rawKey);
    if (!client) {
      return { canonicalOrgId: '', collaboratorId: null, error: 'Invalid or revoked Integration Key', status: 403 };
    }
    
    // Resolve project to canonical org
    const project = await db.query.projects.findFirst({ 
      where: eq(projects.id, client.projectId!),
      columns: { slug: true }
    });
    
    if (project?.slug !== 'pandoras') {
      return { canonicalOrgId: '', collaboratorId: null, error: 'Not authorized for this tenant', status: 403 };
    }
    
    // Capability check
    const perms = (client.permissions as string[]) || [];
    if (!perms.includes('growth.manage') && !perms.includes('marketing.manage')) {
      return { canonicalOrgId: '', collaboratorId: null, error: 'Missing growth.manage capability', status: 403 };
    }
    
    return { canonicalOrgId: 'pandoras', collaboratorId: null };
  }
  
  // 2. TMA Session (User)
  if (authHeader.startsWith('Bearer tma ')) {
    const initData = authHeader.replace('Bearer tma ', '').trim();
    try {
      const session = await resolveNexusTmaSession(initData);
      // F2 uses null for organizationId, but implicit org for Nexus is 'pandoras'
      
      if (!session.capabilities.includes('growth.manage') && !session.capabilities.includes('marketing.manage')) {
        return { canonicalOrgId: '', collaboratorId: null, error: 'Missing growth.manage capability', status: 403 };
      }
      return { canonicalOrgId: 'pandoras', collaboratorId: session.collaboratorId };
    } catch (e: any) {
      return { canonicalOrgId: '', collaboratorId: null, error: e.message, status: 401 };
    }
  }

  return { canonicalOrgId: '', collaboratorId: null, error: 'Unsupported Authorization scheme', status: 401 };
}

// ── HANDLER ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // 1. Auth & Capability Check
    const auth = await authenticateRequest(req);
    if (auth.error) {
      console.warn(`[POST /api/v1/internal/nexus/leads/inject] Auth failed: ${auth.error}`);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    // 2. Parse Payload
    const body = await req.json().catch(() => null);
    const payload = validatePayload(body);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid payload format or missing required fields' }, { status: 400 });
    }

    // 3. Deduplication Check (Idempotency Key & Existing Data)
    // First check by idempotency key (metadata -> idempotencyKey)
    // Drizzle doesn't have native JSONB querying easily without sql``, so we check phone/email first
    let existingLead = null;
    
    if (payload.phoneNumber) {
      existingLead = await db.query.marketingLeads.findFirst({
        where: eq(marketingLeads.phoneNumber, payload.phoneNumber)
      });
    }
    if (!existingLead && payload.email) {
      existingLead = await db.query.marketingLeads.findFirst({
        where: eq(marketingLeads.email, payload.email)
      });
    }

    if (existingLead) {
      // Return 409 Conflict without leaking full PII
      return NextResponse.json({ 
        error: 'Lead already exists',
        leadId: existingLead.id,
        status: existingLead.crmStage,
        message: 'A lead with this email or phone is already registered.'
      }, { status: 409 });
    }

    // 4. Create Lead
    const newLeadId = crypto.randomUUID();
    const referrerId = auth.collaboratorId ? String(auth.collaboratorId) : 'system_service';
    
    const [insertedLead] = await db.insert(marketingLeads).values({
      id: newLeadId,
      name: payload.name,
      email: payload.email || '',
      phoneNumber: payload.phoneNumber || '',
      projectId: 1, // 'pandoras' internal CRM project ID (assuming 1 for this context)
      source: 'nexus_kyc_internal',
      crmStage: 'LEAD',
      referrer: referrerId,
      metadata: {
        companyName: payload.companyName,
        idempotencyKey: payload.idempotencyKey,
        canonicalOrgId: auth.canonicalOrgId,
        injectedAt: new Date().toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning({ id: marketingLeads.id });

    if (!insertedLead) {
      return NextResponse.json({ error: 'Failed to insert lead' }, { status: 500 });
    }

    // 5. Generate Secure Invitation (Golden Link)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 72); // 72 hours TTL

    const [goldenLink] = await db.insert(goldenLinks).values({
      campaignId: 1,
      slug: tokenHash, // Persist only the hash
      isActive: true, // We use boolean isActive for atomic consumption
      expiresAt,
      metadata: {
        leadId: insertedLead.id,
        referrerId: auth.collaboratorId,
        purpose: 'nexus_lead_invitation'
      }
    }).returning({ id: goldenLinks.id });

    if (!goldenLink) {
      // Revert lead? No, just fail to generate link (best-effort link generation)
      return NextResponse.json({ error: 'Lead created but failed to generate invitation link' }, { status: 500 });
    }

    // 6. Return response (Only time raw token is returned)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    const inviteUrl = `${baseUrl}/nexus/invite/${token}`;

    return NextResponse.json({
      success: true,
      leadId: insertedLead.id,
      inviteUrl,
      inviteCode: token, // Raw code for WhatsApp injection
      expiresAt
    });

  } catch (error: any) {
    console.error('[POST /api/v1/internal/nexus/leads/inject] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

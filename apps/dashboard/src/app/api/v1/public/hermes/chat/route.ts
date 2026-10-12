import { NextResponse } from 'next/server';
import { db } from '@saasfly/db';
import { publicIntegrations } from '@saasfly/db/schema';
import { eq } from "@saasfly/db-core";
import crypto from 'crypto';
import { HermesRuntime, getDefaultRuntime } from '@saasfly/hermes-core';
import { OrganizationSDK } from '@saasfly/shared';
import { ControlPlaneContext } from '@saasfly/hermes-core';
import { checkRateLimit, clientIpFromHeaders } from "@saasfly/hermes-core";


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
    const ip = clientIpFromHeaders(req.headers);
    const policy = integration.rateLimitPolicy as { requestsPerMinute: number };
    if (!checkRateLimit(ip, 20, 60_000)) {
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
    const { ActorIdentityBindingService } = await import('@saasfly/hermes-core');
    const boundActorSession = ActorIdentityBindingService.createBoundSession(
      {
        actorId: sessionId,
        tenantId: orgContext.organizationId,
        authProvider: 'PORTAL_INTERNAL',
        proofSignature: `pub_sig_${Date.now()}_${sessionId}`,
        issuedAt: Date.now(),
        nonce: `pub_nonce_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`,
      },
      'PUBLIC',
      1800
    );

    const restrictedScope: any = {
      organizationId: orgContext.organizationId,
      actorId: sessionId,
      role: 'VIEWER',
      permissions: [], // Highly restricted
      identity: {
         name: 'Anonymous Public Visitor'
      },
      boundActorSession,
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

    // Resolve project and persist prospect to marketingLeads (Funnel Capture)
    let persistedLeadId: string | null = null;
    try {
      const { projects, marketingLeads } = await import('@saasfly/db/schema');
      let targetProjectId: number | null = null;
      
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(eq(projects.organizationId, integration.canonicalOrgId))
        .limit(1);

      if (project) {
        targetProjectId = project.id;
      } else {
        const cleanSlug = integration.canonicalOrgId.replace(/^org_/, '');
        const [projectBySlug] = await db
          .select({ id: projects.id })
          .from(projects)
          .where(eq(projects.slug, cleanSlug))
          .limit(1);
        if (projectBySlug) targetProjectId = projectBySlug.id;
      }

      if (targetProjectId) {
        const leadsInProject = await db
          .select()
          .from(marketingLeads)
          .where(eq(marketingLeads.projectId, targetProjectId))
          .limit(50);

        const existingLead = leadsInProject.find(
          (l) => l.fingerprint === sessionId || (body.email && l.email === body.email)
        );

        if (existingLead) {
          persistedLeadId = existingLead.id;
          await db
            .update(marketingLeads)
            .set({
              name: body.name || existingLead.name,
              email: body.email || existingLead.email,
              phoneNumber: body.phone || body.phoneNumber || existingLead.phoneNumber,
              lastEngagementAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(marketingLeads.id, existingLead.id));
        } else {
          const [insertedLead] = await db
            .insert(marketingLeads)
            .values({
              projectId: targetProjectId,
              scope: 'b2b',
              leadType: 'visitor_chat',
              fingerprint: sessionId,
              email: body.email || null,
              name: body.name || null,
              phoneNumber: body.phone || body.phoneNumber || null,
              source: 'public_hermes_chat',
              status: 'active',
              intent: 'explore',
              crmStage: 'LEAD',
              metadata: {
                sessionId,
                originIp: ip,
                firstMessage: message.slice(0, 300),
                ...(body.metadata || {}),
              },
              consent: !!body.consent,
            })
            .returning({ id: marketingLeads.id });

          if (insertedLead) {
            persistedLeadId = insertedLead.id;
          }
        }
      }
    } catch (leadPersistErr) {
      console.warn('[PublicHermesChat] Non-blocking lead persistence warning:', leadPersistErr);
    }

    return NextResponse.json({
      success: true,
      sessionId,
      leadId: persistedLeadId,
      reply: response.content
    });

  } catch (error: any) {
    console.error('[PublicHermesChat] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

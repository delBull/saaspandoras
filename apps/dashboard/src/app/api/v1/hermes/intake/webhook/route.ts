import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { marketingLeads } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import crypto from 'crypto';
import { PlatformAuditLedgerService } from '@/lib/admin/platform-audit-ledger.service';
import { HermesWhatsAppOrchestrator } from '@/lib/hermes/agents/HermesWhatsAppOrchestrator';

const IntakeSchema = z.object({
  apiKey: z.string().min(10, 'Invalid API Key length'),
  email: z.string().email().optional(),
  name: z.string().max(100).optional(),
  phone: z.string().max(25).optional(),
  company: z.string().max(100).optional(),
  source: z.string().max(50).optional(),
  medium: z.string().max(50).optional(),
  campaignId: z.string().max(50).optional(),
  referrer: z.string().max(255).optional(),
  notes: z.string().max(1000).optional(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone must be provided",
});

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    let token = '';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    const body = await req.json().catch(() => ({}));
    const rawApiKey = token || body.apiKey;

    if (!rawApiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const data = IntakeSchema.parse({
      ...body,
      apiKey: rawApiKey,
    });

    // 1. Validate API Key using IntegrationKeyService
    const client = await IntegrationKeyService.validateKey(data.apiKey);
    if (!client) {
      return NextResponse.json({ error: 'Unauthorized. Invalid or revoked API Key.' }, { status: 401 });
    }
    
    const targetProjectId = client.projectId;
    if (!targetProjectId) {
      return NextResponse.json({ error: 'Integration Key has no assigned Project.' }, { status: 400 });
    }

    // 2. Determine scope based on project (Pandora's HQ vs Tenant)
    const isB2b = targetProjectId === 1; // 1 is Pandora's HQ

    const metadata: any = {};
    if (data.company) metadata.companyName = data.company;
    if (data.notes) metadata.notes = data.notes;
    if (data.medium) metadata.medium = data.medium;
    if (data.campaignId) metadata.campaignId = data.campaignId;
    if (data.referrer) metadata.referrer = data.referrer;

    // 3. Compute Deterministic Identity Hash for Deduplication
    const normalizedEmail = data.email ? data.email.trim().toLowerCase() : '';
    const normalizedPhone = data.phone ? data.phone.replace(/\D/g, '') : '';
    const identityHash = crypto
      .createHash('sha256')
      .update(`${targetProjectId}:${normalizedEmail}:${normalizedPhone}`)
      .digest('hex');

    // 4. Check for Existing Lead (Deduplication)
    const existingLead = await db.query.marketingLeads.findFirst({
      where: and(
        eq(marketingLeads.projectId, targetProjectId),
        eq(marketingLeads.identityHash, identityHash)
      )
    });

    if (existingLead) {
      // Deduplicate & Enrich
      const mergedMetadata = { ...((existingLead.metadata as any) || {}), ...metadata };
      await db.update(marketingLeads)
        .set({
          name: data.name || existingLead.name,
          metadata: mergedMetadata,
          updatedAt: new Date(),
        })
        .where(eq(marketingLeads.id, existingLead.id));

      await PlatformAuditLedgerService.recordEntry({
        actorId: `client_${client.id}`,
        actorWallet: 'N/A',
        actorRole: 'INTEGRATION_CLIENT',
        actorType: 'SYSTEM',
        action: 'LEAD_DEDUPLICATED',
        targetResource: 'marketing_leads',
        resourceId: String(existingLead.id),
        capability: 'hq.crm.enrich',
        governance: { isDiscord2faVerified: false, auditReason: 'Webhook Deduplication' },
        stateTransition: { previousState: { leadId: existingLead.id }, newState: { enriched: true, source: data.source } },
        result: 'SUCCESS'
      });

      if (data.phone) {
        HermesWhatsAppOrchestrator.handleNewLeadIntake(existingLead.id).catch(err => {
          console.error('⚠️ [Hermes Orchestrator Async Error]', err);
        });
      }

      return NextResponse.json({
        success: true,
        leadId: existingLead.id,
        deduplicated: true,
        message: 'Lead updated and deduplicated successfully.'
      });
    }

    // 5. Ingest New Lead
    const [newLead] = await db.insert(marketingLeads).values({
      projectId: targetProjectId,
      ownerContext: isB2b ? 'pandora' : 'client',
      scope: isB2b ? 'b2b' : 'b2c',
      email: data.email || null,
      name: data.name || null,
      phoneNumber: data.phone || null,
      identityHash,
      source: data.source || 'Universal Webhook',
      status: 'NEW',
      crmStage: 'LEAD',
      metadata,
    }).returning();

    if (newLead) {
      await PlatformAuditLedgerService.recordEntry({
        actorId: `client_${client.id}`,
        actorWallet: 'N/A',
        actorRole: 'INTEGRATION_CLIENT',
        actorType: 'SYSTEM',
        action: 'LEAD_CAPTURED',
        targetResource: 'marketing_leads',
        resourceId: String(newLead.id),
        capability: 'platform.integration.webhook.intake',
        governance: { isDiscord2faVerified: false, auditReason: 'Webhook Intake' },
        stateTransition: { previousState: null, newState: { leadId: newLead.id, source: data.source } },
        result: 'SUCCESS'
      });

      // 6. Wake up Hermes WhatsApp Orchestrator if phone is provided
      if (data.phone) {
        HermesWhatsAppOrchestrator.handleNewLeadIntake(newLead.id).catch(err => {
          console.error('⚠️ [Hermes Orchestrator Async Error]', err);
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      leadId: newLead ? newLead.id : null,
      deduplicated: false,
      message: 'Lead captured successfully.'
    });

  } catch (err: any) {
    console.error('⚠️ [Hermes Intake Error]', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation Error', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

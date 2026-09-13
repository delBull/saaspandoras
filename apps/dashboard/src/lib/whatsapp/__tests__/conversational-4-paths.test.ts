// @ts-ignore
import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { WhatsAppDispatcher } from '../dispatcher';
import { getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';

describe('🏛️ Suite D: Conversational 4-Path Routing & Control Plane Invariant', () => {
  const masterPhone = '685462974640240';
  let originalRespond: any;
  const capturedContexts: Record<string, any> = {};

  beforeEach(async () => {
    process.env.WHATSAPP_PHONE_NUMBER_ID = masterPhone;
    process.env.META_PHONE_NUMBER_ID = masterPhone;
    WhatsAppDispatcher.resetDeduplicationForTesting();

    // Ensure Oscar exists in nexusCollaborators for this test environment
    try {
      const { db } = await import('@/db');
      const { nexusCollaborators } = await import('@/db/schema');
      await db.insert(nexusCollaborators).values({
        name: 'Oscar',
        email: 'oscar@pandoras.finance',
        token: 'nexus_tok_oscar_manager_test',
        role: 'MANAGER',
        whatsappPhone: '5213221051871',
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      }).onConflictDoNothing();
    } catch {
      // Non-blocking in mock environments
    }

    const runtime = getDefaultRuntime();
    originalRespond = runtime.respond.bind(runtime);

    // Spy / Intercept runtime.respond to capture ControlPlaneContext passed to the SINGLE brain
    runtime.respond = (async (input: any) => {
      const actorId = input.controlPlaneContext?.actorId || 'UNKNOWN';
      const role = input.controlPlaneContext?.role || 'UNKNOWN';
      capturedContexts[`${actorId}_${role}`] = {
        organizationId: input.organizationId,
        conversationId: input.conversationId,
        actorId: input.controlPlaneContext?.actorId,
        role: input.controlPlaneContext?.role,
        permissions: input.controlPlaneContext?.permissions,
        isBoss: input.controlPlaneContext?.identity?.isBoss,
        title: input.controlPlaneContext?.identity?.title,
        executivePrivilege: input.controlPlaneContext?.identity?.executivePrivilege,
        interlocutorRole: input.controlPlaneContext?.interlocutor?.role,
        interlocutorName: input.controlPlaneContext?.interlocutor?.name,
        isCollaborator: input.controlPlaneContext?.interlocutor?.isCollaborator,
        tenantContext: input.controlPlaneContext?.tenantContext?.tenantSlug,
      };

      return {
        responseId: `resp_audit_${Date.now()}`,
        organizationId: input.organizationId,
        conversationId: input.conversationId,
        content: `Audit ACK for ${input.controlPlaneContext?.identity?.name || 'User'} (${input.controlPlaneContext?.role})`,
        suggestedActions: [],
        providerMeta: {},
        trace: { steps: [] },
      } as any;
    }) as any;
  });

  afterEach(() => {
    const runtime = getDefaultRuntime();
    runtime.respond = originalRespond;
  });

  it('PATH-01: Founder (Marco) routes to HermesRuntime with OWNER role & executive privileges', async () => {
    const founderPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '523221374392',
                  phone_number_id: masterPhone,
                },
                contacts: [{ profile: { name: 'Marco Founder' }, wa_id: '5213222741987' }],
                messages: [
                  {
                    from: '5213222741987',
                    id: `wamid.audit_founder_${Date.now()}`,
                    type: 'text',
                    text: { body: 'Reporte de balance patrimonial' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await WhatsAppDispatcher.dispatch(founderPayload as any);
    expect(res.handled).toBe(true);
    expect(res.target).toBe('boss_executive_runtime');

    const ctx = capturedContexts['marco_founder_OWNER'];
    expect(ctx).toBeDefined();
    expect(ctx.role).toBe('OWNER');
    expect(ctx.isBoss).toBe(true);
    expect(ctx.executivePrivilege).toBe(true);
    expect(ctx.permissions).toContain('governance.admin');
    expect(ctx.organizationId).toBe('pandoras');
  });

  it('PATH-02: Collaborator (Oscar - Manager) routes to HermesRuntime with MANAGER role & collaborator context', async () => {
    const collabPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '523221374392',
                  phone_number_id: masterPhone,
                },
                contacts: [{ profile: { name: 'Oscar' }, wa_id: '5213221051871' }],
                messages: [
                  {
                    from: '5213221051871',
                    id: `wamid.audit_collab_${Date.now()}`,
                    type: 'text',
                    text: { body: 'Sabes quién soy?' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await WhatsAppDispatcher.dispatch(collabPayload as any);
    expect(res.handled).toBe(true);
    expect(res.target).toBe('hermes_cognitive_runtime');

    // Find any collaborator context captured
    const collabEntryKey = Object.keys(capturedContexts).find(k => k.includes('MANAGER') || k.includes('nexus_collab'));
    expect(collabEntryKey).toBeDefined();

    const ctx = capturedContexts[collabEntryKey!];
    expect(ctx.role).toBe('MANAGER');
    expect(ctx.isBoss).toBe(false);
    expect(ctx.isCollaborator).toBe(true);
    expect(ctx.permissions).toContain('runtime.respond');
    expect(ctx.organizationId).toBe('pandoras');
  });

  it('PATH-03: Unknown Phone Number ID is rejected fail-closed without touching HermesRuntime', async () => {
    const spoofedPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '523229990011',
                  phone_number_id: 'unregistered_phone_id_999999',
                },
                messages: [
                  {
                    from: '5213228889900',
                    id: `wamid.audit_spoofed_${Date.now()}`,
                    type: 'text',
                    text: { body: 'Mensaje hacia canal inexistente' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await WhatsAppDispatcher.dispatch(spoofedPayload as any);
    expect(res.handled).toBe(false);
    expect(res.status).toBe('unrecognized_phone_number');
    expect(res.target).toBe('unrecognized');
  });

  it('PATH-04: Unknown Lead routes to HermesRuntime with NEW_LEAD role & zero administrative permissions', async () => {
    const leadPhone = '5215599009988';
    const leadPayload = {
      entry: [
        {
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '523221374392',
                  phone_number_id: masterPhone,
                },
                contacts: [{ profile: { name: 'Carlos Prospecto' }, wa_id: leadPhone }],
                messages: [
                  {
                    from: leadPhone,
                    id: `wamid.audit_lead_${Date.now()}`,
                    type: 'text',
                    text: { body: 'Información sobre tokenización' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const res = await WhatsAppDispatcher.dispatch(leadPayload as any);
    expect(res.handled).toBe(true);
    expect(res.target).toBe('hermes_cognitive_runtime');

    const ctx = Object.values(capturedContexts).find(c => c.role === 'NEW_LEAD' || c.role === 'LEAD');
    expect(ctx).toBeDefined();
    expect(ctx!.isBoss).toBe(false);
    expect(['NEW_LEAD', 'LEAD']).toContain(ctx!.role);
    expect(ctx!.permissions).toEqual([]); // Zero admin permissions
    expect(ctx!.executivePrivilege).toBe(false);
    expect(ctx!.organizationId).toBe('pandoras');
  });
});

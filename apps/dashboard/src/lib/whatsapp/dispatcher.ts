/**
 * 🔀 Hermes OS — Omnichannel WhatsApp Dispatcher
 * lib/whatsapp/dispatcher.ts
 *
 * Separates Pandora's Institutional Acquisition Flow from Tenant Cognitive Engine:
 * 1. Checks if incoming Meta phoneNumberId belongs to a provisioned Tenant.
 * 2. If TENANT: Dispatches to HermesCognitiveRuntime with Tenant's verified knowledge.
 * 3. If PANDORAS CORE: Dispatches to Pandora's Acquisition funnel (simpleRouter).
 */

import { db } from '@/db';
import { projects } from '@/db/schema';
import { routeSimpleMessage } from './core/simpleRouter';
import { sendWhatsAppMessage } from './utils/client';
import { DefaultOmnichannelGateway } from '@/lib/pandoras/core/domains/channels/omnichannel-gateway';
import { getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { ControlPlaneContext } from '@/lib/pandoras/core/domains/control-plane/application/context';
import { InteractionRouter } from '@/lib/hermes/interaction-router';
import { HumanHandoffProtocol } from '@/lib/hermes/human-handoff';

const omnichannelGateway = new DefaultOmnichannelGateway();

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  type: string;
  text?: { body: string };
  contactName?: string | null;
}

export interface WhatsAppWebhookPayload {
  entry?: Array<{
    id?: string;
    changes?: Array<{
      value?: {
        messaging_product?: string;
        metadata?: {
          display_phone_number?: string;
          phone_number_id?: string;
        };
        contacts?: Array<{
          profile?: { name?: string };
          wa_id?: string;
        }>;
        messages?: Array<WhatsAppIncomingMessage>;
      };
      field?: string;
    }>;
  }>;
}

import { formatWhatsAppText } from './utils/formatter';

export class WhatsAppDispatcher {
  /**
   * Resolves whether a phoneNumberId belongs to a provisioned Tenant
   */
  static async resolveTenantByPhoneNumberId(phoneNumberId?: string): Promise<{ id: number; slug: string; title: string; secrets?: any } | null> {
    if (!phoneNumberId) return null;

    const masterPhoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID || '').trim();

    // 1. If incoming message arrives on Pandora's Master WhatsApp Number, it represents Pandora's Core Hermes, NOT a specific tenant!
    if (masterPhoneId && String(phoneNumberId).trim() === masterPhoneId) {
      return {
        id: 0,
        slug: 'pandoras',
        title: "Pandora's Growth OS",
        secrets: {}
      };
    }

    // 2. Check dedicated tenant phone numbers (must be distinct from master number)
    try {
      const allProjects = await db.select({
        id: projects.id,
        slug: projects.slug,
        title: projects.title,
        tenantRuntimeConfig: projects.tenantRuntimeConfig,
        w2eConfig: projects.w2eConfig,
      }).from(projects);

      for (const p of allProjects) {
        const runtimeConfig = (p.tenantRuntimeConfig as any) || {};
        const w2e = (p.w2eConfig as any) || {};
        const tenantPhoneId = runtimeConfig.secrets?.whatsappPhoneId || w2e.whatsappPhoneId;
        
        if (
          tenantPhoneId && 
          String(tenantPhoneId).trim() === String(phoneNumberId).trim() && 
          String(tenantPhoneId).trim() !== masterPhoneId
        ) {
          return {
            id: p.id,
            slug: p.slug,
            title: p.title,
            secrets: runtimeConfig.secrets || {}
          };
        }
      }
    } catch (err) {
      console.warn('[WhatsAppDispatcher] Error resolving tenant by phone ID:', err);
    }

    return null;
  }

  /**
   * Main dispatch entrypoint
   */
  static async dispatch(payload: WhatsAppWebhookPayload): Promise<{ status: string; handled: boolean; target: 'tenant_cognitive' | 'pandoras_acquisition'; response?: string }> {
    const changes = payload.entry?.[0]?.changes?.[0]?.value;
    const messages = changes?.messages;

    if (!messages || messages.length === 0 || !messages[0]) {
      return { status: 'no_messages', handled: false, target: 'pandoras_acquisition' };
    }

    const message = messages[0];
    const phone = message.from;
    const messageId = message.id;
    const messageText = message.text?.body?.trim() || '';
    const contactName = changes?.contacts?.[0]?.profile?.name || message.contactName || null;
    const phoneNumberId = changes?.metadata?.phone_number_id;

    console.log(`📱 [WhatsAppDispatcher] Inbound message from ${phone} to PhoneID ${phoneNumberId}: "${messageText.substring(0, 40)}..."`);

    // ── 1. Check if message is for a specific Tenant ────────────────────────
    const tenant = await this.resolveTenantByPhoneNumberId(phoneNumberId);

    if (tenant) {
      console.log(`🏛️ [WhatsAppDispatcher] Routing message to TENANT COGNITIVE ENGINE: ${tenant.title} (${tenant.slug})`);

      // Human handoff detection
      const routeCheck = InteractionRouter.route(messageText);
      if (routeCheck.requiresHuman) {
        await HumanHandoffProtocol.triggerHandoff({
          projectId: tenant.id,
          chatId: phone,
          reason: routeCheck.reason,
          lastUserMessage: messageText,
        });

        const handoffResponse = "He notificado a nuestro equipo humano para que te atienda a la brevedad. Un asesor se comunicará contigo por este medio.";
        await this.sendReply({
          to: phone,
          text: handoffResponse,
          replyToId: messageId,
          secrets: tenant.secrets,
          defaultPhoneId: phoneNumberId,
        });

        return {
          status: 'success',
          handled: true,
          target: 'tenant_cognitive',
          response: handoffResponse,
        };
      }

      // Process via Governed Cognitive Runtime
      try {
        const cpCtx = new ControlPlaneContext(
          `wa_sess_${tenant.slug}_${phone}`,
          `wa_actor_${phone}`,
          'admin',
          ['view_overview', 'view_governance'],
          [{ organizationId: tenant.slug, role: 'admin' }]
        );

        const runtime = getDefaultRuntime();
        const runtimeResponse = await runtime.respond({
          organizationId: tenant.slug,
          conversationId: `conv_wa_${tenant.slug}_${phone}`,
          message: {
            id: messageId,
            role: 'USER',
            content: messageText,
            createdAt: new Date(),
          },
          controlPlaneContext: {
            actorId: `wa_actor_${phone}`,
            organizationId: tenant.slug,
            role: 'ADMIN',
            permissions: ['view_overview', 'view_governance'],
            sessionId: `wa_sess_${tenant.slug}_${phone}`,
          }
        });

        const cognitiveAnswer = runtimeResponse.content || "Gracias por tu mensaje. Estamos procesando tu consulta con base en nuestra información oficial.";
        
        await this.sendReply({
          to: phone,
          text: cognitiveAnswer,
          replyToId: messageId,
          secrets: tenant.secrets,
          defaultPhoneId: phoneNumberId,
        });

        return {
          status: 'success',
          handled: true,
          target: 'tenant_cognitive',
          response: cognitiveAnswer,
        };
      } catch (cognitiveErr: any) {
        console.error(`❌ [WhatsAppDispatcher] Cognitive runtime error for ${tenant.slug}:`, cognitiveErr);
        const fallbackText = "Gracias por tu mensaje. Un asesor de nuestro equipo te responderá en breve.";
        await this.sendReply({
          to: phone,
          text: fallbackText,
          replyToId: messageId,
          secrets: tenant.secrets,
          defaultPhoneId: phoneNumberId,
        });
        return {
          status: 'error',
          handled: true,
          target: 'tenant_cognitive',
          response: fallbackText,
        };
      }
    }

    // ── 2. Route to Pandora's Core Acquisition Flow ─────────────────────────
    console.log(`🌐 [WhatsAppDispatcher] Routing message to PANDORA'S ACQUISITION FUNNEL`);
    const routerPayload = {
      from: phone,
      id: messageId,
      type: message.type || 'text',
      text: message.text ? { body: message.text.body } : undefined,
      contactName,
      flowFromLanding: null,
    };

    const result = await routeSimpleMessage(routerPayload);

    if (result.response && result.handled) {
      await sendWhatsAppMessage(phone, result.response, messageId);
    }

    return {
      status: 'success',
      handled: true,
      target: 'pandoras_acquisition',
      response: result.response,
    };
  }

  /**
   * Helper to send WhatsApp reply using tenant's token or fallback
   */
  private static async sendReply(opts: { to: string; text: string; replyToId?: string; secrets?: any; defaultPhoneId?: string }) {
    const { to, text, replyToId, secrets, defaultPhoneId } = opts;
    const token = secrets?.whatsappToken || process.env.WHATSAPP_TOKEN || process.env.META_WHATSAPP_TOKEN;
    const phoneId = secrets?.whatsappPhoneId || defaultPhoneId || process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID;

    const formattedText = formatWhatsAppText(text);

    if (!token || !phoneId) {
      // Fallback to client util
      return sendWhatsAppMessage(to, formattedText, replyToId);
    }

    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: formattedText },
          ...(replyToId ? { context: { message_id: replyToId } } : {}),
        }),
      });

      if (!res.ok) {
        console.warn(`[WhatsAppDispatcher] Direct Meta dispatch failed (${res.status}), fallback to default client`);
        return sendWhatsAppMessage(to, formattedText, replyToId);
      }
    } catch (err) {
      console.error('[WhatsAppDispatcher] sendReply error:', err);
      return sendWhatsAppMessage(to, formattedText, replyToId);
    }
  }
}

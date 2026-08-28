/**
 * 🔀 Hermes OS — Omnichannel WhatsApp Dispatcher
 * lib/whatsapp/dispatcher.ts
 *
 * Separates Pandora's Institutional Acquisition Flow from Tenant Cognitive Engine:
 * 1. Deduplicates incoming Meta message IDs.
 * 2. Checks if conversation is currently paused by HumanHandoffProtocol.
 * 3. Enforces strict Tenant Isolation (no cross-tenant institutional fallbacks).
 * 4. Triggers automatic human handoff on low confidence (< 70) or explicit requests.
 */

import { db } from '@/db';
import { projects } from '@/db/schema';
import { routeSimpleMessage } from './core/simpleRouter';
import { sendWhatsAppMessage } from './utils/client';
import { getDefaultRuntime } from '@/lib/pandoras/core/domains/hermes/runtime/hermes-runtime';
import { InteractionRouter } from '@/lib/hermes/interaction-router';
import { HumanHandoffProtocol } from '@/lib/hermes/human-handoff';
import { formatWhatsAppText } from './utils/formatter';

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

// In-memory message deduplication cache (10 minutes TTL)
const processedMessageIds = new Map<string, number>();

function isMessageDuplicate(messageId: string): boolean {
  const now = Date.now();
  // Clean old entries
  for (const [id, timestamp] of processedMessageIds.entries()) {
    if (now - timestamp > 600000) { // 10 min
      processedMessageIds.delete(id);
    }
  }

  if (processedMessageIds.has(messageId)) {
    return true;
  }

  processedMessageIds.set(messageId, now);
  return false;
}

export class WhatsAppDispatcher {
  /**
   * Resolves whether a phoneNumberId belongs to a provisioned Tenant
   */
  static async resolveTenantByPhoneNumberId(phoneNumberId?: string): Promise<{ id: number; slug: string; title: string; secrets?: any } | null> {
    if (!phoneNumberId) return null;

    const masterPhoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID || '').trim();

    // 1. If incoming message arrives on Pandora's Master WhatsApp Number, return null to route to Pandora's Acquisition Funnel (simpleRouter)
    if (masterPhoneId && String(phoneNumberId).trim() === masterPhoneId) {
      return null;
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
        const envPhoneId = process.env[`META_PHONE_NUMBER_ID_${p.slug}`] || process.env[`META_PHONE_NUMBER_ID_${p.slug.toUpperCase()}`];
        const tenantPhoneId = runtimeConfig.secrets?.whatsappPhoneId || w2e.whatsappPhoneId || envPhoneId;
        
        if (
          tenantPhoneId && 
          String(tenantPhoneId).trim() === String(phoneNumberId).trim() && 
          String(tenantPhoneId).trim() !== masterPhoneId
        ) {
          return {
            id: p.id,
            slug: p.slug,
            title: p.title,
            secrets: {
              ...(runtimeConfig.secrets || {}),
              whatsappPhoneId: String(tenantPhoneId).trim(),
              whatsappToken: runtimeConfig.secrets?.whatsappToken || process.env[`META_WHATSAPP_TOKEN_${p.slug}`] || process.env[`META_WHATSAPP_TOKEN_${p.slug.toUpperCase()}`]
            }
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

    // ── 0. Cyber Security: Message Deduplication ────────────────────────────
    if (isMessageDuplicate(messageId)) {
      console.log(`⚡ [WhatsAppDispatcher] Duplicate Meta message ID detected (${messageId}), ignoring.`);
      return { status: 'duplicate_ignored', handled: true, target: 'pandoras_acquisition' };
    }

    console.log(`📱 [WhatsAppDispatcher] Inbound message from ${phone} to PhoneID ${phoneNumberId}: "${messageText.substring(0, 40)}..."`);

    // ── 1. Check if message is for a specific Tenant ────────────────────────
    const tenant = await this.resolveTenantByPhoneNumberId(phoneNumberId);

    if (tenant) {
      console.log(`🏛️ [WhatsAppDispatcher] Routing message to TENANT COGNITIVE ENGINE: ${tenant.title} (${tenant.slug})`);

      // 1.1 Check if conversation is PAUSED by an active human handoff
      const isPaused = await HumanHandoffProtocol.isPaused(tenant.id, phone);
      if (isPaused) {
        console.log(`⏸️ [WhatsAppDispatcher] Conversation with ${phone} is currently PAUSED for ${tenant.slug}. AI response suppressed.`);
        return {
          status: 'paused_human_handling',
          handled: true,
          target: 'tenant_cognitive'
        };
      }

      // 1.2 Human handoff detection via keywords or low confidence (< 70)
      const routeCheck = InteractionRouter.route(messageText);
      if (routeCheck.requiresHuman || (routeCheck.confidence !== undefined && routeCheck.confidence < 70)) {
        await HumanHandoffProtocol.triggerHandoff({
          projectId: tenant.id,
          chatId: phone,
          reason: routeCheck.reason || 'Baja certeza o consulta no verificada en doctrina oficial',
          lastUserMessage: messageText,
        });

        const handoffResponse = "He notificado a nuestro equipo humano para que te atienda a la brevedad. Un asesor se comunicará contigo por este medio.";
        await this.sendReply({
          to: phone,
          text: handoffResponse,
          replyToId: messageId,
          secrets: tenant.secrets,
          defaultPhoneId: phoneNumberId,
          tenantSlug: tenant.slug
        });

        return {
          status: 'success',
          handled: true,
          target: 'tenant_cognitive',
          response: handoffResponse,
        };
      }

      // 1.3 Process via Governed Cognitive Runtime
      try {
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
          tenantSlug: tenant.slug
        });

        return {
          status: 'success',
          handled: true,
          target: 'tenant_cognitive',
          response: cognitiveAnswer,
        };
      } catch (cognitiveErr: any) {
        console.error(`❌ [WhatsAppDispatcher] Cognitive runtime error for ${tenant.slug}:`, cognitiveErr);
        
        // Trigger handoff on unexpected error
        await HumanHandoffProtocol.triggerHandoff({
          projectId: tenant.id,
          chatId: phone,
          reason: 'Falla o baja confianza en motor cognitivo',
          lastUserMessage: messageText,
        });

        const fallbackText = "Gracias por tu mensaje. Un asesor de nuestro equipo te responderá en breve.";
        await this.sendReply({
          to: phone,
          text: fallbackText,
          replyToId: messageId,
          secrets: tenant.secrets,
          defaultPhoneId: phoneNumberId,
          tenantSlug: tenant.slug
        });
        return {
          status: 'error_fallback_handoff',
          handled: true,
          target: 'tenant_cognitive',
          response: fallbackText,
        };
      }
    }

    // ── 2. Route to Pandora's Acquisition / Hermes Cognitive Engine ────────
    console.log(`🌐 [WhatsAppDispatcher] Routing message to PANDORA'S COGNITIVE RUNTIME`);
    const routerPayload = {
      from: phone,
      id: messageId,
      type: message.type || 'text',
      text: message.text ? { body: message.text.body } : undefined,
      contactName,
      flowFromLanding: null,
    };

    let result = await routeSimpleMessage(routerPayload);

    // If the legacy flow is already completed or user is sending general conversation, delegate directly to Hermes AI Runtime
    if (!result.handled || result.isCompleted || result.action === 'flow_completed' || messageText.toLowerCase().includes('hola') || messageText.toLowerCase().includes('test')) {
      try {
        const runtime = getDefaultRuntime();
        const runtimeResponse = await runtime.respond({
          organizationId: 'pandoras',
          conversationId: `conv_wa_pandoras_${phone}`,
          message: {
            id: messageId,
            role: 'USER',
            content: messageText,
            createdAt: new Date(),
          },
          controlPlaneContext: {
            actorId: `wa_actor_${phone}`,
            organizationId: 'pandoras',
            role: 'ADMIN',
            permissions: ['view_overview'],
            sessionId: `wa_sess_pandoras_${phone}`,
          }
        });

        if (runtimeResponse.content) {
          result = {
            handled: true,
            flowType: 'hermes_cognitive',
            response: runtimeResponse.content,
          };
        }
      } catch (err) {
        console.warn('[WhatsAppDispatcher] Hermes runtime fallback for master WhatsApp failed:', err);
      }
    }

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
   * Helper to send WhatsApp reply strictly using tenant's token (no institutional cross-tenant leak).
   */
  private static async sendReply(opts: { 
    to: string; 
    text: string; 
    replyToId?: string; 
    secrets?: any; 
    defaultPhoneId?: string;
    tenantSlug?: string;
  }) {
    const { to, text, replyToId, secrets, defaultPhoneId, tenantSlug } = opts;
    const token = secrets?.whatsappToken;
    const phoneId = secrets?.whatsappPhoneId || defaultPhoneId;

    const formattedText = formatWhatsAppText(text);

    // Strict Tenant Isolation Guard:
    // If this is a tenant and they do NOT have WhatsApp API credentials configured,
    // we MUST NOT spoof/reply from Pandora's institutional phone number!
    if (!token || !phoneId) {
      if (tenantSlug && tenantSlug !== 'pandoras') {
        console.error(`❌ [WhatsAppDispatcher] Tenant "${tenantSlug}" does not have WhatsApp API token configured. Aborting reply to prevent cross-tenant number spoofing.`);
        return;
      }
      // Only for Pandora's master core
      return sendWhatsAppMessage(to, formattedText, replyToId);
    }

    try {
      console.log(`🚀 [WhatsAppDispatcher] Dispatching reply to ${to} via PhoneID ${phoneId}...`);
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
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
        const errorText = await res.text();
        console.error(`❌ [WhatsAppDispatcher] Direct Meta dispatch failed (${res.status}):`, errorText);
      } else {
        const resultData = await res.json();
        console.log(`✅ [WhatsAppDispatcher] Direct Meta dispatch SUCCESS for ${to}:`, resultData);
      }
    } catch (err) {
      console.error('❌ [WhatsAppDispatcher] sendReply error:', err);
    }
  }
}

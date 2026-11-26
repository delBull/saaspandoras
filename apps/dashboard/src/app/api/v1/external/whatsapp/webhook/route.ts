import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { DefaultOmnichannelGateway } from '@saasfly/hermes-core';
import { DefaultCognitiveChannelDispatcher } from '@saasfly/hermes-core';
import { DuplicateMessageError, InvalidChannelPayloadError } from '@saasfly/hermes-core';
import { verifyMetaSignature } from '@/lib/whatsapp/security';

const omnichannelGateway = new DefaultOmnichannelGateway();
const channelDispatcher = new DefaultCognitiveChannelDispatcher();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN;

  if (mode === 'subscribe' && VERIFY_TOKEN && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] Meta Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetTenant = searchParams.get('tenant') || searchParams.get('organizationId');

    const bodyText = await request.text();
    
    const signatureHeader = request.headers.get('x-hub-signature-256');

    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const isNativeMeta = body.object === 'whatsapp_business_account';

    /**
     * Identidad del número receptor. Hermes (plataforma) y S'Narai son apps de
     * Meta distintas: el secreto de firma es el de la app dueña del número.
     */
    const { resolveInboundIdentity, MissingTenantSecretError } = await import('@/lib/whatsapp/inbound-identity');

    let identity;
    try {
      identity = await resolveInboundIdentity(body);
    } catch (err: any) {
      if (err instanceof MissingTenantSecretError) {
        console.error(`❌ [WhatsApp Webhook] ${err.message}. Fail-closed.`);
        return NextResponse.json({ error: 'Server configuration error: missing tenant secret' }, { status: 500 });
      }
      throw err;
    }

    const tenantSlug = targetTenant || identity.tenantSlug || '';
    const phoneNumberId = identity.phoneNumberId;
    const metaAppSecret = identity.appSecret;

    // 🔒 Cyber Security: Enforce strict fail-closed HMAC for Meta Webhooks
    if (signatureHeader || isNativeMeta) {
      if (!metaAppSecret) {
        if (process.env.NODE_ENV === 'production') {
          console.error('❌ [WhatsApp Webhook] META_APP_SECRET missing in production.');
          return NextResponse.json({ error: 'Server configuration error: missing secret' }, { status: 500 });
        }
        console.warn('⚠️ [WhatsApp Webhook] Non-production environment missing META_APP_SECRET.');
      } else {
        if (!signatureHeader) {
          console.warn('🔒 [WhatsApp Webhook] Missing x-hub-signature-256 header.');
          return NextResponse.json({ error: 'Missing x-hub-signature-256 header' }, { status: 401 });
        }

        const isValid = verifyMetaSignature(bodyText, signatureHeader, metaAppSecret);
        if (!isValid) {
          console.warn(
            `🔒 [WhatsApp Webhook] Invalid HMAC signature or tampered body (tenant=${tenantSlug || 'desconocido'}, phoneId=${phoneNumberId || 'n/a'}).`,
          );
          return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 401 });
        }
      }
    }

    // Determine if it's Native Meta Cloud API or Bridge
    if (isNativeMeta) {
      const { WhatsAppDispatcher } = await import('@/lib/whatsapp/dispatcher');
      /**
       * La evidencia del canal es obligatoria para crear la sesión verificada del
       * tenant en producción. Sin ella, el dispatcher caía al mensaje genérico
       * ("un asesor te responderá") y el Hermes del tenant nunca se ejecutaba.
       */
      const dispatchResult = await WhatsAppDispatcher.dispatch(body, {
        rawBody: bodyText,
        hubSignature: signatureHeader || undefined,
        appSecret: identity.appSecret || undefined,
      });
      return NextResponse.json(dispatchResult);
    }

    let rawPayload = body;
    
    if (!isNativeMeta) {
      rawPayload.targetTenant = targetTenant;
    }

    // LOCK C5.18: Thin webhook boundary. Delegate directly to OmnichannelGateway.
    // The Gateway and Adapter will enforce C5.11 (Tenant Binding) and ignore any tenantId in the envelope.
    const normalized = await omnichannelGateway.receive({
      channelType: 'whatsapp',
      externalId: String(rawPayload.externalId),
      rawPayload: rawPayload
    });

    // 6.5.3: Asynchronously dispatch cognitive response back via OutboundRouter
    channelDispatcher.dispatchAsync(normalized).catch((err) => {
      console.error('[WhatsApp Dispatch Error]:', err);
    });

    return NextResponse.json({
      status: 'ACCEPTED',
      normalizedMessageId: normalized.message.messageId,
      organizationId: normalized.organizationId,
      correlationId: normalized.correlationId
    });

  } catch (error: any) {
    if (error instanceof DuplicateMessageError) {
      // C5.17: Return HTTP 200 for duplicate webhook deliveries so SignalWire does not retry
      return NextResponse.json({ status: 'IDEMPOTENT_SKIPPED', message: error.message }, { status: 200 });
    }
    if (error instanceof InvalidChannelPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[WhatsApp Webhook Error]:', error);
    return NextResponse.json({ error: 'Internal processing error' }, { status: 500 });
  }
}

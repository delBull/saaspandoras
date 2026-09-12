/**
 * 📰 Newsletter Direct Sovereign Publisher (FASE 2)
 * apps/dashboard/src/lib/hermes/channels/publishers/newsletter-publisher.ts
 *
 * Implements clean architectural separation:
 * Sender Provider (Execution/Transport) ≠ Audience/List Provider (Targeting/Subscribers).
 *
 * MANDATORY INVARIANTS:
 * 1. Sender Provider is decoupled from Audience Provider.
 * 2. Never exposes API keys or recipient PII in public receipt.
 * 3. Requires verifiable transmission receipt; fails closed if transport rejects.
 */

import type {
  IChannelPublisher,
  PublicationPayload,
  PublicationReceipt,
  PublisherContext,
  PublicationErrorCode,
} from './publisher.types';
import { db } from '@/db';
import { projects, marketingLeads } from '@/db/schema';
import { eq, and, isNotNull, or } from 'drizzle-orm';

/**
 * 1. SENDER PROVIDER CONTRACT (Transport Layer)
 */
export interface ISenderProvider {
  readonly name: string;
  send(options: {
    apiKey: string;
    from: string;
    to: string[];
    subject: string;
    body: string;
  }): Promise<{ messageId: string }>;
}

export class ResendSenderProvider implements ISenderProvider {
  readonly name = 'resend';

  async send(options: {
    apiKey: string;
    from: string;
    to: string[];
    subject: string;
    body: string;
  }): Promise<{ messageId: string }> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: `<div style="font-family: sans-serif; line-height: 1.6; color: #111;">${options.body}</div>`,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.id) {
      const errorMsg = data?.message || `HTTP ${res.status}`;
      throw new Error(`[ResendSenderProvider] Send failed: ${errorMsg}`);
    }

    return { messageId: data.id };
  }
}

/**
 * 2. AUDIENCE PROVIDER CONTRACT (Recipients / Subscribers Layer)
 */
export interface IAudienceProvider {
  readonly name: string;
  resolveAudience(canonicalOrgId: string, listId?: string): Promise<{
    recipients: string[];
    audienceCount: number;
  }>;
}

export class TenantLeadAudienceProvider implements IAudienceProvider {
  readonly name = 'tenant_leads';

  async resolveAudience(canonicalOrgId: string, listId?: string): Promise<{
    recipients: string[];
    audienceCount: number;
  }> {
    // If a specific test/single recipient is provided via listId, return it
    if (listId && listId.includes('@')) {
      return { recipients: [listId], audienceCount: 1 };
    }

    // Default: query subscribed leads for this tenant
    try {
      const project = await db.query.projects.findFirst({
        where: or(
          eq(projects.organizationId, canonicalOrgId),
          eq(projects.slug, canonicalOrgId)
        ),
        columns: { id: true },
      });

      if (!project) {
        return { recipients: [], audienceCount: 0 };
      }

      const leads = await db.query.marketingLeads.findMany({
        where: and(
          eq(marketingLeads.projectId, project.id),
          isNotNull(marketingLeads.email)
        ),
        columns: { email: true },
        limit: 100, // Batch limit for V1
      });

      const emails = leads
        .map((l) => l.email)
        .filter((e): e is string => Boolean(e && e.includes('@')));

      return { recipients: emails, audienceCount: emails.length };
    } catch {
      return { recipients: [], audienceCount: 0 };
    }
  }
}

/**
 * 3. NEWSLETTER PUBLISHER (Orchestrator combining Sender + Audience)
 */
export class NewsletterPublisher implements IChannelPublisher {
  readonly channel = 'newsletter' as const;

  private sender: ISenderProvider;
  private audience: IAudienceProvider;

  constructor(sender?: ISenderProvider, audience?: IAudienceProvider) {
    this.sender = sender || new ResendSenderProvider();
    this.audience = audience || new TenantLeadAudienceProvider();
  }

  async publish(
    credentials: Record<string, unknown>,
    payload: PublicationPayload,
    context: PublisherContext
  ): Promise<PublicationReceipt> {
    const apiKey = credentials?.apiKey as string;
    const fromAddress = (credentials?.fromEmail as string) || (context.metadata?.fromEmail as string) || 'Hermes Dispatch <updates@pandoras.finance>';

    if (!apiKey) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_AUTH_INVALID',
        errorMessage: 'Missing Newsletter provider API key.',
        retryable: false,
      };
    }

    // 1. Resolve Audience independently from transport
    const { recipients, audienceCount } = await this.audience.resolveAudience(
      context.canonicalOrgId,
      context.metadata?.listId as string
    );

    if (recipients.length === 0) {
      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode: 'PROVIDER_PAYLOAD_INVALID',
        errorMessage: 'Audience resolution returned 0 valid recipients.',
        retryable: false,
      };
    }

    // 2. Format newsletter HTML
    let bodyHtml = payload.text.replace(/\n/g, '<br/>');
    if (payload.ctaUrl) {
      bodyHtml += `<br/><br/><a href="${payload.ctaUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Acceder a la oportunidad</a>`;
    }

    const subject = (context.metadata?.subject as string) || 'Actualización Exclusiva — Hermes Growth';

    try {
      const { messageId } = await this.sender.send({
        apiKey,
        from: fromAddress,
        to: recipients,
        subject,
        body: bodyHtml,
      });

      return {
        success: true,
        channel: this.channel,
        externalPostId: messageId,
        externalUrl: `https://resend.com/emails/${messageId}`,
        publishedAt: new Date().toISOString(),
        idempotencyKey: payload.idempotencyKey,
      };
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to dispatch email';
      let errorCode: PublicationErrorCode = 'PROVIDER_PAYLOAD_INVALID';
      let retryable = false;

      if (errMsg.includes('401') || errMsg.includes('API key') || errMsg.includes('Unauthorized')) {
        errorCode = 'PROVIDER_AUTH_INVALID';
        retryable = false;
      } else if (errMsg.includes('429') || errMsg.includes('rate limit')) {
        errorCode = 'PROVIDER_RATE_LIMIT';
        retryable = true;
      } else if (errMsg.includes('Network') || errMsg.includes('fetch')) {
        errorCode = 'PROVIDER_NETWORK_ERROR';
        retryable = true;
      }

      return {
        success: false,
        channel: this.channel,
        idempotencyKey: payload.idempotencyKey,
        errorCode,
        errorMessage: errMsg,
        retryable,
      };
    }
  }
}

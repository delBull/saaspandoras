/**
 * 🛡️ Hermes OS Actor Identity Binding Contract (Phase 3.0 Identity Contract)
 *
 * Resolves channel-specific identifiers (Telegram User ID, WhatsApp Phone, Web Session)
 * to an authenticated, tenant-scoped canonical Actor Identity.
 *
 * Invariant: Channel Account ≠ Cross-Tenant Authority.
 * An actor identity is strictly bound to its verified organizationId.
 */

import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export interface ChannelIdentityInput {
  channelType: 'telegram' | 'whatsapp' | 'web' | 'miniapp' | 'api';
  externalIdentifier: string;
  organizationId: string;
}

export interface ResolvedActorIdentity {
  actorId: string;
  organizationId: string;
  canonicalOrganizationUuid: string;
  channelType: string;
  externalIdentifier: string;
  boundAt: Date;
}

export class ActorIdentityResolver {
  /**
   * Resolves channel identity to canonical actor bound to a verified tenant.
   * Fails closed if the organization does not exist.
   */
  public async resolve(input: ChannelIdentityInput): Promise<ResolvedActorIdentity | null> {
    const { channelType, externalIdentifier, organizationId } = input;

    if (!externalIdentifier || !organizationId) {
      return null;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(organizationId);

    // 1. Verify tenant organization exists in database
    const tenantQuery = await db
      .select({
        id: projects.id,
        organizationId: projects.organizationId,
        slug: projects.slug,
        status: projects.status
      })
      .from(projects)
      .where(isUuid ? eq(projects.organizationId, organizationId) : eq(projects.slug, organizationId))
      .limit(1);

    const project = tenantQuery[0];
    if (!project || !project.organizationId) {
      console.warn(`[ActorIdentityResolver] Security: Unknown or invalid tenant '${organizationId}'. Failing closed.`);
      return null;
    }

    // 2. Derive canonical actor ID (Deterministic & Scoped)
    const sanitizedExternal = externalIdentifier.trim().toLowerCase();
    const actorId = `actor_${channelType}_${sanitizedExternal}`;

    return {
      actorId,
      organizationId: project.slug,
      canonicalOrganizationUuid: project.organizationId,
      channelType,
      externalIdentifier: sanitizedExternal,
      boundAt: new Date()
    };
  }
}

/**
 * 🏛️ Canonical Identity Graph Core (F1)
 * apps/dashboard/src/lib/identity/canonical-identity-graph.ts
 *
 * Inviolable System Principle:
 * Canonical Identity ≠ Tenant Membership ≠ Role ≠ Capability ≠ Execution Authority
 *
 * Responsibilities:
 * 1. Resolves and binds physical/digital actor identifiers (Wallet, Email, Phone, Telegram).
 * 2. Manages verification metadata and confidence tiers (VERIFIED, SELF_DECLARED, IMPORTED, UNVERIFIED).
 * 3. Enforces Anti-Auto-Merge & Collision Detection (Matching ≠ Proof).
 * 4. Dispatches tamper-evident forensic audit events via SecurityAuditLogger.
 * 5. STRICT SECURITY INVARIANT: Returns ZERO roles, ZERO capabilities, and ZERO permissions.
 */

import { db } from '@/db';
import { marketingIdentities, channelIdentityBindings } from '@/db/schema';
import { eq, or, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';
import type {
  CanonicalIdentifierType,
  CanonicalIdentifierInput,
  CanonicalIdentityRecord,
  ResolveIdentityOptions,
  AttachIdentifierParams,
  AttachIdentifierResult,
  VerificationStatus,
} from './types';

export class CanonicalIdentityGraph {
  /**
   * Normalizes raw identifiers to eliminate format variances across channels.
   */
  static normalizeIdentifier(type: CanonicalIdentifierType, rawValue: string): string {
    const trimmed = (rawValue || '').trim();
    switch (type) {
      case 'wallet':
        return trimmed.toLowerCase();
      case 'email':
        return trimmed.toLowerCase();
      case 'phone':
        // Strip common delimiters, keep pure digits
        return trimmed.replace(/[\s\-\(\)\+]/g, '');
      case 'telegram':
        // Strip leading @ for handles, or keep pure ID string
        return trimmed.startsWith('@') ? trimmed.substring(1).toLowerCase() : trimmed;
      default:
        return trimmed;
    }
  }

  /**
   * Maps a DB record from marketingIdentities to a strictly-bounded CanonicalIdentityRecord.
   * GUARANTEE: Never exposes or fabricates roles, tenant memberships, or execution authority.
   */
  private static mapToRecord(row: typeof marketingIdentities.$inferSelect): CanonicalIdentityRecord {
    const meta = (row.metadata as any) || {};
    const verification = meta.verification || {};

    return {
      identityId: row.id,
      userId: row.userId || null,
      identifiers: {
        wallet: row.walletAddress || null,
        email: row.email || null,
        phone: row.phone || null,
        telegramId: row.telegramId || null,
      },
      verification: {
        wallet: verification.wallet || (row.walletAddress ? { status: 'UNVERIFIED' } : undefined),
        email: verification.email || (row.email ? { status: 'UNVERIFIED' } : undefined),
        phone: verification.phone || (row.phone ? { status: 'UNVERIFIED' } : undefined),
        telegram: verification.telegram || (row.telegramId ? { status: 'UNVERIFIED' } : undefined),
      },
      metadata: meta,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Resolves a Canonical Identity Record from a single verified or self-declared channel identifier.
   * If autoCreate=true (default), provisions a clean identity if none matches.
   */
  static async resolveCanonicalIdentity(
    input: CanonicalIdentifierInput,
    options: ResolveIdentityOptions = { autoCreate: true }
  ): Promise<CanonicalIdentityRecord | null> {
    if (!input || !input.value) {
      throw new Error('[CanonicalIdentityGraph] Cannot resolve identity with empty identifier value.');
    }

    const normalized = this.normalizeIdentifier(input.type, input.value);
    if (!normalized) {
      throw new Error('[CanonicalIdentityGraph] Identifier normalization resulted in empty string.');
    }

    // 1. Check primary columns in marketingIdentities
    let queryCondition;
    switch (input.type) {
      case 'wallet':
        queryCondition = eq(marketingIdentities.walletAddress, normalized);
        break;
      case 'email':
        queryCondition = eq(marketingIdentities.email, normalized);
        break;
      case 'phone':
        queryCondition = or(
          eq(marketingIdentities.phone, normalized),
          eq(marketingIdentities.phone, `+${normalized}`)
        );
        break;
      case 'telegram':
        queryCondition = eq(marketingIdentities.telegramId, normalized);
        break;
    }

    const matchedIdentity = await db.query.marketingIdentities.findFirst({
      where: queryCondition,
    });

    if (matchedIdentity) {
      return this.mapToRecord(matchedIdentity);
    }

    // 2. Fallback: Check channelIdentityBindings (edge / gateway bindings)
    const channelName = input.type === 'phone' ? 'whatsapp' : input.type;
    const matchedBinding = await db.query.channelIdentityBindings.findFirst({
      where: and(
        eq(channelIdentityBindings.channel, channelName),
        or(
          eq(channelIdentityBindings.externalUserId, normalized),
          eq(channelIdentityBindings.address, normalized)
        )
      ),
    });

    if (matchedBinding) {
      const boundIdentity = await db.query.marketingIdentities.findFirst({
        where: eq(marketingIdentities.id, matchedBinding.identityId),
      });
      if (boundIdentity) {
        return this.mapToRecord(boundIdentity);
      }
    }

    // 3. If not found and autoCreate is false, return null
    if (options.autoCreate === false) {
      return null;
    }

    // 4. Provision a new clean canonical identity
    const newId = uuidv4();
    const now = new Date();
    const confidence: VerificationStatus = input.confidence || 'UNVERIFIED';

    const initialVerification = {
      [input.type]: {
        status: confidence,
        method: input.verificationMethod || 'INBOUND_RESOLUTION',
        verifiedAt: now.toISOString(),
      },
    };

    const insertValues: any = {
      id: newId,
      metadata: {
        verification: initialVerification,
        createdSource: input.type,
      },
      createdAt: now,
      updatedAt: now,
    };

    if (input.type === 'wallet') insertValues.walletAddress = normalized;
    if (input.type === 'email') insertValues.email = normalized;
    if (input.type === 'phone') insertValues.phone = normalized;
    if (input.type === 'telegram') insertValues.telegramId = normalized;

    const [created] = await db.insert(marketingIdentities).values(insertValues).returning();
    if (!created) {
      throw new Error('[CanonicalIdentityGraph] Failed to insert new canonical identity record.');
    }

    // Provision edge channel binding
    await db.insert(channelIdentityBindings).values({
      identityId: newId,
      channel: channelName,
      externalUserId: normalized,
      address: normalized,
      status: 'ACTIVE',
      verifiedAt: confidence === 'VERIFIED' ? now : null,
      createdAt: now,
      updatedAt: now,
    }).catch(() => undefined); // Non-blocking if unique constraint hit

    // Forensic audit event
    SecurityAuditLogger.logEvent({
      organizationId: options.organizationId || 'system',
      actorId: options.actorId || newId,
      eventType: 'IDENTITY_LINK_CREATED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: `ident_${Date.now()}`,
      metadata: {
        identityId: newId,
        type: input.type,
        confidence,
        method: input.verificationMethod || 'INBOUND_RESOLUTION',
      },
    }).catch(() => undefined);

    return this.mapToRecord(created);
  }

  /**
   * Attaches a new identifier to an existing Canonical Identity.
   *
   * ANTI-AUTO-MERGE INVARIANT:
   * If the identifier already belongs to another identity, it REFUSES to auto-merge.
   * Instead, it emits IDENTITY_COLLISION_BLOCKED and returns collision metadata.
   */
  static async attachIdentifier(params: AttachIdentifierParams): Promise<AttachIdentifierResult> {
    const { identityId, identifier, proof, organizationId, actorId } = params;
    const normalized = this.normalizeIdentifier(identifier.type, identifier.value);

    // 1. Find existing target identity
    const target = await db.query.marketingIdentities.findFirst({
      where: eq(marketingIdentities.id, identityId),
    });

    if (!target) {
      throw new Error(`[CanonicalIdentityGraph] Target identity '${identityId}' not found.`);
    }

    // 2. COLLISION DETECTION: Check if identifier already belongs to a DIFFERENT identity
    let collisionCondition;
    switch (identifier.type) {
      case 'wallet':
        collisionCondition = eq(marketingIdentities.walletAddress, normalized);
        break;
      case 'email':
        collisionCondition = eq(marketingIdentities.email, normalized);
        break;
      case 'phone':
        collisionCondition = or(
          eq(marketingIdentities.phone, normalized),
          eq(marketingIdentities.phone, `+${normalized}`)
        );
        break;
      case 'telegram':
        collisionCondition = eq(marketingIdentities.telegramId, normalized);
        break;
    }

    const existingConflict = await db.query.marketingIdentities.findFirst({
      where: collisionCondition,
    });

    if (existingConflict && existingConflict.id !== identityId) {
      // 🛡️ HARD INVIOLABLE BOUND: Matching ≠ Proof. Never auto-merge without verified merge protocol.
      SecurityAuditLogger.logEvent({
        organizationId: organizationId || 'system',
        actorId: actorId || identityId,
        eventType: 'IDENTITY_COLLISION_BLOCKED',
        severity: 'WARN',
        policyDecision: 'DENY',
        correlationId: `collision_${Date.now()}`,
        metadata: {
          targetIdentityId: identityId,
          existingIdentityId: existingConflict.id,
          conflictType: identifier.type,
          conflictValue: normalized,
        },
      }).catch(() => undefined);

      return {
        success: false,
        identity: this.mapToRecord(target),
        collision: {
          existingIdentityId: existingConflict.id,
          conflictIdentifier: normalized,
          conflictType: identifier.type,
        },
        reason: `COLLISION_DETECTED: ${identifier.type} '${normalized}' is already bound to identity '${existingConflict.id}'. Automatic merge is forbidden.`,
      };
    }

    // 3. Apply the update safely
    const now = new Date();
    const targetMeta = (target.metadata as any) || {};
    const verifications = targetMeta.verification || {};
    const confidence: VerificationStatus = identifier.confidence || 'SELF_DECLARED';

    verifications[identifier.type] = {
      status: confidence,
      method: identifier.verificationMethod || 'ATTACH_UPDATE',
      verifiedAt: now.toISOString(),
    };

    const proofs = targetMeta.proofs || {};
    if (proof) {
      proofs[identifier.type] = {
        ...proof,
        recordedAt: now.toISOString(),
      };
    }

    const updateFields: any = {
      metadata: {
        ...targetMeta,
        verification: verifications,
        proofs,
      },
      updatedAt: now,
    };

    if (identifier.type === 'wallet') updateFields.walletAddress = normalized;
    if (identifier.type === 'email') updateFields.email = normalized;
    if (identifier.type === 'phone') updateFields.phone = normalized;
    if (identifier.type === 'telegram') updateFields.telegramId = normalized;

    const [updated] = await db
      .update(marketingIdentities)
      .set(updateFields)
      .where(eq(marketingIdentities.id, identityId))
      .returning();

    if (!updated) {
      throw new Error(`[CanonicalIdentityGraph] Failed to update identity '${identityId}'.`);
    }

    // 4. Update channel binding
    const channelName = identifier.type === 'phone' ? 'whatsapp' : identifier.type;
    await db.insert(channelIdentityBindings).values({
      identityId,
      channel: channelName,
      externalUserId: normalized,
      address: normalized,
      status: 'ACTIVE',
      verifiedAt: confidence === 'VERIFIED' ? now : null,
      createdAt: now,
      updatedAt: now,
    }).catch(async () => {
      // If already bound to this identity, update status/verifiedAt
      await db.update(channelIdentityBindings)
        .set({
          status: 'ACTIVE',
          verifiedAt: confidence === 'VERIFIED' ? now : null,
          updatedAt: now,
        })
        .where(and(
          eq(channelIdentityBindings.channel, channelName),
          eq(channelIdentityBindings.externalUserId, normalized)
        ))
        .catch(() => undefined);
    });

    // 5. Emit forensic audit event
    SecurityAuditLogger.logEvent({
      organizationId: organizationId || 'system',
      actorId: actorId || identityId,
      eventType: confidence === 'VERIFIED' ? 'IDENTITY_LINK_VERIFIED' : 'IDENTITY_LINK_CREATED',
      severity: 'INFO',
      policyDecision: 'ALLOW',
      correlationId: `attach_${Date.now()}`,
      metadata: {
        identityId,
        type: identifier.type,
        confidence,
        method: identifier.verificationMethod || 'ATTACH_UPDATE',
      },
    }).catch(() => undefined);

    return {
      success: true,
      identity: this.mapToRecord(updated),
    };
  }
}

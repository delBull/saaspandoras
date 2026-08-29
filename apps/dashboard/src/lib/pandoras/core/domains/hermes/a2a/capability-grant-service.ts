/**
 * 🏛️ PANDORAS A2A PROTOCOL v1.1 — CAPABILITY GRANT SERVICE
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/a2a/capability-grant-service.ts
 *
 * Manages tenant-scoped capability authorizations and entitlements.
 * Provides fail-closed evaluation for Media Co and Cognitive OS services.
 */

import { db } from '@/db';
import { hermesCapabilityGrants, hermesMediaRequests, hermesArtifacts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { CapabilityGrant, SovereignArtifactManifest } from './contracts';
import { AgentRegistry } from './agent-registry';

export const SUPPORTED_MEDIA_CAPABILITIES = [
  { id: 'media.image.create', label: '📸 Image Creation (Pixel)', defaultEnabled: true },
  { id: 'media.video.create', label: '🎥 Video & Reels (Pixel)', defaultEnabled: false },
  { id: 'media.copy.create', label: '✍️ Copy & Editorial (Minerva)', defaultEnabled: true },
  { id: 'media.newsletter.create', label: '📰 Newsletters (Atlas)', defaultEnabled: true },
  { id: 'media.podcast.create', label: '🎙️ Podcasts (Media Co)', defaultEnabled: false },
  { id: 'research.report.create', label: '🔍 Research & Intelligence (Minerva)', defaultEnabled: true },
] as const;

export class CapabilityGrantService {
  /**
   * Checks if a tenant has an ACTIVE capability grant.
   */
  public static async isCapabilityGranted(tenantId: string, capability: string): Promise<boolean> {
    const normalizedTenant = tenantId.toLowerCase();
    
    // First check memory registry (instant / test fallback)
    if (AgentRegistry.hasCapability('hermes', capability, normalizedTenant)) {
      return true;
    }

    try {
      if (db) {
        const rows = await db
          .select()
          .from(hermesCapabilityGrants)
          .where(
            and(
              eq(hermesCapabilityGrants.tenantId, normalizedTenant),
              eq(hermesCapabilityGrants.capability, capability),
              eq(hermesCapabilityGrants.status, 'ACTIVE')
            )
          )
          .limit(1);

        if (rows.length > 0 && rows[0]) {
          const grant = rows[0];
          if (grant.expiresAt && Date.now() > new Date(grant.expiresAt).getTime()) {
            return false;
          }
          return true;
        }
      }
    } catch (err) {
      console.warn('[CapabilityGrantService] DB check error, falling back to memory:', err);
    }

    // Default bootstrap grant for S'Narai and Pandoras
    if (normalizedTenant === 'snarai' || normalizedTenant === 'pandoras') {
      return capability === 'media.image.create' || capability === 'media.copy.create';
    }

    return false;
  }

  /**
   * Lists all grants for a specific tenant.
   */
  public static async listGrantsForTenant(tenantId: string): Promise<Array<{
    capability: string;
    label: string;
    enabled: boolean;
    status: string;
    grantId?: string;
  }>> {
    const normalizedTenant = tenantId.toLowerCase();
    let dbGrants: Record<string, string> = {};

    try {
      if (db) {
        const rows = await db
          .select()
          .from(hermesCapabilityGrants)
          .where(eq(hermesCapabilityGrants.tenantId, normalizedTenant));

        for (const row of rows) {
          dbGrants[row.capability] = row.status;
        }
      }
    } catch (err) {
      console.warn('[CapabilityGrantService] Error reading DB grants:', err);
    }

    return SUPPORTED_MEDIA_CAPABILITIES.map(cap => {
      const status = dbGrants[cap.id] || (cap.defaultEnabled && (normalizedTenant === 'snarai' || normalizedTenant === 'pandoras') ? 'ACTIVE' : 'SUSPENDED');
      return {
        capability: cap.id,
        label: cap.label,
        enabled: status === 'ACTIVE',
        status,
      };
    });
  }

  /**
   * Sets (enables or suspends) a capability grant for a tenant.
   *
   * `authorizedBy` is REQUIRED and must be an authenticated actor identity
   * (resolved server-side from the admin session — never from a client-supplied
   * body field). The audit trail records this actor verbatim.
   */
  public static async setGrant(
    tenantId: string,
    capability: string,
    enabled: boolean,
    authorizedBy: string
  ): Promise<CapabilityGrant> {
    if (!authorizedBy || typeof authorizedBy !== 'string' || authorizedBy.trim() === '') {
      throw new Error('[CapabilityGrantService] setGrant requires an authenticated actor identity (authorizedBy).');
    }

    const normalizedTenant = tenantId.toLowerCase();
    const grantId = `grant_${normalizedTenant}_${capability.replace(/\./g, '_')}`;
    const status = enabled ? 'ACTIVE' : 'SUSPENDED';
    const now = new Date();

    const grant: CapabilityGrant = {
      grantId,
      issuer: 'hermes',
      grantee: 'sofia',
      capability,
      scope: { tenantIds: [normalizedTenant] },
      permissions: { execute: true, create: true },
      authorizedBy,
      createdAt: now.toISOString(),
    };

    // Register or revoke in memory AgentRegistry
    if (enabled) {
      AgentRegistry.registerCapabilityGrant(grant);
    } else {
      AgentRegistry.revokeCapabilityGrant(grantId);
    }

    // Persist to Postgres DB
    try {
      if (db) {
        await db
          .insert(hermesCapabilityGrants)
          .values({
            id: grantId,
            grantId,
            tenantId: normalizedTenant,
            issuerAgentId: 'hermes',
            granteeAgentId: 'sofia',
            capability,
            status,
            constraintsJson: { maxPerDay: null, allowedArtifactTypes: ['image', 'video', 'copy', 'newsletter', 'podcast'] },
            issuedAt: now,
            createdBy: authorizedBy,
            updatedBy: authorizedBy,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: hermesCapabilityGrants.grantId,
            set: {
              status,
              updatedBy: authorizedBy,
              updatedAt: now,
              revokedAt: enabled ? null : now,
            },
          });
      }
    } catch (err) {
      console.error('[CapabilityGrantService] Error persisting grant:', err);
    }

    // Log tamper-evident audit event
    try {
      const { SecurityAuditLogger } = await import('../runtime/security-audit-logger');
      await SecurityAuditLogger.logEvent({
        organizationId: normalizedTenant,
        actorId: `admin:${authorizedBy}`,
        eventType: 'CREDENTIAL_ISSUED',
        severity: 'INFO',
        policyDecision: 'ALLOW',
        correlationId: grantId,
        metadata: {
          event: 'capability.grant.changed',
          tenantId: normalizedTenant,
          capability,
          grantId,
          status,
          authorizedBy,
        },
      });
    } catch (err) {
      console.warn('[CapabilityGrantService] Audit log error:', err);
    }

    return grant;
  }

  /**
   * Records an artifact created by Media Co in the Sovereign Artifact Registry.
   */
  public static async registerArtifact(
    tenantId: string,
    manifest: SovereignArtifactManifest
  ): Promise<void> {
    const normalizedTenant = tenantId.toLowerCase();
    try {
      if (db) {
        await db
          .insert(hermesArtifacts)
          .values({
            id: `art_rec_${manifest.artifactId}`,
            artifactId: manifest.artifactId,
            tenantId: normalizedTenant,
            sourceAgent: manifest.owner || 'sofia',
            producer: manifest.createdBy || 'pixel',
            artifactType: manifest.kind || 'image',
            title: (manifest.metadata?.title as string) || `Media Asset for ${normalizedTenant}`,
            cid: manifest.cid,
            ipfsUri: manifest.ipfsUri || `ipfs://${manifest.cid}`,
            sha256: manifest.sha256,
            mimeType: manifest.mimeType || 'image/png',
            sizeBytes: manifest.sizeBytes,
            provenanceJson: manifest.provenance,
            metadataJson: manifest.metadata || {},
            createdAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [hermesArtifacts.tenantId, hermesArtifacts.cid],
            set: {
              title: (manifest.metadata?.title as string) || undefined,
              metadataJson: manifest.metadata || {},
            },
          });
      }
    } catch (err) {
      console.error('[CapabilityGrantService] Error registering artifact:', err);
    }
  }

  /**
   * Lists verified IPFS artifacts for a tenant.
   */
  public static async listArtifactsForTenant(tenantId: string): Promise<any[]> {
    const normalizedTenant = tenantId.toLowerCase();
    try {
      if (db) {
        return await db
          .select()
          .from(hermesArtifacts)
          .where(eq(hermesArtifacts.tenantId, normalizedTenant))
          .orderBy(desc(hermesArtifacts.createdAt))
          .limit(50);
      }
    } catch (err) {
      console.warn('[CapabilityGrantService] Error listing artifacts:', err);
    }
    return [];
  }
}

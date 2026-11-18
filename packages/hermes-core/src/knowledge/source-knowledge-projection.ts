/**
 * 🏛️ Pandoras Hermes OS — Source → Knowledge Projection (Phase 6.4 bridge)
 *
 * Deterministic, side-effect free projection of a `knowledge_sources` version into a
 * `hermes_knowledge` governance candidate.
 *
 * Invariants enforced here (do not relax without updating FROZEN_CONTRACTS.md):
 * 1. Classification is NEVER permissive: uploaded tenant documents are
 *    INTERNAL_OPERATIONAL / TENANT_RESTRICTED, so the disclosure lattice excludes them
 *    from public channels (Telegram/WhatsApp ceiling = TENANT_RESTRICTED).
 * 2. Approval is NEVER assumed: status comes from the canonical governance policy
 *    (`KnowledgeDimensionDefinitionRegistry.evaluateAutoApprovalPolicy`), which defaults
 *    to human review.
 * 3. The projection is a bounded excerpt with provenance, NOT a copy of the source of
 *    truth (`knowledge_source_versions`). Full plaintext stays in the version row until
 *    the K25 Phase C IPFS migration lands.
 * 4. The fact key is stable per source, so re-ingestion supersedes instead of forking.
 */

import { KnowledgeDimensionDefinitionRegistry } from './registry';
import type { KnowledgeDimension } from './types';
import { BUSINESS_ENTITY_DIMENSIONS as SHARED_BUSINESS_ENTITY_DIMENSIONS } from '@saasfly/shared';

/**
 * Canonical mapping of `knowledge_sources.type` → `KnowledgeDimension`.
 * Types outside this map are treated as `evidence` (conservative default for an
 * owner-uploaded document).
 */
const SOURCE_TYPE_TO_DIMENSION: Record<string, KnowledgeDimension> = {
  DOCUMENT: 'evidence',
  URL: 'market',
  FAQ: 'offer',
  BUSINESS_INFO: 'business_model',
  BUSINESS_RULE: 'governance',
};

/** Dimensions that describe the business itself (used by Dash "Business Entities"). */
export const BUSINESS_ENTITY_DIMENSIONS: readonly KnowledgeDimension[] = SHARED_BUSINESS_ENTITY_DIMENSIONS;

export const MAX_FACT_EXCERPT_CHARS = 1200;

/** Hard ceiling for a single upload payload (chars). Kept below the 1 MB Server Action body limit. */
export const MAX_KNOWLEDGE_CONTENT_CHARS = 500_000;

export function mapSourceTypeToDimension(type: string | null | undefined): KnowledgeDimension {
  const normalized = (type || 'DOCUMENT').toUpperCase();
  return SOURCE_TYPE_TO_DIMENSION[normalized] ?? 'evidence';
}

/** Stable per-source key: re-ingesting a new version updates the same logical fact. */
export function buildSourceFactKey(sourceId: string): string {
  return `source_${sourceId}`.slice(0, 240);
}

/**
 * Bounded excerpt for human review / context. Collapses whitespace and marks truncation
 * explicitly so nobody mistakes it for the full document.
 */
export function buildFactExcerpt(content: string, maxChars = MAX_FACT_EXCERPT_CHARS): string {
  const collapsed = (content || '').replace(/\s+/g, ' ').trim();
  if (collapsed.length <= maxChars) return collapsed;
  return `${collapsed.slice(0, maxChars)} […]`;
}

export interface SourceProjectionInput {
  tenantId: string;
  sourceId: string;
  sourceType: string | null | undefined;
  sourceVersion: number;
  content: string;
  createdBy?: string | null;
}

export interface SourceProjection {
  dimension: KnowledgeDimension;
  key: string;
  version: number;
  governance: {
    requiresHumanApproval: boolean;
    reason?: string;
  };
  /** Values ready to insert into hermes_knowledge (minus id/timestamps). */
  values: {
    organizationId: string;
    dimension: KnowledgeDimension;
    key: string;
    content: string;
    status: 'ACTIVE' | 'PENDING_REVIEW';
    visibility: 'TENANT_RESTRICTED';
    classification: 'INTERNAL_OPERATIONAL';
    authority: 'TENANT';
    version: number;
    source: 'OWNER_INPUT';
    sourceReference: string;
    createdBy: string;
  };
}

export function buildSourceKnowledgeProjection(input: SourceProjectionInput): SourceProjection {
  const dimension = mapSourceTypeToDimension(input.sourceType);
  const key = buildSourceFactKey(input.sourceId);

  const policy = KnowledgeDimensionDefinitionRegistry.evaluateAutoApprovalPolicy(
    dimension,
    key,
    'OWNER_INPUT'
  );

  const status: 'ACTIVE' | 'PENDING_REVIEW' = policy.requiresHumanApproval
    ? 'PENDING_REVIEW'
    : 'ACTIVE';

  return {
    dimension,
    key,
    version: input.sourceVersion,
    governance: {
      requiresHumanApproval: policy.requiresHumanApproval,
      reason: policy.reason,
    },
    values: {
      organizationId: input.tenantId,
      dimension,
      key,
      content: buildFactExcerpt(input.content),
      status,
      // Fail-closed: a tenant document is never PUBLIC.
      visibility: 'TENANT_RESTRICTED',
      classification: 'INTERNAL_OPERATIONAL',
      authority: 'TENANT',
      version: input.sourceVersion,
      source: 'OWNER_INPUT',
      sourceReference: `knowledge_source:${input.sourceId}#v${input.sourceVersion}`,
      createdBy: input.createdBy?.trim() || 'knowledge_runtime',
    },
  };
}

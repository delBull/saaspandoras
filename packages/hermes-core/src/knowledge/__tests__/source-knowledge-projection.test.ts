/**
 * 🛡️ Source → Knowledge Projection — invariants certification.
 *
 * These tests fail if the projection stops being fail-closed:
 *  - a permissive visibility/classification is reintroduced → disclosure leak;
 *  - the governance policy is bypassed and candidates are auto-approved → governance bypass;
 *  - the fact becomes a full copy of the source instead of a bounded excerpt → K25 parity break.
 */
import { describe, it, expect } from 'vitest';
import {
  buildSourceKnowledgeProjection,
  buildFactExcerpt,
  buildSourceFactKey,
  mapSourceTypeToDimension,
  MAX_FACT_EXCERPT_CHARS,
} from '../source-knowledge-projection';

const baseInput = {
  tenantId: 'tenant_coffree',
  sourceId: 'src_abc123',
  sourceType: 'DOCUMENT',
  sourceVersion: 2,
  content: 'Coffree es una cafetería de especialidad en Monterrey.',
  createdBy: 'session_42',
};

describe('buildSourceKnowledgeProjection — disclosure lattice (fail-closed)', () => {
  it('never emits PUBLIC visibility nor an unclassified tier', () => {
    const projection = buildSourceKnowledgeProjection(baseInput);

    expect(projection.values.visibility).toBe('TENANT_RESTRICTED');
    expect(projection.values.classification).toBe('INTERNAL_OPERATIONAL');
    expect(projection.values.visibility).not.toBe('PUBLIC');
  });

  it('does not claim canonical authority over tenant-uploaded content', () => {
    const projection = buildSourceKnowledgeProjection(baseInput);

    expect(projection.values.authority).toBe('TENANT');
    expect(projection.values.source).toBe('OWNER_INPUT');
    expect(projection.values.organizationId).toBe('tenant_coffree');
  });
});

describe('buildSourceKnowledgeProjection — governance (never auto-approved)', () => {
  it('routes a source fact to PENDING_REVIEW because the canonical policy requires review', () => {
    const projection = buildSourceKnowledgeProjection(baseInput);

    expect(projection.governance.requiresHumanApproval).toBe(true);
    expect(projection.values.status).toBe('PENDING_REVIEW');
  });

  it('keeps PENDING_REVIEW for every canonical source type', () => {
    for (const type of ['DOCUMENT', 'URL', 'FAQ', 'BUSINESS_INFO', 'BUSINESS_RULE', 'UNKNOWN']) {
      const projection = buildSourceKnowledgeProjection({ ...baseInput, sourceType: type });
      expect(projection.values.status, `type ${type}`).toBe('PENDING_REVIEW');
      expect(projection.governance.requiresHumanApproval, `type ${type}`).toBe(true);
    }
  });
});

describe('buildSourceKnowledgeProjection — K25 projection (not a copy)', () => {
  it('stores a bounded excerpt and an explicit source reference', () => {
    const longContent = `Coffree ${'café de especialidad '.repeat(400)}`;
    const projection = buildSourceKnowledgeProjection({ ...baseInput, content: longContent });

    expect(projection.values.content.length).toBeLessThanOrEqual(MAX_FACT_EXCERPT_CHARS + 4);
    expect(projection.values.content.endsWith('[…]')).toBe(true);
    expect(projection.values.sourceReference).toBe('knowledge_source:src_abc123#v2');
    expect(projection.values.version).toBe(2);
  });

  it('collapses whitespace in the excerpt', () => {
    const projection = buildSourceKnowledgeProjection({
      ...baseInput,
      content: 'linea uno\n\n\nlinea   dos\ttres',
    });

    expect(projection.values.content).toBe('linea uno linea dos tres');
  });

  it('buildFactExcerpt never truncates silently', () => {
    const exact = 'a'.repeat(MAX_FACT_EXCERPT_CHARS);
    expect(buildFactExcerpt(exact)).toBe(exact);

    const overflow = `${exact}b`;
    expect(buildFactExcerpt(overflow)).toBe(`${exact} […]`);
  });
});

describe('buildSourceKnowledgeProjection — dimension mapping & key stability', () => {
  it('maps each canonical source type to a canonical dimension', () => {
    expect(mapSourceTypeToDimension('DOCUMENT')).toBe('evidence');
    expect(mapSourceTypeToDimension('URL')).toBe('market');
    expect(mapSourceTypeToDimension('FAQ')).toBe('offer');
    expect(mapSourceTypeToDimension('BUSINESS_INFO')).toBe('business_model');
    expect(mapSourceTypeToDimension('BUSINESS_RULE')).toBe('governance');
  });

  it('falls back to a conservative dimension for unknown types', () => {
    expect(mapSourceTypeToDimension('PDF')).toBe('evidence');
    expect(mapSourceTypeToDimension(null)).toBe('evidence');
    expect(mapSourceTypeToDimension(undefined)).toBe('evidence');
  });

  it('derives a stable key so re-ingestion supersedes instead of forking', () => {
    expect(buildSourceFactKey('src_abc123')).toBe('source_src_abc123');
    expect(buildSourceFactKey('src_abc123')).toBe(buildSourceFactKey('src_abc123'));

    const longId = 'x'.repeat(400);
    expect(buildSourceFactKey(longId).length).toBe(240);
  });

  it('exposes the dimension and key used by the persistence layer', () => {
    const projection = buildSourceKnowledgeProjection({
      ...baseInput,
      sourceType: 'BUSINESS_RULE',
    });

    expect(projection.dimension).toBe('governance');
    expect(projection.key).toBe('source_src_abc123');
    expect(projection.values.key).toBe(projection.key);
  });
});

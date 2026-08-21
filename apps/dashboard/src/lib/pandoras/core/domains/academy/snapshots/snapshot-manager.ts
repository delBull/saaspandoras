/**
 * 🧊 Pandora's Academy — Knowledge Snapshot Manager
 * apps/dashboard/src/lib/pandoras/core/domains/academy/snapshots/snapshot-manager.ts
 *
 * Freezes the exact version of the training and reference knowledge when an assessment attempt begins.
 * Guarantees that historical exam results remain 100% auditable and immutable even if documentation evolves.
 */

import { createHash } from 'crypto';
import { AcademyKnowledgeSnapshot, KnowledgeDocumentRef } from '../types';
import { CANONICAL_KNOWLEDGE_DOCS } from '../curriculum/knowledge-sources';

export class KnowledgeSnapshotManager {
  /**
   * Creates an immutable snapshot for a given list of document IDs.
   */
  static createSnapshot(docIds: string[]): AcademyKnowledgeSnapshot {
    const docs: KnowledgeDocumentRef[] = [];

    for (const id of docIds) {
      const doc = CANONICAL_KNOWLEDGE_DOCS[id];
      if (doc) {
        docs.push({ ...doc });
      }
    }

    // Deterministic snapshot hash combining all document hashes
    const combinedContent = docs.map(d => `${d.docId}:${d.version}:${d.contentHash}`).join('|');
    const snapshotHash = createHash('sha256').update(combinedContent).digest('hex');

    return {
      id: `snap_${snapshotHash.substring(0, 16)}_${Date.now()}`,
      snapshotHash,
      sourceDocuments: docs,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Creates a full snapshot of all canonical knowledge documents.
   */
  static createFullProgramSnapshot(): AcademyKnowledgeSnapshot {
    return this.createSnapshot(Object.keys(CANONICAL_KNOWLEDGE_DOCS));
  }

  /**
   * Formats a snapshot into structured reference text for Hermes reasoning.
   */
  static formatSnapshotForReasoning(snapshot: AcademyKnowledgeSnapshot): string {
    return snapshot.sourceDocuments.map(doc => {
      return `=== [DOCUMENTO OFICIAL: ${doc.title} (v${doc.version})] ===\nHash: ${doc.contentHash}\n\n${doc.fullContent}`;
    }).join('\n\n');
  }
}

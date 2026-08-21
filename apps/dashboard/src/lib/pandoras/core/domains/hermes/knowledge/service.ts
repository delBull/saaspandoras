import {
  GovernedKnowledgeItem,
  KnowledgeDimension,
  KnowledgeVisibility,
  KnowledgeAuthority,
  KnowledgeSource,
  ControlPlaneContext,
  KnowledgeMutationEvent,
  KnowledgeStatus
} from './types';
import { db } from '@/db';
import { hermesKnowledge, hermesGovernanceAudit } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class KnowledgeGovernanceService {
  
  // --- CORE COMMANDS ---

  /**
   * Hermes discovers new knowledge.
   */
  static async discover(
    context: ControlPlaneContext,
    payload: {
      dimension: KnowledgeDimension;
      key: string;
      content: string;
      visibility: KnowledgeVisibility;
      source: KnowledgeSource;
      sourceReference?: string;
      status?: KnowledgeStatus;
    }
  ): Promise<GovernedKnowledgeItem> {
    if (!['OWNER', 'ADMIN', 'SYSTEM'].includes(context.role)) {
      throw new Error(`Unauthorized: Role ${context.role} cannot discover knowledge.`);
    }

    const id = `k_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const createdAt = new Date();
    const initialStatus = payload.status || 'DISCOVERED';
    
    await db.insert(hermesKnowledge).values({
      id,
      organizationId: context.organizationId,
      dimension: payload.dimension,
      key: payload.key,
      content: payload.content,
      status: initialStatus,
      visibility: payload.visibility,
      authority: 'DISCOVERED',
      version: 1,
      source: payload.source,
      sourceReference: payload.sourceReference || null,
      createdBy: context.actorId,
      createdAt,
      updatedAt: createdAt
    });

    await this.appendAuditTx(db, {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      organizationId: context.organizationId,
      knowledgeId: id,
      version: 1,
      action: 'DISCOVER',
      actorId: context.actorId,
      actorType: context.role === 'SYSTEM' ? 'SYSTEM' : 'USER',
      timestamp: createdAt,
      newStatus: initialStatus,
      reason: initialStatus === 'ACTIVE' ? 'Auto-approved by policy' : undefined
    });

    return await this.getKnowledgeByIdTx(db, id);
  }

  /**
   * Approves a DISCOVERED or PENDING_REVIEW item.
   * If it supersedes an old item, atomic transition is applied.
   */
  static async approveKnowledge(
    context: ControlPlaneContext,
    knowledgeId: string,
    expectedVersion: number
  ): Promise<GovernedKnowledgeItem> {
    const item = await this.getKnowledgeByIdTx(db, knowledgeId);
    
    if (!item) throw new Error("KnowledgeItem not found");

    if (item.scope.organizationId !== context.organizationId) {
      throw new Error("Cross-tenant attack detected! Access denied.");
    }

    if (item.scope.dimension === 'governance' && context.role === 'SYSTEM') {
      throw new Error("Governance knowledge cannot be self-approved by the system.");
    }
    
    if (!['OWNER', 'ADMIN'].includes(context.role)) {
      throw new Error("Unauthorized: Insufficient permissions to approve knowledge.");
    }

    if (item.lifecycle.version !== expectedVersion) {
      throw new Error(`Optimistic concurrency failure: expected version ${expectedVersion}, got ${item.lifecycle.version}`);
    }

    if (item.lifecycle.status === 'ACTIVE') {
      throw new Error("Invalid transition: Item is already ACTIVE.");
    }
    if (item.lifecycle.status === 'REJECTED') {
      throw new Error("Invalid transition: Cannot approve a REJECTED item directly.");
    }
    if (item.lifecycle.status === 'SUPERSEDED') {
      throw new Error("Invalid transition: Cannot approve a SUPERSEDED item.");
    }

    const oldStatus = item.lifecycle.status;
    const timestamp = new Date();

    if (item.lifecycle.supersedesId) {
      const oldItem = await this.getKnowledgeByIdTx(db, item.lifecycle.supersedesId);
      if (oldItem && oldItem.scope.organizationId === context.organizationId && oldItem.lifecycle.status === 'ACTIVE') {
        const oldItemPreviousStatus = oldItem.lifecycle.status;
        
        await db.update(hermesKnowledge)
          .set({ status: 'SUPERSEDED', updatedAt: timestamp })
          .where(eq(hermesKnowledge.id, oldItem.id));
          
        await this.appendAuditTx(db, {
          eventId: `evt_${Date.now()}_sup_${Math.random().toString(36).substring(7)}`,
          organizationId: context.organizationId,
          knowledgeId: oldItem.id,
          version: oldItem.lifecycle.version,
          action: 'SUPERSEDE',
          actorId: context.actorId,
          actorType: 'USER',
          timestamp,
          previousStatus: oldItemPreviousStatus,
          newStatus: 'SUPERSEDED',
          reason: `Superseded by ${item.id}`
        });
      }
    }

    // 8. Mutation
    await db.update(hermesKnowledge)
      .set({ 
        status: 'ACTIVE', 
        authority: 'CANONICAL', 
        updatedAt: timestamp 
      })
      .where(eq(hermesKnowledge.id, item.id));

    // 9. Audit
    await this.appendAuditTx(db, {
      eventId: `evt_${Date.now()}_app_${Math.random().toString(36).substring(7)}`,
      organizationId: context.organizationId,
      knowledgeId: item.id,
      version: item.lifecycle.version,
      action: 'APPROVE',
      actorId: context.actorId,
      actorType: 'USER',
      timestamp,
      previousStatus: oldStatus,
      newStatus: 'ACTIVE'
    });

    return await this.getKnowledgeByIdTx(db, item.id);
  }

  /**
   * Rejects a DISCOVERED or PENDING_REVIEW item.
   */
  static async rejectKnowledge(
    context: ControlPlaneContext,
    knowledgeId: string,
    reason: string
  ): Promise<GovernedKnowledgeItem> {
    const item = await this.getKnowledgeByIdTx(db, knowledgeId);
    if (!item) throw new Error("KnowledgeItem not found");
    if (item.scope.organizationId !== context.organizationId) {
      throw new Error("Cross-tenant attack detected!");
    }
    if (!['OWNER', 'ADMIN'].includes(context.role)) {
      throw new Error("Unauthorized.");
    }

    if (item.lifecycle.status === 'ACTIVE' || item.lifecycle.status === 'SUPERSEDED') {
      throw new Error("Invalid transition: Cannot reject ACTIVE or SUPERSEDED items.");
    }

    const oldStatus = item.lifecycle.status;
    const timestamp = new Date();
    
    await db.update(hermesKnowledge)
      .set({ status: 'REJECTED', updatedAt: timestamp })
      .where(eq(hermesKnowledge.id, item.id));

    await this.appendAuditTx(db, {
      eventId: `evt_${Date.now()}_rej_${Math.random().toString(36).substring(7)}`,
      organizationId: context.organizationId,
      knowledgeId: item.id,
      version: item.lifecycle.version,
      action: 'REJECT',
      actorId: context.actorId,
      actorType: 'USER',
      timestamp,
      previousStatus: oldStatus,
      newStatus: 'REJECTED',
      reason
    });

    return await this.getKnowledgeByIdTx(db, item.id);
  }

  /**
   * Edits an ACTIVE item. This does NOT mutate the active item in place.
   * It creates a NEW version in PENDING_REVIEW state that supersedes the old one.
   */
  static async editKnowledge(
    context: ControlPlaneContext,
    activeKnowledgeId: string,
    newContent: string
  ): Promise<GovernedKnowledgeItem> {
    const oldItem = await this.getKnowledgeByIdTx(db, activeKnowledgeId);
    if (!oldItem) throw new Error("KnowledgeItem not found");
    if (oldItem.scope.organizationId !== context.organizationId) {
      throw new Error("Cross-tenant attack detected!");
    }
    if (oldItem.lifecycle.status !== 'ACTIVE') {
      throw new Error("Can only edit ACTIVE items.");
    }

    const id = `k_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const timestamp = new Date();

    await db.insert(hermesKnowledge).values({
      id,
      organizationId: oldItem.scope.organizationId,
      dimension: oldItem.scope.dimension,
      key: oldItem.content.key,
      content: newContent,
      status: 'PENDING_REVIEW',
      visibility: oldItem.governance.visibility,
      authority: 'DISCOVERED',
      version: oldItem.lifecycle.version + 1,
      source: oldItem.governance.source,
      sourceReference: oldItem.governance.sourceReference || null,
      createdBy: context.actorId,
      supersedesId: oldItem.id,
      createdAt: timestamp,
      updatedAt: timestamp
    });

    await this.appendAuditTx(db, {
      eventId: `evt_${Date.now()}_edit_${Math.random().toString(36).substring(7)}`,
      organizationId: context.organizationId,
      knowledgeId: id,
      version: oldItem.lifecycle.version + 1,
      action: 'SUBMIT_FOR_REVIEW',
      actorId: context.actorId,
      actorType: 'USER',
      timestamp,
      newStatus: 'PENDING_REVIEW',
      reason: `Edit of ${oldItem.id}`
    });

    return await this.getKnowledgeByIdTx(db, id);
  }

  // --- QUERY METHODS ---

  static async getKnowledgeByStatus(tenantId: string, status: KnowledgeStatus): Promise<GovernedKnowledgeItem[]> {
    const rows = await db.select().from(hermesKnowledge)
      .where(and(eq(hermesKnowledge.organizationId, tenantId), eq(hermesKnowledge.status, status)));
    return rows.map(this.mapRowToDomain);
  }

  static async getAuditTrail(tenantId: string): Promise<KnowledgeMutationEvent[]> {
    const rows = await db.select().from(hermesGovernanceAudit)
      .where(eq(hermesGovernanceAudit.organizationId, tenantId))
      .orderBy(sql`${hermesGovernanceAudit.createdAt} DESC`);
      
    return rows.map(r => ({
      eventId: r.id,
      organizationId: r.organizationId,
      knowledgeId: r.knowledgeId,
      version: r.version,
      action: r.eventType as any,
      actorId: r.actorId,
      actorType: r.actorType as any,
      timestamp: r.createdAt,
      previousStatus: r.oldStatus as KnowledgeStatus || undefined,
      newStatus: r.newStatus as KnowledgeStatus,
      reason: r.reason || undefined,
      metadata: r.metadata as any
    }));
  }

  static async getExclusionRegister(tenantId: string): Promise<GovernedKnowledgeItem[]> {
    const rows = await db.select().from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.organizationId, tenantId),
          sql`${hermesKnowledge.status} IN ('SUPERSEDED', 'REJECTED')`
        )
      );
    return rows.map(this.mapRowToDomain);
  }

  // --- PRIVATE UTILS ---

  private static async appendAuditTx(tx: any, event: KnowledgeMutationEvent) {
    await tx.insert(hermesGovernanceAudit).values({
      id: event.eventId,
      organizationId: event.organizationId,
      knowledgeId: event.knowledgeId,
      version: event.version,
      eventType: event.action,
      actorId: event.actorId,
      actorType: event.actorType,
      oldStatus: event.previousStatus || null,
      newStatus: event.newStatus,
      reason: event.reason || null,
      metadata: event.metadata || null,
      createdAt: event.timestamp
    });
  }

  private static async getKnowledgeByIdTx(tx: any, id: string): Promise<GovernedKnowledgeItem> {
    const rows = await tx.select().from(hermesKnowledge).where(eq(hermesKnowledge.id, id));
    if (rows.length === 0) throw new Error(`Knowledge with ID ${id} not found.`);
    return this.mapRowToDomain(rows[0]);
  }

  private static mapRowToDomain(row: any): GovernedKnowledgeItem {
    return {
      id: row.id,
      scope: {
        organizationId: row.organizationId,
        dimension: row.dimension as KnowledgeDimension
      },
      content: {
        key: row.key,
        content: row.content
      },
      governance: {
        visibility: row.visibility as KnowledgeVisibility,
        authority: row.authority as KnowledgeAuthority,
        source: row.source as KnowledgeSource,
        sourceReference: row.sourceReference || undefined
      },
      lifecycle: {
        status: row.status as KnowledgeStatus,
        version: row.version,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        effectiveAt: row.status === 'ACTIVE' ? row.updatedAt : undefined,
        supersedesId: row.supersedesId || undefined
      },
      audit: {
        discoveredBy: row.createdBy,
        // Since we don't store reviewedBy in knowledge table, we could fetch it from audit if needed,
        // but for now we leave it undefined in the mapped domain model unless we join.
      }
    };
  }

  // For testing purposes only (Dangerous, do not expose to actions!)
  static async _resetDB() {
    await db.delete(hermesGovernanceAudit).where(sql`1=1`);
    await db.delete(hermesKnowledge).where(sql`1=1`);
  }
}

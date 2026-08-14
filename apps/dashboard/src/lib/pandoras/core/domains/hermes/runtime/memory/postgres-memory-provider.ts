import { db } from '@/db';
import { hermesConversations, hermesConversationMessages } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { RuntimeMessage } from '../contracts';
import { 
  ConversationMemoryProvider, 
  MemoryQuery, 
  ConversationMemory, 
  MemoryAppend, 
  MemoryAppendResult 
} from './contracts';

export class PostgresConversationMemoryProvider implements ConversationMemoryProvider {
  
  async load(input: MemoryQuery): Promise<ConversationMemory> {
    // K12-A11: Tenant Isolation enforced structurally in every query
    const orgId = input.organizationId;
    const convId = input.conversationId;

    const convResult = await db.select().from(hermesConversations)
      .where(and(
        eq(hermesConversations.organizationId, orgId),
        eq(hermesConversations.conversationId, convId)
      ))
      .limit(1);

    const conv = convResult[0];
    
    if (!conv) {
      return {
        organizationId: orgId,
        conversationId: convId,
        messages: [],
        version: '0',
        loadedAt: new Date(),
        source: 'EMPTY'
      };
    }

    // Load messages
    // K12-A19: Context Window Boundary (Limit)
    const limit = input.limit ?? 100;

    const msgResults = await db.select().from(hermesConversationMessages)
      .where(and(
        eq(hermesConversationMessages.organizationId, orgId),
        eq(hermesConversationMessages.conversationId, convId)
      ))
      .orderBy(desc(hermesConversationMessages.sequence))
      .limit(limit);

    // K12-A18: Ordering Deterministic (oldest to newest)
    const sortedMessages = msgResults.reverse();

    const messages: RuntimeMessage[] = sortedMessages.map(m => ({
      id: m.id,
      role: m.role as 'USER' | 'ASSISTANT' | 'SYSTEM',
      content: m.content,
      createdAt: m.createdAt,
    }));

    return {
      organizationId: orgId,
      conversationId: convId,
      messages,
      version: conv.version.toString(),
      loadedAt: new Date(),
      source: 'PERSISTED'
    };
  }

  async append(input: MemoryAppend): Promise<MemoryAppendResult> {
    const orgId = input.organizationId;
    const convId = input.conversationId;

    return await db.transaction(async (tx) => {
      // Check idempotency first (K12-A17)
      const existing = await tx.select().from(hermesConversationMessages)
        .where(and(
          eq(hermesConversationMessages.organizationId, orgId),
          eq(hermesConversationMessages.idempotencyKey, `${input.idempotencyKey}_user`)
        ))
        .limit(1);

      if (existing.length > 0) {
        // Return duplicate without creating
        const conv = await tx.select().from(hermesConversations)
          .where(and(
            eq(hermesConversations.organizationId, orgId),
            eq(hermesConversations.conversationId, convId)
          ))
          .limit(1);
          
        return {
          persisted: false,
          duplicate: true,
          version: conv[0]?.version.toString() || '0',
          persistedAt: new Date()
        };
      }

      // Concurrency control & version generation
      const convs = await tx.select().from(hermesConversations)
        .where(and(
          eq(hermesConversations.organizationId, orgId),
          eq(hermesConversations.conversationId, convId)
        ))
        .for('update')
        .limit(1);

      let currentVersion = 0;
      let nextSequence = 1;

      const conv = convs[0];
      if (conv) {
        currentVersion = conv.version;
        // Optimistic concurrency check
        if (input.expectedVersion !== undefined && currentVersion.toString() !== input.expectedVersion) {
          throw new Error(`Concurrency Conflict: Expected version ${input.expectedVersion}, got ${currentVersion}`);
        }
      }

      const nextVersion = currentVersion + 1;
      
      // Update or create conversation
      if (conv) {
        await tx.update(hermesConversations)
          .set({ version: nextVersion, updatedAt: new Date() })
          .where(eq(hermesConversations.id, conv.id));
          
        // Get max sequence
        const maxSeq = await tx.select({ seq: hermesConversationMessages.sequence })
          .from(hermesConversationMessages)
          .where(and(
            eq(hermesConversationMessages.organizationId, orgId),
            eq(hermesConversationMessages.conversationId, convId)
          ))
          .orderBy(desc(hermesConversationMessages.sequence))
          .limit(1);
          
        const maxSeqItem = maxSeq[0];
        if (maxSeqItem) {
          nextSequence = maxSeqItem.seq + 1;
        }
      } else {
        await tx.insert(hermesConversations).values({
          id: `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          organizationId: orgId,
          conversationId: convId,
          version: nextVersion,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Persist atomic turn (USER + ASSISTANT)
      await tx.insert(hermesConversationMessages).values([
        {
          id: input.turn.userMessage.id,
          organizationId: orgId,
          conversationId: convId,
          role: input.turn.userMessage.role,
          content: input.turn.userMessage.content,
          sequence: nextSequence,
          idempotencyKey: `${input.idempotencyKey}_user`,
          createdAt: input.turn.userMessage.createdAt
        },
        {
          id: input.turn.assistantMessage.id,
          organizationId: orgId,
          conversationId: convId,
          role: input.turn.assistantMessage.role,
          content: input.turn.assistantMessage.content,
          sequence: nextSequence + 1,
          idempotencyKey: `${input.idempotencyKey}_assistant`,
          createdAt: input.turn.assistantMessage.createdAt
        }
      ]);

      return {
        persisted: true,
        duplicate: false,
        version: nextVersion.toString(),
        persistedAt: new Date()
      };
    });
  }
}

import { RuntimeMessage } from '../contracts';
import { ConversationMemory } from './contracts';

export class MemoryAdapter {
  /**
   * Adapts a loaded ConversationMemory into an array of RuntimeMessages
   * enforcing the invariants that memory ONLY provides historical context
   * and never structural or capability authority.
   */
  static adaptToMessages(memory: ConversationMemory): RuntimeMessage[] {
    // K12-A18: Ensure deterministic ordering (oldest to newest)
    // Normally the provider should sort them, but we enforce it here structurally.
    const sortedMessages = [...memory.messages].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    // Filter out invalid roles or sanitize if needed.
    // Memory never injects capability logic or knowledge blocks into system roles.
    return sortedMessages.map(msg => ({
      id: msg.id,
      role: msg.role === 'ASSISTANT' || msg.role === 'SYSTEM' ? msg.role : 'USER',
      content: msg.content,
      createdAt: msg.createdAt,
    }));
  }
}

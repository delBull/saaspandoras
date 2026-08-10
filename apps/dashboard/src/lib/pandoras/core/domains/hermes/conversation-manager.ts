import { ConversationMessage } from './contracts';

export interface ConversationState {
  id: string; // Session ID or User-Channel mapping
  history: ConversationMessage[];
  pendingVariables: Record<string, string | null>;
  activeIntent?: string;
  contextData: Record<string, any>;
  lastUpdated: number;
}

export interface IConversationManager {
  getOrCreateState(userId: string, channelId: string): Promise<ConversationState>;
  appendMessage(stateId: string, message: ConversationMessage): Promise<void>;
  updateState(stateId: string, updates: Partial<ConversationState>): Promise<void>;
  clearState(stateId: string): Promise<void>;
}

/**
 * MVP de Manejador Conversacional en Memoria.
 * En producción usaría Redis u otro store rápido.
 */
export class DefaultConversationManager implements IConversationManager {
  private memory = new Map<string, ConversationState>();

  private generateStateId(userId: string, channelId: string): string {
    return `${channelId}:${userId}`;
  }

  async getOrCreateState(userId: string, channelId: string): Promise<ConversationState> {
    const id = this.generateStateId(userId, channelId);
    if (!this.memory.has(id)) {
      this.memory.set(id, {
        id,
        history: [],
        pendingVariables: {},
        contextData: {},
        lastUpdated: Date.now()
      });
    }
    return this.memory.get(id)!;
  }

  async appendMessage(stateId: string, message: ConversationMessage): Promise<void> {
    const state = this.memory.get(stateId);
    if (state) {
      state.history.push(message);
      state.lastUpdated = Date.now();
    }
  }

  async updateState(stateId: string, updates: Partial<ConversationState>): Promise<void> {
    const state = this.memory.get(stateId);
    if (state) {
      Object.assign(state, updates);
      state.lastUpdated = Date.now();
    }
  }

  async clearState(stateId: string): Promise<void> {
    this.memory.delete(stateId);
  }
}

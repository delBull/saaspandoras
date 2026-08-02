export interface WorkingMemory {
  chatId: string;
  history: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  ttlSeconds: number;
}

export interface LongTermMemoryFact {
  key: string;
  value: any;
  category: 'preference' | 'intent' | 'objection' | 'wallet' | 'budget';
  timestamp: number;
}

export interface MemoryProvider {
  getWorkingMemory(chatId: string): Promise<WorkingMemory | null>;
  saveWorkingMemory(chatId: string, memory: WorkingMemory): Promise<void>;
  rememberFact(leadId: string, fact: Omit<LongTermMemoryFact, 'timestamp'>): Promise<void>;
  recallFacts(leadId: string): Promise<LongTermMemoryFact[]>;
}

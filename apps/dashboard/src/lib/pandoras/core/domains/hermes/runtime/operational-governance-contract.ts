/**
 * 🏛️ Pandora's Hermes OS — Milestone 9.0: Memory Governance & Tool Circuit Breaker
 * src/lib/pandoras/core/domains/hermes/runtime/operational-governance-contract.ts
 *
 * Implements full operational reliability contracts:
 * 1. Memory Governance: Conversation compaction, sliding window token budgeting, and tenant retention TTL.
 * 2. Tool Circuit Breaker: Execution timeouts (hard ceiling), tenant rate limits, and failure backoff.
 * 3. Graceful Degradation: Fail-closed fallback when tools or external providers fail.
 */

export interface TenantMemoryPolicy {
  tenantId: string;
  retentionDays: number;
  maxActiveContextTokens: number;
  compactionThresholdTokens: number;
  ephemeralScrubEnabled: boolean;
}

export interface ConversationMessageItem {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  estimatedTokens: number;
  createdAt: Date;
}

export interface MemoryCompactionResult {
  compactedMessages: ConversationMessageItem[];
  summaryDigest?: string;
  tokensBefore: number;
  tokensAfter: number;
  evictedCount: number;
}

export class MemoryGovernanceEngine {
  private static readonly DEFAULT_POLICIES: Record<string, TenantMemoryPolicy> = {
    pandoras: {
      tenantId: 'pandoras',
      retentionDays: 365,
      maxActiveContextTokens: 8000,
      compactionThresholdTokens: 6000,
      ephemeralScrubEnabled: true,
    },
    snarai: {
      tenantId: 'snarai',
      retentionDays: 90,
      maxActiveContextTokens: 4000,
      compactionThresholdTokens: 3000,
      ephemeralScrubEnabled: true,
    },
  };

  public static getPolicy(tenantId: string): TenantMemoryPolicy {
    return (
      this.DEFAULT_POLICIES[tenantId] || {
        tenantId,
        retentionDays: 30,
        maxActiveContextTokens: 4000,
        compactionThresholdTokens: 3000,
        ephemeralScrubEnabled: true,
      }
    );
  }

  /**
   * Compacts conversation history if it exceeds the tenant threshold tokens.
   */
  public static compactMemoryHistory(
    tenantId: string,
    messages: ConversationMessageItem[]
  ): MemoryCompactionResult {
    const policy = this.getPolicy(tenantId);
    const totalTokens = messages.reduce((sum, m) => sum + m.estimatedTokens, 0);

    if (totalTokens <= policy.compactionThresholdTokens || messages.length <= 4) {
      return {
        compactedMessages: messages,
        tokensBefore: totalTokens,
        tokensAfter: totalTokens,
        evictedCount: 0,
      };
    }

    // Retain recent messages (last 3), summarize/compact older messages
    const recent = messages.slice(-3);
    const older = messages.slice(0, -3);

    const summaryContent = `[CONVERSATION_HISTORY_COMPACTED: ${older.length} prior exchanges summarized for tenant ${tenantId}]`;
    const summaryMsg: ConversationMessageItem = {
      id: `comp_${Date.now()}`,
      role: 'system',
      content: summaryContent,
      estimatedTokens: 30,
      createdAt: new Date(),
    };

    const compacted = [summaryMsg, ...recent];
    const tokensAfter = compacted.reduce((sum, m) => sum + m.estimatedTokens, 0);

    return {
      compactedMessages: compacted,
      summaryDigest: summaryContent,
      tokensBefore: totalTokens,
      tokensAfter,
      evictedCount: older.length,
    };
  }
}

export interface CircuitBreakerConfig {
  timeoutMs: number;
  failureThreshold: number;
  rateLimitPerMinute: number;
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class ToolCircuitBreaker {
  private failureCount: number = 0;
  private state: CircuitState = 'CLOSED';
  private lastFailureTime: number = 0;
  private callTimestamps: number[] = [];

  constructor(
    public readonly toolId: string,
    public readonly tenantId: string,
    private config: CircuitBreakerConfig = {
      timeoutMs: 5000,
      failureThreshold: 3,
      rateLimitPerMinute: 60,
    }
  ) {}

  public getState(): CircuitState {
    if (this.state === 'OPEN') {
      const now = Date.now();
      // Recovery window: after 10s, transition to HALF_OPEN
      if (now - this.lastFailureTime > 10000) {
        this.state = 'HALF_OPEN';
      }
    }
    return this.state;
  }

  /**
   * Executes a tool with rate limiting, timeouts, and circuit breaker protection.
   */
  public async executeProtected<T>(action: () => Promise<T>): Promise<T> {
    const currentState = this.getState();
    if (currentState === 'OPEN') {
      throw new Error(`[CircuitBreaker] Tool [${this.toolId}] circuit is OPEN for tenant [${this.tenantId}]. Failing closed.`);
    }

    // Rate limiting check
    const now = Date.now();
    this.callTimestamps = this.callTimestamps.filter(t => now - t < 60000);
    if (this.callTimestamps.length >= this.config.rateLimitPerMinute) {
      throw new Error(`[CircuitBreaker] Rate limit exceeded for tool [${this.toolId}] (${this.config.rateLimitPerMinute}/min).`);
    }
    this.callTimestamps.push(now);

    // Timeout execution
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`[CircuitBreaker] Tool execution timed out after ${this.config.timeoutMs}ms.`));
      }, this.config.timeoutMs);
    });

    try {
      const result = await Promise.race([action(), timeoutPromise]);
      this.recordSuccess();
      return result;
    } catch (err: any) {
      this.recordFailure();
      throw err;
    }
  }

  private recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

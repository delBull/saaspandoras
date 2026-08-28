import { describe, it, expect } from 'vitest';
import { A2AMessage } from '../contracts';
import { A2ASecurityValidator } from '../a2a-security-validator';
import { A2AMessageHandler } from '../a2a-message-handler';
import { AgentRegistry } from '../agent-registry';

describe('🏛️ PANDORAS A2A PROTOCOL v1.0 Suite (Sofía ↔ Hermes Bridge)', () => {
  it('1. Agent Registry holds independent identities and capability grants for Sofia and Hermes', () => {
    const sofia = AgentRegistry.getAgent('sofia');
    const hermes = AgentRegistry.getAgent('hermes');

    expect(sofia).toBeDefined();
    expect(sofia?.role).toBe('CHIEF_OF_STAFF');
    expect(hermes).toBeDefined();
    expect(hermes?.role).toBe('COGNITIVE_OS');

    // Different sovereign wallets
    expect(sofia?.walletAddress.toLowerCase()).not.toBe(hermes?.walletAddress.toLowerCase());

    // Capability check
    expect(AgentRegistry.hasCapability('sofia', 'hermes.knowledge.query')).toBe(true);
    expect(AgentRegistry.hasCapability('sofia', 'hermes.escalation.create')).toBe(true);
    expect(AgentRegistry.hasCapability('sofia', 'unauthorized.capability')).toBe(false);
  });

  it('2. Rejects message from unregistered / unauthorized sender', () => {
    const fakeMessage: A2AMessage = {
      protocol: 'pandoras-a2a',
      version: '1.0',
      messageId: `msg_${Date.now()}`,
      from: 'unknown_agent' as any,
      to: 'hermes',
      type: 'knowledge.query',
      createdAt: new Date().toISOString(),
      nonce: `nonce_${Date.now()}`,
      payload: {},
      security: {
        signature: 'mock_sig',
        signatureScheme: 'EIP191',
        hmac: 'mock_hmac',
      },
    };

    const res = A2ASecurityValidator.validate(fakeMessage);
    expect(res.valid).toBe(false);
    expect(res.errorCode).toBe('UNAUTHORIZED_SENDER');
  });

  it('3. Rejects replayed nonce on second processing attempt', () => {
    const nonce = `test_replay_nonce_${Date.now()}`;
    const message: A2AMessage = {
      protocol: 'pandoras-a2a',
      version: '1.0',
      messageId: `msg_1_${Date.now()}`,
      from: 'sofia',
      to: 'hermes',
      type: 'status.query',
      createdAt: new Date().toISOString(),
      nonce,
      payload: {},
      security: {
        signature: 'mock_sig',
        signatureScheme: 'EIP191',
        hmac: 'mock_hmac',
      },
    };

    const first = A2ASecurityValidator.validate(message);
    expect(first.valid).toBe(true);

    const second = A2ASecurityValidator.validate(message);
    expect(second.valid).toBe(false);
    expect(second.errorCode).toBe('NONCE_REPLAY');
  });

  it('4. Handles knowledge.query from Sofía and returns verified tenant claims', async () => {
    const message: A2AMessage = {
      protocol: 'pandoras-a2a',
      version: '1.0',
      messageId: `msg_query_${Date.now()}`,
      from: 'sofia',
      to: 'hermes',
      type: 'knowledge.query',
      createdAt: new Date().toISOString(),
      nonce: `nonce_query_${Date.now()}`,
      payload: { tenantId: 'snarai' },
      security: {
        signature: 'mock_sig',
        signatureScheme: 'EIP191',
        hmac: 'mock_hmac',
      },
    };

    const res = await A2AMessageHandler.processIncomingMessage(message);
    expect(res.success).toBe(true);
    expect(res.type).toBe('knowledge.response');
    expect(res.payload).toBeDefined();
    expect((res.payload as any).tenantId).toBe('snarai');
    expect((res.payload as any).claims.length).toBeGreaterThan(0);
  });

  it('5. Handles event.escalation from Sofía and registers sovereign audit trail', async () => {
    const message: A2AMessage = {
      protocol: 'pandoras-a2a',
      version: '1.0',
      messageId: `msg_esc_${Date.now()}`,
      from: 'sofia',
      to: 'hermes',
      type: 'event.escalation',
      createdAt: new Date().toISOString(),
      nonce: `nonce_esc_${Date.now()}`,
      payload: {
        summary: 'Oscar / ELD Pilot VIP investor consultation required',
        priority: 'high',
        organizationId: 'pandoras',
      },
      security: {
        signature: 'mock_sig',
        signatureScheme: 'EIP191',
        hmac: 'mock_hmac',
      },
    };

    const res = await A2AMessageHandler.processIncomingMessage(message);
    expect(res.success).toBe(true);
    expect((res.payload as any).status).toBe('ESCALATION_RECORDED');
  });
});

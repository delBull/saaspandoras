import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ControlPlane } from '../ControlPlane';
import { db } from '@saasfly/db-core';


describe('🛡️ Fase A (P0) Adversarial Security Gates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ControlPlane.resolveAdminContext', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('ATTACK 01: Rejects missing identity (null/empty)', async () => {
      await expect(ControlPlane.resolveAdminContext('')).rejects.toThrow('Unauthorized: No identity provided');
    });

    it('ATTACK 02: Rejects non-existent identity (spoofing unregistered wallet)', async () => {
      // Simulate DB returning no user
      // @ts-ignore
      vi.spyOn(db, 'select').mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([])
          })
        })
      } as any);
      
      await expect(ControlPlane.resolveAdminContext('0xGhostWallet')).rejects.toThrow('Unauthorized: Identity not found in canonical directory');
    });

    it('ATTACK 03: Rejects identity with revoked/locked session (Bound Session enforcement)', async () => {
      // Simulate DB returning a user but with SUSPENDED status
      // @ts-ignore
      vi.spyOn(db, 'select').mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: '123',
              walletAddress: '0xAttacker',
              status: 'SUSPENDED',
              role: 'ADMIN'
            }])
          })
        })
      } as any);
      
      await expect(ControlPlane.resolveAdminContext('0xAttacker')).rejects.toThrow('Unauthorized: Identity session is locked or revoked. Status: SUSPENDED');
    });

    it('ATTACK 04: Allows identity with ACTIVE session', async () => {
      // Simulate DB returning an active user
      // @ts-ignore
      vi.spyOn(db, 'select').mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{
              id: '123',
              walletAddress: '0xValidAdmin',
              status: 'ACTIVE',
              role: 'ADMIN'
            }])
          })
        })
      } as any);
      
      const context = await ControlPlane.resolveAdminContext('0xValidAdmin');
      expect(context.identity).toBe('123');
      expect(context.capabilities).toContain('ADMIN');
    });
  });

  describe('HermesRuntime.respond', () => {
    it('ATTACK 05: Rejects NEXUS_OPERATOR execution when canonicalOrgId is missing (No default fallback)', async () => {
      // We will dynamically import HermesRuntime to allow mocks to set up, 
      // but since it's a massive class we'll just mock the behavior or run the actual method with mocked dependencies
      const { HermesRuntime } = await import('../../runtime/hermes-runtime');
      
      const runtime = new HermesRuntime({} as any);
      
      // Attempt to call respond with NEXUS_OPERATOR but no canonicalOrgId
      const promptPromise = runtime.respond({
        prompt: 'test',
        channel: 'TELEGRAM',
        surfaceNameForIntelligence: 'NEXUS_OPERATOR',
        organizationId: 'test-org',
        rawInterlocutor: {
          platformId: '123'
        },
        controlPlaneContext: {
          actorId: 'test-actor',
          organizationId: 'test-org',
          // canonicalOrgId intentionally left out
        }
      } as any);
      await expect(promptPromise).rejects.toThrow('TENANT_UNRESOLVED: Missing canonical tenant identity');
    });

    it('ATTACK 06: Rejects direct execution of financial signature via Hermes tool registry', async () => {
      // Simulate calling Hermes tool executor for a deprecated execution tool
      const { HermesToolExecutor } = await import('../../runtime/tool-executor');
      const { registerExecutiveTools } = await import('../../runtime/tools/executive-tool-registry');
      
      const executor = new HermesToolExecutor();
      registerExecutiveTools(executor);
      
      // Attempt to invoke the tool directly
      const request = { toolName: 'executive_financial_signature', params: {} };
      const activeCapabilities = [{ id: 'executive_financial_signature' }];
      const resultPromise = executor.executeTool(request as any, activeCapabilities, {});
      
      const result = await resultPromise;
      expect(JSON.stringify(result)).toContain('ACTION_GATEWAY_REQUIRED');
    });
  });
});

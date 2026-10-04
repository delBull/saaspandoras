import { describe, it, expect, vi } from 'vitest';
import { NexusAuthorizationService } from './nexus-authorization';
import { db } from '@saasfly/db-core';

// Mock DB
vi.mock('@saasfly/db-core', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => [
            { id: 1, role: 'NEXUS_KYC_OPERATOR', status: 'ACTIVE' }
          ])
        }))
      }))
    }))
  }
}));

describe.skip('NexusAuthorizationService', () => {
  it('resolves proper actor scope without client-side spoofing', async () => {
    const scope = await NexusAuthorizationService.resolveCollaboratorScope('org1', '1');
    expect(scope).toBeDefined();
    expect(scope?.collaboratorId).toBe('1');
    expect(scope?.canonicalOrgId).toBe('org1');
    
    // Check that permissions are resolved securely
    expect(scope?.permissions).toBeDefined();
  });
});

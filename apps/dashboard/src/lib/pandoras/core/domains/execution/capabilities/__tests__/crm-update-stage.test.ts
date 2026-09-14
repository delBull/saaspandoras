import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrmUpdateStageCapability } from '../crm-update-stage';
import { db } from '~/db';
import { CapabilityContext } from '../../contracts/capability-contracts';

// Mocks
vi.mock('~/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  }
}));

describe('CrmUpdateStageCapability', () => {
  let capability: CrmUpdateStageCapability;

  beforeEach(() => {
    capability = new CrmUpdateStageCapability();
    vi.resetAllMocks();
  });

  const validContext: CapabilityContext = {
    organizationId: 'org_canonical_123',
    intentId: 'test-intent',
    actorId: 'test-actor',
    missionId: 'test-mission',
    correlationId: 'test-correlation',
    idempotencyKey: 'test-idempotency'
  };

  it('Fails if organizationId is missing in context', async () => {
    const invalidContext = { ...validContext, organizationId: '' };
    
    const result = await capability.execute({
      leadId: '100',
      projectId: 10,
      stage: 'PROPOSAL'
    }, invalidContext);

    expect(result.status).toBe('failed');
    expect((result as any).error?.message).toContain('Missing canonicalOrgId');
  });

  it('Fails if requested stage is not in the whitelist', async () => {
    const result = await capability.execute({
      leadId: '100',
      projectId: 10,
      stage: 'HACKED_STAGE'
    }, validContext);

    expect(result.status).toBe('failed');
    expect((result as any).error?.message).toContain('Invalid CRM Stage');
  });

  it('Fails (Fail-Closed) if lead does not exist', async () => {
    // Mock db.select() to return empty array for lead
    const mockFrom = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]) // No lead found
      })
    });
    (db.select as any).mockReturnValue({ from: mockFrom });

    const result = await capability.execute({
      leadId: '100',
      projectId: 10,
      stage: 'PROPOSAL'
    }, validContext);

    expect(result.status).toBe('failed');
    expect((result as any).error?.category).toBe('NOT_FOUND');
    expect((result as any).error?.message).toContain('Lead 100 not found');
  });

  it('Fails with TenantMismatchSecurityViolation if project does not belong to authorized context', async () => {
    // Mock db.select() to return a lead, then a project with mismatching organizationId
    const limitMock1 = vi.fn().mockResolvedValue([{ id: '100', projectId: 10 }]); // Lead exists
    const whereMock1 = vi.fn().mockReturnValue({ limit: limitMock1 });
    const fromMock1 = vi.fn().mockReturnValue({ where: whereMock1 });

    const limitMock2 = vi.fn().mockResolvedValue([{ id: 10, organizationId: 'different_org_456', slug: 'other-slug' }]); // Mismatch Project
    const whereMock2 = vi.fn().mockReturnValue({ limit: limitMock2 });
    const fromMock2 = vi.fn().mockReturnValue({ where: whereMock2 });

    (db.select as any)
      .mockReturnValueOnce({ from: fromMock1 })
      .mockReturnValueOnce({ from: fromMock2 });

    const result = await capability.execute({
      leadId: '100',
      projectId: 10,
      stage: 'PROPOSAL'
    }, validContext);

    expect(result.status).toBe('failed');
    expect((result as any).error?.message).toContain('TenantMismatchSecurityViolation');
  });

  it('Succeeds and updates CRM stage if all security checks pass', async () => {
    // Lead exists
    const limitMock1 = vi.fn().mockResolvedValue([{ id: '100', projectId: 10 }]); 
    const whereMock1 = vi.fn().mockReturnValue({ limit: limitMock1 });
    const fromMock1 = vi.fn().mockReturnValue({ where: whereMock1 });

    // Project matches canonicalOrgId
    const limitMock2 = vi.fn().mockResolvedValue([{ id: 10, organizationId: 'org_canonical_123', slug: 'my-slug' }]); 
    const whereMock2 = vi.fn().mockReturnValue({ limit: limitMock2 });
    const fromMock2 = vi.fn().mockReturnValue({ where: whereMock2 });

    (db.select as any)
      .mockReturnValueOnce({ from: fromMock1 })
      .mockReturnValueOnce({ from: fromMock2 });

    // Mock db.update() returning the updated lead
    const returningMock = vi.fn().mockResolvedValue([{ id: '100', crmStage: 'PROPOSAL' }]);
    const updateWhereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: updateWhereMock });
    (db.update as any).mockReturnValue({ set: setMock });

    const result = await capability.execute({
      leadId: '100',
      projectId: 10,
      stage: 'PROPOSAL'
    }, validContext);

    expect(result.status).toBe('succeeded');
    expect((result as any).data?.leadId).toBe('100');
    expect((result as any).data?.newStage).toBe('PROPOSAL');

    // Verify spy on db.update to ensure it was called
    expect(db.update).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith({ crmStage: 'PROPOSAL' });
  });
});

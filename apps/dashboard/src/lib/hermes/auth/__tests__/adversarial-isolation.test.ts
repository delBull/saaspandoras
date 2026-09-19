import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { resolveCanonicalAuthSession } from '../canonical-resolver';
import { isWalletAuthorizedForTenant } from '../wallet-tenant-membership';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('@/db/schema', () => ({
  projects: {},
  daoMembers: {},
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue({ value: 'mock_session_token' }),
  }),
}));

describe('Adversarial Isolation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isWalletAuthorizedForTenant', () => {
    it('rejects access when wallet does not match applicant or daoMembers', async () => {
      // Mock project fetch
      // @ts-ignore
      (db.limit as any)
        .mockResolvedValueOnce([{ id: 1, applicantWalletAddress: 'owner_wallet' }]) // Project query
        .mockResolvedValueOnce([]); // DAO members query

      const result = await isWalletAuthorizedForTenant('adversarial_wallet', 'org_123');
      // @ts-ignore
      expect((db as any).limit).toHaveBeenCalledTimes(2);
      expect(result).toBe(false);
    });

    it('grants access when wallet is the exact applicant', async () => {
      // @ts-ignore
      (db.limit as any).mockResolvedValueOnce([{ id: 1, applicantWalletAddress: 'owner_wallet' }]);

      const result = await isWalletAuthorizedForTenant('owner_wallet', 'org_123');
      // @ts-ignore
      expect((db as any).limit).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('fails closed on DB exceptions', async () => {
      // @ts-ignore
      (db.limit as any).mockRejectedValueOnce(new Error('DB Connection Failed'));

      const result = await isWalletAuthorizedForTenant('owner_wallet', 'org_123');
      expect(result).toBe(false);
    });
  });
});

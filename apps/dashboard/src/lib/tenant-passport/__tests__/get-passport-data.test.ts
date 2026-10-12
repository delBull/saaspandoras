import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTenantPassportData } from '../get-passport-data';
import { db } from '@saasfly/db-core';

vi.mock('@saasfly/db-core', () => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();

  mockSelect.mockReturnValue({ from: mockFrom });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockWhere.mockReturnValue({ limit: mockLimit });

  return {
    db: {
      select: mockSelect,
      query: {
        marketingIdentities: { findFirst: vi.fn() },
        purchases: { findMany: vi.fn() },
        daoMembers: { findFirst: vi.fn() },
        userBalances: { findFirst: vi.fn() },
      },
    },
    projects: { slug: 'slug' },
    purchases: { projectId: 'projectId', userId: 'userId', createdAt: 'createdAt' },
    daoMembers: { projectId: 'projectId', wallet: 'wallet' },
    userBalances: { walletAddress: 'walletAddress' },
    marketingIdentities: { walletAddress: 'walletAddress' },
    eq: vi.fn(),
    and: vi.fn(),
    desc: vi.fn(),
    or: vi.fn(),
    ilike: vi.fn(),
  };
});

describe('Tenant Passport — getTenantPassportData (Fase 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe devolver bloques en estado unavailable si el tenant no existe', async () => {
    const mockLimit = vi.fn().mockResolvedValue([]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as any).mockReturnValue({ from: mockFrom });

    const result = await getTenantPassportData('non-existent-tenant', '0x1234567890123456789012345678901234567890');

    expect(result.assetBlock.state).toBe('unavailable');
    expect(result.rewardsBlock.state).toBe('unavailable');
    expect(result.perksBlock.state).toBe('unavailable');
  });

  it('debe devolver estado empty y solicitar wallet si el usuario no tiene wallet conectada', async () => {
    const mockProject = {
      id: 1,
      slug: 'snarai',
      title: "S'Narai Real Estate",
      tokenPriceUsd: '50',
      w2eConfig: {},
    };

    const mockLimit = vi.fn().mockResolvedValue([mockProject]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as any).mockReturnValue({ from: mockFrom });

    const result = await getTenantPassportData('snarai', null);

    expect(result.assetBlock.state).toBe('empty');
    expect(result.assetBlock.assets).toEqual([]);
    expect(result.assetBlock.message).toContain('Conecta tu wallet');
    expect(result.rewardsBlock.rewardsValue).toBe(0);
    expect(result.rewardsBlock.canClaim).toBe(false);
  });

  it('debe mapear compras reales y membresía DAO en PassportAssets', async () => {
    const mockProject = {
      id: 1,
      slug: 'snarai',
      title: "S'Narai Real Estate",
      tokenPriceUsd: '50',
      w2eConfig: {},
    };

    const mockLimit = vi.fn().mockResolvedValue([mockProject]);
    const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    (db.select as any).mockReturnValue({ from: mockFrom });

    (db.query.marketingIdentities.findFirst as any).mockResolvedValue(null);

    (db.query.purchases.findMany as any).mockResolvedValue([
      {
        id: 'purchase-abc-123',
        projectId: 1,
        userId: '0x1111111111111111111111111111111111111111',
        amount: '150',
        status: 'completed',
        agreementHash: '0xhash123456',
        agreementId: 'AGR-SNARAI-001',
        createdAt: new Date('2026-05-01'),
      },
    ]);

    (db.query.daoMembers.findFirst as any).mockResolvedValue({
      projectId: 1,
      wallet: '0x1111111111111111111111111111111111111111',
      votingPower: '3000',
    });

    (db.query.userBalances.findFirst as any).mockResolvedValue({
      walletAddress: '0x1111111111111111111111111111111111111111',
      usdcBalance: '75.50',
      pboxBalance: '0',
    });

    const result = await getTenantPassportData('snarai', '0x1111111111111111111111111111111111111111');

    expect(result.assetBlock.state).toBe('available');
    expect(result.assetBlock.assets?.length).toBe(2); // 1 compra + 1 membresía DAO

    // Verificar certificado de compra
    const cert = result.assetBlock.assets?.find((a) => a.kind === 'certificate');
    expect(cert).toBeDefined();
    expect(cert?.units).toBe(3); // 150 / 50 = 3
    expect(cert?.agreementHash).toBe('0xhash123456');
    expect(cert?.status).toBe('active');

    // Verificar membresía DAO
    const dao = result.assetBlock.assets?.find((a) => a.kind === 'membership');
    expect(dao).toBeDefined();
    expect(dao?.votingPower).toBe(3000);

    // Verificar recompensas
    expect(result.rewardsBlock.rewardsValue).toBe(75.5);
    expect(result.rewardsBlock.rewardsDisplay).toBe('75.50 USDC');
    expect(result.rewardsBlock.canClaim).toBe(true);
  });
});

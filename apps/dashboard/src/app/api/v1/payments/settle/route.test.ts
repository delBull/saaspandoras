import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { db } from '@saasfly/db-core';
import { paymentOrchestrator } from '@saasfly/hermes-core';

vi.mock('@saasfly/db-core', () => {
  const mockDb = {
    select: vi.fn(),
    update: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
    set: vi.fn(),
    returning: vi.fn(),
  };
  return {
    db: mockDb,
    privatePaymentLinks: { id: 'id', status: 'status', metadata: 'metadata', networkChainId: 'network_chain_id', settlementToken: 'settlement_token', destinationWallet: 'destination_wallet', amount: 'amount', currency: 'currency', title: 'title' },
    projects: { id: 'id', organizationId: 'organization_id', slug: 'slug', applicantWalletAddress: 'applicant_wallet_address' },
    commercialOrders: { id: 'id', leadId: 'lead_id', status: 'status', requestedOrgName: 'requested_org_name' },
    eq: vi.fn((a, b) => ({ a, b })),
    and: vi.fn((...args) => ({ and: args })),
  };
});

vi.mock('@saasfly/hermes-core', () => ({
  paymentOrchestrator: {
    processSettlement: vi.fn().mockResolvedValue(undefined),
  },
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true }),
  clientIpFromHeaders: vi.fn().mockReturnValue('127.0.0.1'),
}));

vi.mock('viem', () => ({
  createPublicClient: vi.fn().mockReturnValue({
    getTransactionReceipt: vi.fn().mockResolvedValue({
      status: 'success',
      blockNumber: 1234567n,
      logs: [
        {
          address: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
          data: '0x',
          topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'],
        },
      ],
    }),
  }),
  http: vi.fn(),
  parseUnits: vi.fn().mockReturnValue(299000000n),
  decodeEventLog: vi.fn().mockReturnValue({
    eventName: 'Transfer',
    args: {
      to: '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
      value: 299000000n,
    },
  }),
  erc20Abi: [],
}));

vi.mock('@/lib/discord/business-notifier', () => ({
  sendBusinessNotification: vi.fn().mockResolvedValue(undefined),
}));

describe('Payment Settle Bridge API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRequest = (body: any) =>
    new NextRequest('http://localhost/api/v1/payments/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('rejects invalid or missing txHash with 400', async () => {
    const req = createRequest({ linkId: 'link-123', txHash: 'invalid' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('settles on-chain payment and bridges commercialOrders to PAID', async () => {
    const validTxHash = '0x' + 'a'.repeat(64);

    const mockLink = {
      id: 'link-123',
      title: 'Workspace Activation',
      amount: '299.00',
      currency: 'USD',
      status: 'active',
      networkChainId: 11155111,
      settlementToken: '0x036cbd53842c5426634e7929541ec2318f3dcf7e',
      destinationWallet: '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
      metadata: {
        orderId: 'order-xyz',
        leadId: 'lead-abc',
        context: 'CommercialOrder',
      },
    };

    // 1. Fetch link
    const selectLinkChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockLink]),
    };
    (db.select as any).mockReturnValueOnce(selectLinkChain);

    // 2. Update privatePaymentLinks to completed
    const updateLinkChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 'link-123' }]),
    };
    (db.update as any).mockReturnValueOnce(updateLinkChain);

    // 3. Update commercialOrders to PAID
    const updateOrderChain = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'order-xyz', requestedOrgName: 'Acme Corp' }]),
    };
    (db.update as any).mockReturnValueOnce(updateOrderChain);

    const req = createRequest({
      linkId: 'link-123',
      txHash: validTxHash,
      amount: 299,
      currency: 'USDC',
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify commercialOrders was updated to PAID
    expect(updateOrderChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PAID',
        verifiedBy: `onchain:${validTxHash}`,
      })
    );

    // Verify orchestrator dispatch
    expect(paymentOrchestrator.processSettlement).toHaveBeenCalled();
  });
});

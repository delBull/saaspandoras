import { describe, it, expect } from 'vitest';
import { TenantBillingService } from '../tenant-billing.service';
import { TenantCreditLedgerService } from '../tenant-credit-ledger.service';

describe('💳 HERMES TENANT BILLING & DEPOSIT SUITE', () => {
  it('TB-1: Rejects deposit under the $5.00 USD minimum threshold', async () => {
    const testTenant = `billing_min_${Date.now()}`;
    await expect(
      TenantBillingService.processDeposit({
        tenantId: testTenant,
        amountUsd: 4.99,
        isSandbox: true,
      })
    ).rejects.toThrow('El monto mínimo de recarga es de $5.00 USD');
  });

  it('TB-0: New tenant initializes with $5.00 USD Sandbox courtesy test balance', async () => {
    const testTenant = `billing_new_${Date.now()}`;
    const credits = await TenantCreditLedgerService.getOrCreateCredits(testTenant);
    expect(credits.sandboxBalanceUsd).toBe(5.0);
    expect(credits.creditBalanceUsd).toBe(0.0);
  });

  it('TB-2: Acredits deposit to Sandbox balance and isolates from production', async () => {
    const testTenant = `billing_sandbox_${Date.now()}`;
    const result = await TenantBillingService.processDeposit({
      tenantId: testTenant,
      amountUsd: 10.0,
      isSandbox: true,
      paymentMethod: 'thirdweb_pay',
      transactionHash: '0x123abc_sandbox_tx',
    });

    expect(result.ok).toBe(true);
    expect(result.isSandbox).toBe(true);
    expect(result.amountCreditedUsd).toBe(10.0);
    expect(result.newBalanceUsd).toBe(15.0); // 5.0 courtesy + 10.0 deposit
    expect(result.platformCommissionUsd).toBeGreaterThan(0);
    expect(result.treasuryWallet).toBeDefined();

    // Verify through ledger service
    const credits = await TenantCreditLedgerService.getOrCreateCredits(testTenant);
    expect(credits.sandboxBalanceUsd).toBe(15.0);
    expect(credits.creditBalanceUsd).toBe(0); // Production untouched
  });

  it('TB-3: Acredits deposit to Production balance with margin separation', async () => {
    const testTenant = `billing_prod_${Date.now()}`;
    const result = await TenantBillingService.processDeposit({
      tenantId: testTenant,
      amountUsd: 25.0,
      isSandbox: false,
      paymentMethod: 'crypto',
      transactionHash: '0x456def_prod_tx',
    });

    expect(result.ok).toBe(true);
    expect(result.isSandbox).toBe(false);
    expect(result.amountCreditedUsd).toBe(25.0);
    expect(result.newBalanceUsd).toBe(25.0);

    // Verify 35% commission calculation: 25 * 35 / 135 = ~6.4815 USD
    expect(result.platformCommissionUsd).toBeCloseTo(6.4815, 2);

    // Verify through ledger service
    const credits = await TenantCreditLedgerService.getOrCreateCredits(testTenant);
    expect(credits.creditBalanceUsd).toBe(25.0);
    expect(credits.sandboxBalanceUsd).toBe(5.0); // Courtesy sandbox untouched
  });

  it('TB-4: Resolves configured Pandoras treasury wallet', () => {
    const treasury = TenantBillingService.getTreasuryWallet();
    expect(treasury).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(treasury.toLowerCase()).toBe(process.env.PANDORAS_ADMIN_WALLET?.toLowerCase());
  });

  it('TB-5: Retrieves Hermes Internal Accounting Ledger with full financial audit', async () => {
    const testTenant = `billing_audit_${Date.now()}`;
    await TenantBillingService.processDeposit({
      tenantId: testTenant,
      amountUsd: 50.0,
      isSandbox: false,
      paymentMethod: 'thirdweb_pay',
      transactionHash: '0xaudit_tx_hash',
    });

    const ledger = await TenantBillingService.getInternalAccountingLedger({
      tenantId: testTenant,
    });

    expect(ledger.length).toBeGreaterThanOrEqual(1);
    const entry = ledger[0]!;
    expect(entry.tenantId).toBe(testTenant);
    expect(entry.amountUsd).toBe(50.0);
    expect(entry.destinationWallet).toBeDefined();
    expect(entry.reason).toContain('Fondeo de créditos');
    expect(entry.status).toBe('FUNDED');
  });
});

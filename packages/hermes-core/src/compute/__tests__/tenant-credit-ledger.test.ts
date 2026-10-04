import { describe, it, expect } from 'vitest';
import { TenantCreditLedgerService } from '../tenant-credit-ledger.service';
import { RunPodServerlessService } from '../runpod-serverless.service';

describe('⚡ HERMES RUNPOD SERVERLESS & TENANT CREDIT LEDGER SUITE', () => {
  it('TC-1: Initializes tenant ledger with $0.00 USD and defines $5.00 USD minimum top-up', async () => {
    const testTenant = `tenant_test_${Date.now()}`;
    const credits = await TenantCreditLedgerService.getOrCreateCredits(testTenant);

    expect(credits.tenantId).toBe(testTenant);
    expect(credits.creditBalanceUsd).toBe(0);
    expect(credits.sandboxBalanceUsd).toBe(0); // Starts at $0.00 until funded
    expect(credits.markupPercentage).toBe(35);
    expect(TenantCreditLedgerService.MIN_TOPUP_AMOUNT_USD).toBe(5.0000);
  });

  it('TC-2: Calculates dynamic markup correctly on raw compute cost', async () => {
    const testTenant = `tenant_markup_${Date.now()}`;
    const rawCost = 0.02; // $0.02 raw GPU cost
    const check = await TenantCreditLedgerService.hasSufficientBalance(testTenant, rawCost, true);

    // 0.02 * (1 + 35/100) = 0.02 * 1.35 = 0.027
    expect(check.markupPercentage).toBe(35);
    expect(check.estimatedCharge).toBe(0.027);
    expect(check.balance).toBe(0);
    expect(check.sufficient).toBe(false); // $0.00 balance requires funding
  });

  it('TC-3: Rejects job if balance is $0.00 and requires funding', async () => {
    const testTenant = `tenant_poor_${Date.now()}`;
    const check = await TenantCreditLedgerService.hasSufficientBalance(testTenant, 0.02, false);

    expect(check.sufficient).toBe(false);
    expect(check.balance).toBe(0);
    expect(check.estimatedCharge).toBe(0.027);
  });

  it('TC-4: RunPodServerlessService executes with scale-to-zero simulated metrics', async () => {
    const jobResult = await RunPodServerlessService.executeSync({
      endpointId: 'ep_comfyui_serverless_flux',
      input: { prompt: 'Luxury modern villa render' },
    });

    expect(jobResult.success).toBe(true);
    expect(jobResult.isMock).toBe(true);
    expect(jobResult.executionTimeMs).toBeGreaterThan(0);
    expect(jobResult.rawCostUsd).toBeGreaterThanOrEqual(0);
    expect(jobResult.output?.message).toContain('Scale-to-zero active');
  });
});

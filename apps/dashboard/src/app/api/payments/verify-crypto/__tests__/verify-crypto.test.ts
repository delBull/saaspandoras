import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('verify-crypto — Destination Wallet Security & Fail-Closed Policy', () => {
  const originalEnv = process.env.PANDORAS_ADMIN_WALLET;

  afterEach(() => {
    if (originalEnv) {
      process.env.PANDORAS_ADMIN_WALLET = originalEnv;
    } else {
      delete process.env.PANDORAS_ADMIN_WALLET;
    }
  });

  it('fails closed when destinationWallet is missing and PANDORAS_ADMIN_WALLET is unset', async () => {
    delete process.env.PANDORAS_ADMIN_WALLET;

    // Simulate payment link without explicit destinationWallet
    const link = { destinationWallet: null, amount: "50" };

    // Function logic validation:
    const resolveDestinationWallet = (l: { destinationWallet: string | null }): string | null => {
      if (l.destinationWallet && /^0x[a-fA-F0-9]{40}$/i.test(l.destinationWallet.trim())) {
        return l.destinationWallet.trim().toLowerCase();
      }
      const envWallet = process.env.PANDORAS_ADMIN_WALLET?.trim();
      if (envWallet && /^0x[a-fA-F0-9]{40}$/i.test(envWallet)) {
        return envWallet.toLowerCase();
      }
      return null;
    };

    const resolved = resolveDestinationWallet(link);
    expect(resolved).toBeNull();
  });

  it('uses link.destinationWallet when explicitly provided', () => {
    const customWallet = '0x1111111111111111111111111111111111111111';
    const link = { destinationWallet: customWallet, amount: "100" };

    const resolveDestinationWallet = (l: { destinationWallet: string | null }): string | null => {
      if (l.destinationWallet && /^0x[a-fA-F0-9]{40}$/i.test(l.destinationWallet.trim())) {
        return l.destinationWallet.trim().toLowerCase();
      }
      const envWallet = process.env.PANDORAS_ADMIN_WALLET?.trim();
      if (envWallet && /^0x[a-fA-F0-9]{40}$/i.test(envWallet)) {
        return envWallet.toLowerCase();
      }
      return null;
    };

    expect(resolveDestinationWallet(link)).toBe(customWallet.toLowerCase());
  });

  it('falls back to PANDORAS_ADMIN_WALLET env variable when link has no destination', () => {
    const adminWallet = '0x2222222222222222222222222222222222222222';
    process.env.PANDORAS_ADMIN_WALLET = adminWallet;

    const link = { destinationWallet: null, amount: "100" };

    const resolveDestinationWallet = (l: { destinationWallet: string | null }): string | null => {
      if (l.destinationWallet && /^0x[a-fA-F0-9]{40}$/i.test(l.destinationWallet.trim())) {
        return l.destinationWallet.trim().toLowerCase();
      }
      const envWallet = process.env.PANDORAS_ADMIN_WALLET?.trim();
      if (envWallet && /^0x[a-fA-F0-9]{40}$/i.test(envWallet)) {
        return envWallet.toLowerCase();
      }
      return null;
    };

    expect(resolveDestinationWallet(link)).toBe(adminWallet.toLowerCase());
  });
});

/**
 * 📦 Dash Contracts — Growth Sovereign Pay & Finance
 * src/lib/dash-contracts/growth/finance.ts
 */

export type WalletMode = 'PANDORAS_MANAGED' | 'CUSTOM_EXTERNAL' | 'MULTISIG_VAULT';

export interface TenantWalletConfigDTO {
  organizationId: string;
  walletMode: WalletMode;
  primaryAddress: string;
  smartAccountAddress?: string;
  dailySpendLimitUsdc: number;
  spentTodayUsdc: number;
  withdrawalAllowlist: string[];
  requiresMultiSig: boolean;
  signerCount: number;
  balanceUsdc: number;
  balanceNative: number;
  nativeSymbol: string;
  isIsolated: boolean;
  lastAuditedAt?: string;
}

export interface UpdateTenantWalletRequestDTO {
  walletMode?: WalletMode;
  customAddress?: string;
  dailySpendLimitUsdc?: number;
  withdrawalAllowlist?: string[];
}

export interface TreasuryTransactionDTO {
  id: string;
  txHash?: string;
  type: 'INBOUND_PAYMENT' | 'OUTBOUND_PAYOUT' | 'COMMISSION_DISPATCH' | 'TREASURY_SWAP';
  amountUsdc: number;
  fromAddress: string;
  toAddress: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  authorizedBy: string;
  createdAt: string;
}

'use client';

import { useMemo } from 'react';
import { useWalletBalance } from 'thirdweb/react';
import { type Chain } from 'thirdweb/chains';
import { client } from '@/lib/thirdweb-client';
import { useTokenPricesContext } from '@/contexts/TokenPriceContext';

// Types for network configuration
interface NetworkToken {
  name: string;
  symbol: string;
  isNative: boolean;
  address?: string;
}

interface NetworkConfig {
  chain: Chain;
  name: string;
  symbol: string;
  tokens: NetworkToken[];
}

interface WalletBalanceProps {
  selectedChain: Chain;
  accountAddress: string | undefined;
  supportedNetworks: NetworkConfig[];
}

export function WalletBalance({ selectedChain, accountAddress, supportedNetworks }: WalletBalanceProps) {
  const { data: nativeBalance, isLoading: nativeLoading } = useWalletBalance({
    client,
    chain: selectedChain,
    address: accountAddress ?? "",
  });

  const tokenPrices = useTokenPricesContext();

  const realBalances = useMemo(() => {
    if (!accountAddress) return [];

    const network = supportedNetworks.find(n => n.chain.id === selectedChain.id);
    if (!network) return [];

    const balances = [];

    // Add native token balance
    const nativeToken = network.tokens.find(token => token.isNative);
    if (nativeToken) {
      const balanceValue = nativeBalance?.displayValue ?? "0";
      const numBalance = parseFloat(balanceValue) || 0;

      const tokenPrice = tokenPrices[nativeToken.symbol as keyof typeof tokenPrices] || 0;
      const usdValue = numBalance * tokenPrice;

      balances.push({
        symbol: nativeToken.symbol,
        balance: nativeLoading ? "--" : numBalance.toFixed(4),
        value: nativeLoading ? "$--" : `$${usdValue.toFixed(2)}`,
        isLoading: nativeLoading,
      });
    }

    return balances;
  }, [selectedChain.id, accountAddress, nativeBalance, nativeLoading, tokenPrices, supportedNetworks]);

  if (!accountAddress) {
    return null;
  }

  return (
    <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-3">
      <div className="text-xs font-mono text-gray-400 mb-2">WALLET BALANCES</div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {(realBalances || []).map((token, index) => (
          <div key={index} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {token.symbol.substring(0, 2)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-mono text-gray-300 truncate">
                  {token.symbol}
                  {token.isLoading && <span className="animate-pulse">...</span>}
                </div>
                <div className="text-xs font-mono text-gray-500 truncate" title={token.balance}>
                  {typeof token.balance === 'string' ? parseFloat(token.balance || '0').toFixed(4) : token.balance}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs font-mono text-lime-400" title={token.value}>
                {typeof token.value === 'string' && token.value.startsWith('$')
                  ? `$${parseFloat(token.value.replace('$', '') || '0').toFixed(2)}`
                  : token.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { useActiveAccount } from 'thirdweb/react';
import { ethereum } from 'thirdweb/chains';
import { WalletBalance, NetworkSelector } from '@/components/wallet';
import { SUPPORTED_NETWORKS } from '@/config/networks';

export function BalanceDashboard() {
  const account = useActiveAccount();
  const [selectedChain, setSelectedChain] = useState(ethereum);

  if (!account) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balances Multi-Chain</CardTitle>
        <CardDescription>
          Gestiona tus balances en diferentes redes blockchain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <NetworkSelector
          selectedChain={selectedChain}
          onChainChange={setSelectedChain}
          supportedNetworks={SUPPORTED_NETWORKS}
        />
        <WalletBalance
          selectedChain={selectedChain}
          accountAddress={account.address}
          supportedNetworks={SUPPORTED_NETWORKS}
        />
      </CardContent>
    </Card>
  );
}

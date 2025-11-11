import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveAccount } from 'thirdweb/react';

export function WalletInfoPanel() {
  const account = useActiveAccount();

  if (!account) return null;

  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      alert('Dirección copiada al portapapeles');
    } catch (err) {
      alert('Error al copiar la dirección');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de Wallet</CardTitle>
        <CardDescription>
          Detalles y dirección de tu wallet conectada
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-400">Dirección:</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-mono text-sm text-white bg-zinc-800 p-2 rounded flex-1 truncate">
              {account.address}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyWalletAddress(account.address)}
              className="text-gray-400 hover:text-white"
            >
              Copiar
            </Button>
          </div>
        </div>

        <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">
            💡 <strong>Recibe fondos:</strong> Comparte tu dirección pública para recibir tokens o NFTs
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

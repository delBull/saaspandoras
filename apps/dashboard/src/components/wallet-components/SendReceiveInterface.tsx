import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useActiveAccount, useSendTransaction } from 'thirdweb/react';
import type { ethereum } from 'thirdweb/chains';

import { client } from '@/lib/thirdweb-client';
import { WalletQRDisplay } from './PandorasQRCode';

function SendCryptoForm({ selectedChain, account }: { selectedChain: typeof ethereum; account: { address: string } }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { mutateAsync: sendTransaction } = useSendTransaction();

  const handleSend = async () => {
    if (!recipient || !amount || !account) return;

    // Validar dirección
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      alert('Dirección de destinatario inválida');
      return;
    }

    // Validar monto
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Monto inválido');
      return;
    }

    setIsLoading(true);
    try {
      // Para envío de ETH nativo
      const transaction = {
        to: recipient,
        value: BigInt(Math.floor(numAmount * 1e18)), // Convertir a wei
        chain: selectedChain,
        client: client, // Agregar el client de Thirdweb
      };

      const result = await sendTransaction(transaction);

      // Si llega aquí, la transacción fue exitosa
      console.log('✅ Transacción completada:', result);

      alert(`✅ Transacción enviada exitosamente!\n\n📋 Detalles:\n• Destinatario: ${recipient}\n• Monto: ${numAmount} ${selectedChain.nativeCurrency?.symbol ?? 'ETH'}\n• Red: ${selectedChain.name}\n• Hash: ${result.transactionHash}`);

      // Limpiar formulario
      setRecipient('');
      setAmount('');

    } catch (error: unknown) {
      console.error('❌ Error al enviar transacción:', error);

      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as { code?: number })?.code;

      // Solo mostrar error si es un error real, no estimaciones de gas o warnings
      if (errorMessage?.includes('User rejected') ||
          errorMessage?.includes('Action cancelled') ||
          errorCode === 4001) {
        alert('❌ Transacción cancelada por el usuario.');
      } else if (errorMessage?.includes('insufficient funds')) {
        alert(`❌ Fondos insuficientes. Necesitas más ${selectedChain.nativeCurrency?.symbol ?? 'ETH'} para cubrir las fees de gas.`);
      } else if (errorMessage?.includes('network') || errorMessage?.includes('chain')) {
        alert(`❌ Error de red. Verifica que estés conectado a ${selectedChain.name}.`);
      } else {
        // Para otros errores, mostrar mensaje genérico pero informar que puede haber sido exitosa
        console.warn('⚠️ Error detectado, pero la transacción puede haber sido exitosa. Revisa el explorador.');
        alert('⚠️ Error detectado. Revisa el explorador de la blockchain para confirmar si la transacción fue exitosa.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="recipient">Dirección del destinatario</Label>
        <Input
          id="recipient"
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Monto ({selectedChain.nativeCurrency?.symbol ?? 'ETH'})</Label>
        <Input
          id="amount"
          type="number"
          step="0.000001"
          placeholder="0.0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <Button
        onClick={handleSend}
        disabled={isLoading || !recipient || !amount}
        className="w-full"
      >
        {isLoading ? 'Enviando...' : `Enviar ${selectedChain.nativeCurrency?.symbol ?? 'ETH'}`}
      </Button>

      <div className="text-xs text-gray-500">
        ⚠️ Asegúrate de que la dirección sea correcta. Las transacciones en blockchain son irreversibles.
      </div>
    </div>
  );
}

function ReceiveCryptoForm({ selectedChain, account }: { selectedChain: typeof ethereum; account: { address: string } }) {
  const currencySymbol = selectedChain.nativeCurrency?.symbol ?? 'ETH';

  return (
    <WalletQRDisplay
      address={account.address}
      chainName={selectedChain.name ?? 'Ethereum'}
      currencySymbol={currencySymbol}
    />
  );
}

export function SendReceiveInterface({ selectedChain }: { selectedChain: typeof ethereum }) {
  const account = useActiveAccount();

  if (!account) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar & Recibir Crypto</CardTitle>
        <CardDescription>
          Transfiere tokens y recibe fondos de otras wallets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="send" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="send">📤 Enviar</TabsTrigger>
            <TabsTrigger value="receive">📥 Recibir</TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4">
            <SendCryptoForm selectedChain={selectedChain} account={account} />
          </TabsContent>

          <TabsContent value="receive" className="space-y-4">
            <ReceiveCryptoForm selectedChain={selectedChain} account={account} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

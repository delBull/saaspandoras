import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@saasfly/ui/card';
import { useActiveAccount } from 'thirdweb/react';

export function TransactionHistory() {
  const account = useActiveAccount();

  if (!account) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Transacciones</CardTitle>
        <CardDescription>
          Todas tus transacciones en blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-400 mb-4">
            Próximamente: Historial completo de transacciones
          </p>
          <p className="text-sm text-gray-500">
            Visualiza todas tus transacciones, envíos, recepciones y actividad en contratos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

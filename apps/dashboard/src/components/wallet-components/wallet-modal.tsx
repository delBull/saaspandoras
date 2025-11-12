'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpIcon, ArrowDownIcon, ClockIcon, CreditCardIcon, Copy } from 'lucide-react';
import { useActiveAccount, useSendTransaction, useWalletBalance } from 'thirdweb/react';
import { prepareTransaction, toWei } from 'thirdweb';
import { base } from 'thirdweb/chains';
import { client } from '@/lib/thirdweb-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import QRCode from 'react-qr-code';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'send' | 'receive' | 'buy' | 'history';
}

// === COMPONENTE PRINCIPAL WALLET MODAL ===
export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose, initialTab = 'send' }) => {
  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'buy' | 'history'>(initialTab);

  // Thirdweb hooks
  const account = useActiveAccount();
  const balanceQuery = useWalletBalance({ account, chain: base });

  // Lógica de Envío
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.01');
  const { mutate: send, isPending, isSuccess } = useSendTransaction();

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !recipient || parseFloat(amount) <= 0) return;

    try {
      const valueInWei = toWei(amount.toString());
      const transaction = prepareTransaction({
        client: client,
        chain: base,
        to: recipient,
        value: valueInWei,
      });

      send(transaction, {
        onSuccess: () => alert('Transacción iniciada. Confirma en tu billetera.'),
        onError: (err) => console.error("Error en la transacción", err),
      });
    } catch (error) {
      console.error('Error al preparar envío:', error);
    }
  };

  const handleCopyAddress = () => {
    if (account?.address) {
      void navigator.clipboard.writeText(account.address).then(() => {
        alert('¡Dirección copiada al portapapeles!');
      });
    }
  };

  // Definición de pestañas
  const tabs = [
    { id: 'send' as const, label: 'Enviar', icon: <ArrowUpIcon className="w-5 h-5" />, color: 'bg-blue-500/10 text-blue-400' },
    { id: 'receive' as const, label: 'Recibir', icon: <ArrowDownIcon className="w-5 h-5" />, color: 'bg-green-500/10 text-green-400' },
    { id: 'buy' as const, label: 'Comprar', icon: <CreditCardIcon className="w-5 h-5" />, color: 'bg-purple-500/10 text-purple-400' },
    { id: 'history' as const, label: 'Historial', icon: <ClockIcon className="w-5 h-5" />, color: 'bg-orange-500/10 text-orange-400' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden">
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 my-8 mx-auto w-full max-w-lg border border-zinc-700/40 
                       bg-zinc-900/70 backdrop-blur-xl rounded-2xl shadow-[0_0_60px_-10px_rgba(0,0,0,0.8)]
                       flex flex-col text-zinc-200"
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
          >
            {/* HEADER */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-zinc-800/70 bg-zinc-900/80 backdrop-blur-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-700 to-purple-800 border border-zinc-600 flex items-center justify-center text-white font-bold">
                  {account?.address?.slice(2, 4).toUpperCase() ?? "?"}
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="font-medium text-white text-sm">
                    {account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : "Conecta tu Wallet"}
                  </span>
                  <span className="text-xs text-zinc-400">MetaMask · Base</span>
                </div>
              </div>
              <button onClick={onClose} className="p-1 hover:bg-zinc-800/50 rounded-lg text-zinc-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENIDO SCROLLEABLE */}
            <div className="w-full max-h-[80vh] overflow-y-auto px-6 py-5 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {/* BALANCE */}
              <div className="flex items-center justify-between border-b border-zinc-800/50 pb-4">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Balance</p>
                  <p className="text-2xl font-semibold text-white">{balanceQuery.data?.displayValue ?? "0.0000"} ETH</p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-full py-1 px-3 text-xs">
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  Base
                </div>
              </div>

              {/* ACCIONES */}
              <div className="flex items-center justify-around py-4 border-b border-zinc-800/40">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200
                               ${activeTab === tab.id ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}
                  >
                    <div className={`p-2 rounded-full ${tab.color}`}>{tab.icon}</div>
                    <span className="text-xs font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* CONTENIDO DE PESTAÑAS */}
              <div className="space-y-6">
                {/* === ENVIAR === */}
                {activeTab === 'send' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-white">Enviar ETH en Base</h4>
                    <form onSubmit={handleSendSubmit} className="space-y-4">
                      <Input
                        type="text"
                        placeholder="Dirección de Destino (0x...)"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500"
                        disabled={isPending}
                      />
                      <Input
                        type="number"
                        placeholder="Cantidad (ej. 0.01 ETH)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-zinc-800/50 border-zinc-700 text-white placeholder-zinc-500 focus:border-blue-500"
                        disabled={isPending}
                        step="any"
                      />
                      <div className="flex justify-between text-sm text-zinc-400">
                        <span>Balance disponible:</span>
                        <span className="font-mono">{balanceQuery.data?.displayValue.slice(0, 6) ?? '0.00'} ETH</span>
                      </div>
                      <Button
                        type="submit"
                        disabled={isPending || !account || parseFloat(amount) <= 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-colors rounded-lg"
                      >
                        {isPending ? 'Esperando confirmación...' : 'Revisar y Enviar'}
                      </Button>
                      {isSuccess && <p className="text-green-400 text-sm mt-3">✅ Transacción enviada para confirmación.</p>}
                    </form>
                  </div>
                )}

                {/* === RECIBIR === */}
                {activeTab === 'receive' && (
                  <div className="space-y-6 flex flex-col items-center">
                    <h4 className="text-lg font-semibold text-white">Dirección de Recepción</h4>
                    <p className="text-sm text-zinc-400 max-w-xs text-center">
                      Escanea el código QR o copia la dirección para recibir ETH o tokens en la red **Base**.
                    </p>
                    <div className="p-3 bg-white rounded-xl shadow-xl border border-gray-200">
                      {account?.address ? (
                        <QRCode value={account.address} size={200} level="H" />
                      ) : (
                        <div className="w-[200px] h-[200px] bg-gray-200 flex items-center justify-center text-gray-500">No Wallet</div>
                      )}
                    </div>
                    <button
                      className="flex items-center justify-between w-full max-w-xs bg-zinc-800/70 border border-zinc-700 rounded-lg p-3 hover:bg-zinc-800 transition-colors"
                      onClick={handleCopyAddress}
                    >
                      <span className="font-mono text-sm text-orange-400 truncate">
                        {account?.address ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}` : 'Conecta tu wallet'}
                      </span>
                      <Copy className="w-4 h-4 text-zinc-400 ml-2 flex-shrink-0" />
                    </button>
                    <p className="text-xs text-red-400 text-center pt-2">
                      Advertencia: Solo acepta activos compatibles con la red Base.
                    </p>
                  </div>
                )}

                {/* === COMPRAR === */}
                {activeTab === 'buy' && (
                  <div className="text-center py-6 space-y-4">
                    <CreditCardIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h4 className="text-2xl font-bold text-white">Comprar Crypto</h4>
                    <p className="text-zinc-400 mb-6">
                      Compra **ETH en Base** directamente con tu tarjeta o transferencia bancaria a través de nuestros *partners*.
                    </p>
                    <div className="space-y-3">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 transition-colors">
                        Comprar con MoonPay
                      </Button>
                      <Button variant="outline" className="w-full border-zinc-700 hover:border-purple-500/50 bg-zinc-800 text-white font-semibold py-3">
                        Comprar con Transak
                      </Button>
                    </div>
                  </div>
                )}

                {/* === HISTORIAL === */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-white">Historial Reciente (Base)</h4>
                    <p className="text-zinc-400 text-sm">
                      Este historial muestra las últimas interacciones con tu dirección.
                    </p>
                    <div className="space-y-3">
                      <TransactionItem type="send" amount="-0.01 ETH" fiat="$25.30" date="Hace 2 horas" />
                      <TransactionItem type="receive" amount="+0.05 ETH" fiat="$126.50" date="Ayer" />
                      <TransactionItem type="buy" amount="+0.1 ETH" fiat="$250.00" date="Hace 3 días" />
                    </div>
                    <Button variant="outline" className="w-full border-zinc-700 hover:border-orange-500/50">
                      Ver historial completo en Etherscan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Componente helper para historial
const TransactionItem: React.FC<{ type: 'send' | 'receive' | 'buy', amount: string, fiat: string, date: string }> = ({ type, amount, fiat, date }) => {
  const isSend = type === 'send';
  const isBuy = type === 'buy';
  const colorClass = isSend ? 'text-red-400' : isBuy ? 'text-purple-400' : 'text-green-400';
  const bgClass = isSend ? 'bg-red-500/10' : isBuy ? 'bg-purple-500/10' : 'bg-green-500/10';
  const Icon = isSend ? ArrowUpIcon : ArrowDownIcon;

  return (
    <div className="bg-zinc-800/50 rounded-xl p-4 transition-colors hover:bg-zinc-800/70">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgClass}`}>
            <Icon className={`w-4 h-4 ${colorClass}`} />
          </div>
          <div>
            <p className="text-white font-medium capitalize">{type === 'buy' ? 'Compra' : type === 'send' ? 'Envío' : 'Recepción'}</p>
            <p className="text-zinc-400 text-sm">{date}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-medium ${colorClass}`}>{amount}</p>
          <p className="text-zinc-400 text-sm">{fiat}</p>
        </div>
      </div>
    </div>
  );
};

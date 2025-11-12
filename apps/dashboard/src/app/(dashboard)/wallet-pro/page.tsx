'use client';

// Force dynamic rendering - this page uses auth
export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  WalletIcon,
  QrCodeIcon,
  CogIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BanknotesIcon,
  ChartBarIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { useActiveAccount, ConnectButton, useWalletBalance } from 'thirdweb/react';
import { inAppWallet, createWallet } from 'thirdweb/wallets';
import { base } from 'thirdweb/chains';
import { client } from '@/lib/thirdweb-client';
import { SUPPORTED_NETWORKS } from '@/config/networks';
import {
  NFTGallery,
  TransactionHistory
} from '@/components/wallet-components';

export type ModalType = 'none' | 'send' | 'receive' | 'buy' | 'history';

// BalanceData interface removed - using direct typing

export default function WalletProPage() {
  const router = useRouter();
  const account = useActiveAccount();

  // Fijar la red a Base por ahora
  const selectedChain = base;

  // Obtener balance real de ETH en Base
  const { data: balanceData } = useWalletBalance({
    client,
    address: account?.address,
    chain: base,
  });

  // Formatear el balance en USD
  const walletBalance = React.useMemo(() => {
    if (!balanceData) return '$0.00';
    // Usar el valor en USD si está disponible, sino convertir ETH a USD aproximado
    const balance = balanceData as { usdValue?: number; displayValue: string };
    const usdValue = balance.usdValue ?? parseFloat(balance.displayValue) * 2500; // aproximado
    return `$${usdValue.toFixed(5)}`;
  }, [balanceData]);

  const walletStats = [
    {
      icon: null,
      label: 'Gestión Wallet',
      value: null,
      change: null,
      positive: true,
      isWalletButton: true,
    },
    {
      icon: <BanknotesIcon className="w-5 h-5" />,
      label: 'Balance Total',
      value: walletBalance,
      change: 'Base Network',
      positive: true,
    },
    {
      icon: <KeyIcon className="w-5 h-5" />,
      label: 'Accesos',
      value: '0',
      change: 'Próximamente',
      positive: true,
    },
    {
      icon: <SparklesIcon className="w-5 h-5" />,
      label: 'Artefactos',
      value: '0',
      change: 'Próximamente',
      positive: true,
    },
  ];

  return (
    <div className="min-h-screen text-white pb-20 md:pb-0">
      <div className="relative max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button - Mobile & Desktop */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white transition-colors z-40"
            aria-label="Volver atrás"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6"
          >
            <SparklesIcon className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">Wallet Profesional</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-white via-orange-200 to-white bg-clip-text text-transparent">
              Tu Wallet
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Pandoras
            </span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-8">
            Gestiona tus activos digitales con la máxima seguridad y facilidad.
            <span className="text-orange-400 font-semibold"> Work-to-Earn rewards incluidos.</span>
          </p>
        </motion.div>

        {account ? (
          <>
            {/* Wallet Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
            >
              {walletStats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="bg-gradient-to-br from-zinc-900/50 to-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300"
                >
                  {stat.isWalletButton ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                          <WalletIcon className="w-5 h-5 text-orange-400" />
                        </div>
                        <div className="text-sm text-zinc-400">{stat.label}</div>
                      </div>
                      <ConnectButton
                        client={client}
                        chains={SUPPORTED_NETWORKS.map(network => network.chain)}
                        wallets={[
                          inAppWallet({
                            auth: {
                              options: ["email", "google", "apple", "facebook", "passkey"],
                            },
                            executionMode: {
                              mode: "EIP7702",
                              sponsorGas: true,
                            },
                          }),
                          createWallet("io.metamask"),
                        ]}
                        theme="dark"
                        locale="es_ES"
                        autoConnect={{ timeout: 20000 }}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold py-2 px-4 rounded-lg text-sm"
                      >
                        Gestionar
                      </ConnectButton>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                          <div className="text-orange-400">
                            {stat.icon}
                          </div>
                        </div>
                        <div className="text-sm text-zinc-400">{stat.label}</div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                      <div className={`text-sm ${stat.positive ? 'text-green-400' : 'text-red-400'}`}>
                        {stat.change}
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Main Wallet Sections */}
            <div className="space-y-8">
              {/* Container with NFT Gallery */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="bg-gradient-to-r from-zinc-900/30 to-zinc-800/30 border border-zinc-700/30 rounded-xl p-6 backdrop-blur-sm"
              >
                {/* Header for NFT Section */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2">Mi Bóveda de Utilidad</h3>
                  <p className="text-zinc-400 text-sm">Árbol jerárquico de activos digitales</p>
                </div>

                {/* NFT Gallery - Full Width */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                >
                  <NFTGallery selectedChain={selectedChain} />
                </motion.div>
              </motion.div>

              {/* Transaction History - Full Width */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
              >
                <TransactionHistory />
              </motion.div>
            </div>

            {/* Footer Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="mt-12 pt-8 border-t border-zinc-800"
            >
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/profile">
                  <Button variant="outline" className="border-zinc-700 hover:border-orange-500/50">
                    <CogIcon className="w-4 h-4 mr-2" />
                    Ir al Perfil
                  </Button>
                </Link>
                <Link href="/education">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Aprender Más
                  </Button>
                </Link>
              </div>
            </motion.div>
          </>
        ) : (
          // Wallet not connected - Professional connect screen
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center py-20"
          >
            <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 md:p-12 backdrop-blur-sm max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6">
                <WalletIcon className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Conecta tu
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent"> Wallet</span>
              </h2>

              <p className="text-zinc-400 text-lg mb-8 max-w-xl mx-auto">
                Accede a todas las funciones avanzadas de gestiรณn de activos digitales.
                Balances multi-chain, envío/recepción de crypto y mucho más.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ConnectButton
                  client={client}
                  chains={SUPPORTED_NETWORKS.map(network => network.chain)}
                  wallets={[
                    inAppWallet({
                      auth: {
                        options: ["email", "google", "apple", "facebook", "passkey"],
                      },
                      executionMode: {
                        mode: "EIP7702",
                        sponsorGas: true,
                      },
                    }),
                    createWallet("io.metamask"),
                  ]}
                  theme="dark"
                  locale="es_ES"
                  autoConnect={{ timeout: 20000 }}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold px-8 py-3 rounded-lg"
                >
                  <WalletIcon className="w-5 h-5 mr-2" />
                  Conectar Wallet
                </ConnectButton>
                <Button variant="outline" className="border-zinc-700 hover:border-orange-500/50">
                  <QrCodeIcon className="w-5 h-5 mr-2" />
                  Escanear QR
                </Button>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="p-4 bg-zinc-800/30 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Seguro</div>
                  <div className="text-xs text-zinc-400">Non-custodial</div>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-lg">
                  <ChartBarIcon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Multi-chain</div>
                  <div className="text-xs text-zinc-400">10+ redes</div>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-lg">
                  <SparklesIcon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Work-to-Earn</div>
                  <div className="text-xs text-zinc-400">Rewards incluidos</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}


      </div>
    </div>
  );
}

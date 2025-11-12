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
  ArrowUpIcon,
  ArrowDownIcon,
  QrCodeIcon,
  ClockIcon,
  CogIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useActiveAccount } from 'thirdweb/react';
import { ethereum, base } from 'thirdweb/chains';
import { NetworkSelector } from '@/components/wallet';
import { SUPPORTED_NETWORKS } from '@/config/networks';
import { getContractAddress } from '@/lib/wallet-contracts';
import {
  NFTGallery,
  SendReceiveInterface,
  TransactionHistory
} from '@/components/wallet-components';

export default function WalletProPage() {
  const router = useRouter();
  const account = useActiveAccount();

  // Filtrar redes que tienen contratos PANDORAS_KEY configurados
  const networksWithNFTs = React.useMemo(() =>
    SUPPORTED_NETWORKS.filter(network => {
      const contractAddress = getContractAddress('PANDORAS_KEY', network.chain.id);
      return contractAddress && contractAddress !== "0x...";
    }),
    []
  );

  // Estado para el selector de red global - inicializar con Base si tiene NFTs, sino la primera disponible
  const [selectedChain, setSelectedChain] = React.useState(() => {
    // Buscar Base en las redes con NFTs
    const baseNetwork = networksWithNFTs.find(network => network.chain.id === base.id);
    return baseNetwork?.chain ?? networksWithNFTs[0]?.chain ?? ethereum;
  });

  const quickActions = [
    {
      icon: <ArrowUpIcon className="w-6 h-6" />,
      title: 'Enviar',
      description: 'Transferir crypto',
      color: 'from-blue-500 to-cyan-500',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      action: () => {},
    },
    {
      icon: <ArrowDownIcon className="w-6 h-6" />,
      title: 'Recibir',
      description: 'Generar QR',
      color: 'from-green-500 to-emerald-500',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      action: () => {},
    },
    {
      icon: <QrCodeIcon className="w-6 h-6" />,
      title: 'Escanear',
      description: 'Pagar con QR',
      color: 'from-purple-500 to-pink-500',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      action: () => {},
    },
    {
      icon: <ClockIcon className="w-6 h-6" />,
      title: 'Historial',
      description: 'Ver transacciones',
      color: 'from-orange-500 to-red-500',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      action: () => {},
    },
  ];

  const walletStats = [
    {
      icon: <BanknotesIcon className="w-5 h-5" />,
      label: 'Balance Total',
      value: '$2,847.32',
      change: '+12.5%',
      positive: true,
    },
    {
      icon: <CreditCardIcon className="w-5 h-5" />,
      label: 'Tokens',
      value: '8 activos',
      change: '+2 nuevos',
      positive: true,
    },
    {
      icon: <ChartBarIcon className="w-5 h-5" />,
      label: 'PNL 30d',
      value: '+$234.67',
      change: '+8.2%',
      positive: true,
    },
    {
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      label: 'Seguridad',
      value: '100%',
      change: 'Verificado',
      positive: true,
    },
  ];

  return (
    <div className="min-h-screen text-white">
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
                </motion.div>
              ))}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mb-12"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Acciones
                  <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent"> Rápidas</span>
                </h2>
                <p className="text-zinc-400">Operaciones comunes a un clic de distancia</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    className="group relative p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-orange-500/50 transition-all duration-300 hover:bg-zinc-800/30 cursor-pointer"
                    onClick={action.action}
                  >
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r mb-4 ${action.color}`}>
                      <div className="text-white">
                        {action.icon}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg text-white mb-2">{action.title}</h3>
                    <p className="text-zinc-400 text-sm">{action.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Main Wallet Sections */}
            <div className="space-y-8">
              {/* Container with Global Network Selector and Both Sections */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="bg-gradient-to-r from-zinc-900/30 to-zinc-800/30 border border-zinc-700/30 rounded-xl p-6 backdrop-blur-sm"
              >
                {/* Global Network Selector - Left side and wider */}
                <div className="flex justify-start mb-6">
                  <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700/50 rounded-xl p-6 backdrop-blur-sm min-w-[300px]">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-zinc-400 font-medium">Red Blockchain:</span>
                      <NetworkSelector
                        selectedChain={selectedChain}
                        onChainChange={setSelectedChain}
                        supportedNetworks={SUPPORTED_NETWORKS}
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop: Two Column Layout for Send/Receive and NFT Gallery */}
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Send & Receive Interface */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="flex-1 min-h-0"
                  >
                    <SendReceiveInterface selectedChain={selectedChain} />
                  </motion.div>

                  {/* NFT Gallery */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6 }}
                    className="flex-1 min-h-0"
                  >
                    <NFTGallery selectedChain={selectedChain} />
                  </motion.div>
                </div>
              </motion.div>

              {/* Transaction History - Full Width */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.8 }}
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
                Accede a todas las funciones avanzadas de gestión de activos digitales.
                Balances multi-chain, envío/recepción de crypto y mucho más.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/applicants">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white font-semibold px-8 py-3">
                    <WalletIcon className="w-5 h-5 mr-2" />
                    Conectar Wallet
                  </Button>
                </Link>
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

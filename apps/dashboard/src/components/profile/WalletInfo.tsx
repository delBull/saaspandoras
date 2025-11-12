'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@saasfly/ui/card';
import { ClipboardDocumentIcon, CheckIcon, WalletIcon, ShieldCheckIcon, ArrowTopRightOnSquareIcon, BoltIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import { AvatarEditor } from '@/components/AvatarEditor';
import Link from 'next/link';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

interface WalletInfoProps {
  walletAddress?: string;
  profileWalletAddress?: string;
  kycCompleted?: boolean;
  kycLevel?: string;
  onKycModalOpen: () => void;
}

export function WalletInfo({
  walletAddress,
  profileWalletAddress,
  kycCompleted,
  kycLevel,
  onKycModalOpen
}: WalletInfoProps) {
  const [copied, setCopied] = useState(false);

  // Function to format wallet address with ellipsis
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Function to copy wallet address to clipboard
  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Wallet address copiada al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Error al copiar');
    }
  };

  return (
    <Card>
      <CardHeader className="relative">
        <div className="flex items-center gap-4">
          <div className="relative">
            <AvatarEditor variant="desktop" />
          </div>
        </div>
        {/* KYC Básico Link positioned absolutely in top-right */}
        {!(kycCompleted && kycLevel === 'basic') && (
          <div className="absolute top-4 right-6 flex items-center gap-2">
            <Link href="/profile/kyc">
              <span className="text-xs text-gray-400 hover:text-lime-400 transition-colors cursor-pointer underline">
                KYC Básico
              </span>
            </Link>
            <button
              onClick={onKycModalOpen}
              className="text-gray-400 hover:text-lime-400 transition-colors"
              title="¿Qué es KYC Básico?"
            >
              <QuestionMarkCircleIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-sm font-medium text-gray-400 mb-2 block">Dirección de Wallet</span>
          <div className="bg-zinc-800/60 rounded-lg p-4 border border-zinc-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <WalletIcon className="w-4 h-4 text-lime-400" />
                <span className="text-xs text-gray-300 font-medium">Ethereum Compatible</span>
              </div>
              <button
                onClick={() => copyWalletAddress(walletAddress ?? profileWalletAddress ?? '')}
                className="flex items-center gap-1 text-gray-400 hover:text-lime-400 transition-colors p-1 rounded"
                title="Copiar dirección completa"
              >
                {copied ? (
                  <CheckIcon className="w-4 h-4 text-green-400" />
                ) : (
                  <ClipboardDocumentIcon className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="font-mono text-sm text-white mb-3">
              {walletAddress ? formatWalletAddress(walletAddress) : profileWalletAddress ? formatWalletAddress(profileWalletAddress) : ''}
            </div>

            {/* Información adicional de wallet */}
            <div className="space-y-2 pt-3 border-t border-zinc-700/30">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheckIcon className="w-3 h-3 text-blue-400" />
                <span>Wallet no custodial - Tú controlas tus fondos</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <BoltIcon className="w-3 h-3 text-yellow-400" />
                <span>Permite impulsar protocolos DeFi</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <ArrowTopRightOnSquareIcon className="w-3 h-3 text-purple-400" />
                <span>Compatible con MetaMask, Trust Wallet, Coinbase Wallet</span>
              </div>
            </div>
          </div>

          {/* Información sobre qué puedes hacer con tu wallet */}
          <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-3 border border-blue-700/20 mt-5">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-0.5 flex-shrink-0"></div>
              <div>
                <p className="font-medium mb-1 text-gray-300 text-sm">💡 ¿Qué puedes hacer con tu wallet?</p>
                <ul className="space-y-0.5 text-xs text-gray-400 ml-1">
                  <li>• Únete a comunidades verificadas</li>
                  <li>• Recibir recompensas por tu desempeño</li>
                  <li>• Transferir fondos de forma segura</li>
                  <li>• Interactuar con contratos inteligentes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

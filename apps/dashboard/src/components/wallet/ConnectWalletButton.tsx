import React from "react";
import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { SUPPORTED_NETWORKS } from "@/config/networks";
import { wallets, accountAbstractionConfig } from "@/config/wallets";

interface ConnectWalletButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

// Configuración base centralizada para todos los ConnectButton
const baseWalletConfig = {
  client,
  chains: SUPPORTED_NETWORKS.map(network => network.chain),
  wallets,
  showThirdwebBranding: false,
  showAllWallets: false,
  accountAbstraction: accountAbstractionConfig, // ⚡ GLOBAL SMART ACCOUNTS
  theme: "dark" as const,
  modalSize: "compact" as const, // 🤏 Compact Mode (No Sidebar)
  modalTitle: "Inicia Sesión" as const, // 📝 Custom Title
};

/**
 * Componente híbrido para ConnectWallet que centraliza configuración
 * pero permite personalización de callbacks y styling
 */
export function ConnectWalletButton({
  onConnect,
  onDisconnect,
  className: _className
}: ConnectWalletButtonProps) {
  return (
    <>
      <ConnectButton
        {...baseWalletConfig}
        locale="es_ES"
        autoConnect={{ timeout: 20000 }}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
    </>
  );
}

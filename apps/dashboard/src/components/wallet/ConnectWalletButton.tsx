import React from "react";
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";
import { SUPPORTED_NETWORKS } from "@/config/networks";

interface ConnectWalletButtonProps {
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

// Configuración base centralizada para todos los ConnectButton
const baseWalletConfig = {
  client,
  chains: SUPPORTED_NETWORKS.map(network => network.chain),
  wallets: [
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
  ],
  theme: "dark" as const,
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

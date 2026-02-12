"use client";

import { useConnectModal, useDisconnect, useActiveAccount, useActiveWallet } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { config } from "@/config";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { accountAbstractionConfig } from "@/lib/wallets";

interface ConnectWalletButtonProps {
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function ConnectWalletButton({
  className,
  onConnect,
  onDisconnect
}: ConnectWalletButtonProps) {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect } = useConnectModal();
  const { disconnect } = useDisconnect();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("wallet-logged-out");
      }
      await connect({
        client,
        chain: config.chain,
        showThirdwebBranding: false,
        accountAbstraction: accountAbstractionConfig,
      });
      onConnect?.();
    } catch (e) {
      console.error("Connect error:", e);
    }
  };

  const handleDisconnect = () => {
    if (!wallet) return;
    setIsDisconnecting(true);
    try {
      disconnect(wallet);
      localStorage.setItem("wallet-logged-out", "true");
      onDisconnect?.();
    } catch (e) {
      console.error("Disconnect error:", e);
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (account) {
    return (
      <button
        onClick={handleDisconnect}
        disabled={isDisconnecting}
        className={cn(
          "w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2",
          className
        )}
      >
        {isDisconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Desconectar Billetera
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className={cn(
        "w-full bg-lime-500 hover:bg-lime-400 text-black px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-lime-500/20 hover:shadow-lime-500/40",
        className
      )}
    >
      Conectar Billetera
    </button>
  );
}

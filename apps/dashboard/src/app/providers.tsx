"use client";

import { Toaster, toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider, AutoConnect } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { wallets } from "@/lib/wallets";
import { GamificationProvider } from "@pandoras/gamification";
import { GamificationDebugger } from "@/components/debug/GamificationDebugger";
import { WalletDebugger } from "@/components/debug/WalletDebugger";
import { SmartWalletGuard } from "@/components/auth/SmartWalletGuard";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";
import React, { useState, useEffect } from "react";

function ConnectedProviders({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <GamificationProvider userId={user?.address || "unauthenticated"} showHUD={!!user}>
      <GamificationDebugger />
      <WalletDebugger />
      {children}
    </GamificationProvider>
  );
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [autoConnectDisabled, setAutoConnectDisabled] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setAutoConnectDisabled(localStorage.getItem("wallet-logged-out") === "true");
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <ThirdwebProvider>
        {!autoConnectDisabled && (
          <AutoConnect
            client={client}
            wallets={wallets}
            timeout={15000}
          />
        )}

        <AuthProvider>
          <SmartWalletGuard>
            <ConnectedProviders>
              {children}
            </ConnectedProviders>
          </SmartWalletGuard>
        </AuthProvider>

        <Toaster theme="dark" richColors position="top-center" />
      </ThirdwebProvider>
    </ThemeProvider>
  );
}


"use client";

import { Toaster, toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider, AutoConnect } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { wallets, accountAbstractionConfig } from "@/lib/wallets";
import { GamificationProvider } from "@pandoras/gamification";
import { GamificationDebugger } from "@/components/debug/GamificationDebugger";
import { WalletDebugger } from "@/components/debug/WalletDebugger";
import { SmartWalletGuard } from "@/components/auth/SmartWalletGuard";

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const autoConnectDisabled =
    typeof window !== "undefined" &&
    localStorage.getItem("wallet-logged-out") === "true";

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
            accountAbstraction={accountAbstractionConfig}
            timeout={15000}
          />
        )}

        <SmartWalletGuard>
          {/* Only render Gamification if we have a valid userId, or handle it inside */}
          <GamificationProvider userId={undefined as unknown as string} showHUD={false}>
            <GamificationDebugger />
            <WalletDebugger />
            {children}
          </GamificationProvider>
        </SmartWalletGuard>

        <Toaster theme="dark" richColors position="top-center" />
      </ThirdwebProvider>
    </ThemeProvider>
  );
}

"use client";

import { Toaster, toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider, AutoConnect, useActiveAccount } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { config as appConfig } from "@/config";
import { useThirdwebUserSync } from "@/hooks/useThirdwebUserSync";
import { wallets, accountAbstractionConfig } from "@/config/wallets";
// 🎮 IMPORTAR GAMIFICATION PROVIDER
import { GamificationProvider } from "@pandoras/gamification";
import { GamificationDebugger } from "@/components/debug/GamificationDebugger";
import { WalletDebugger } from "@/components/debug/WalletDebugger";
import { SmartWalletGuard } from "@/components/auth/SmartWalletGuard";

function UserSyncWrapper() {
  useThirdwebUserSync();
  return null;
}

// 🎮 COMPONENTE PARA INTEGRAR GAMIFICACIÓN
function GamificationWrapper({ children }: { children: React.ReactNode }) {
  // Hook para obtener el userId del contexto de autenticación
  const account = useActiveAccount();
  const userId = account?.address;

  // Solo mostrar gamificación si hay usuario logueado
  if (!userId) return <>{children}</>;

  return (
    <GamificationProvider
      userId={userId}
      showHUD={true}
      hudPosition="top-right"
      onLevelUp={(level) => toast.success(`¡Nivel ${level} Alcanzado! 🎉`, {
        description: "Has desbloqueado nuevas capacidades en la plataforma.",
        duration: 5000,
      })}
    >
      {children}
    </GamificationProvider>
  );
}

export function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <ThirdwebProvider>
        <AutoConnect
          client={client}
          wallets={wallets}
          accountAbstraction={accountAbstractionConfig} // ⚡ ENFORCING Global Account Abstraction for AutoConnect
          timeout={15000}  // Increased to prevent premature timeout on navigation
          onConnect={(wallet) => {
            if (process.env.NODE_ENV === 'development') {
              console.log("🔗 AutoConnect: Wallet conectada automáticamente", wallet.id);
            }
          }}
          onTimeout={() => {
            if (process.env.NODE_ENV === 'development') {
              console.log("⏰ AutoConnect: Timeout alcanzado, sin modal forzoso");
            }
          }}
        />
        {/* 🎮 INTEGRAR GAMIFICATION WRAPPER */}
        <GamificationWrapper>
          <SmartWalletGuard>
            <GamificationDebugger />
            <WalletDebugger />
            {children}
          </SmartWalletGuard>
        </GamificationWrapper>
        {/* <UserSyncWrapper /> */}
        <Toaster
          theme="dark"
          richColors
          position="top-center"
        />
      </ThirdwebProvider>
    </ThemeProvider>
  );
}

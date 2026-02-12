"use client";

import { Toaster, toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider, useActiveAccount } from "thirdweb/react";
import { WalletRehydrator } from "@/components/wallet/WalletRehydrator";
import { GamificationProvider } from "@pandoras/gamification";
import { GamificationDebugger } from "@/components/debug/GamificationDebugger";
import { WalletDebugger } from "@/components/debug/WalletDebugger";
import { SmartWalletGuard } from "@/components/auth/SmartWalletGuard";
import { useThirdwebUserSync } from "@/hooks/useThirdwebUserSync";

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
        {/* 🔄 MANUAL REHYDRATION: Strictly enforcing Smart Account on load */}
        <WalletRehydrator />

        {/* 🎮 INTEGRAR GAMIFICATION WRAPPER */}
        <GamificationWrapper>
          {/* <SmartWalletGuard> */}
          <GamificationDebugger />
          <WalletDebugger />
          {children}
          {/* </SmartWalletGuard> */}
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

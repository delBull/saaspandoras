"use client";

import "./globals.css";
import { Toaster, toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider, AutoConnect, useActiveAccount } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";
import { useThirdwebUserSync } from "@/hooks/useThirdwebUserSync";
// 🎮 IMPORTAR GAMIFICATION PROVIDER
import { GamificationProvider } from "@pandoras/gamification";

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
  // Configuración de wallets para AutoConnect
  const wallets = [
    inAppWallet({
      auth: {
        options: [
          "google",
          "email",
          "apple",
          "facebook",
        ],
      },
      executionMode: {
        mode: "EIP7702",
        sponsorGas: true, // ⚡ Gasless transactions enabled
      },
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
  ];

  return (
    /*
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <ThirdwebProvider>
        <AutoConnect
          client={client}
          wallets={wallets}
          timeout={3000}  // Mucho menos agresivo para evitar spamming
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
        {/* 🎮 INTEGRAR GAMIFICATION WRAPPER - TEMPORARILY DISABLED FOR DEBUGGING
        <GamificationWrapper>
          {children}
        </GamificationWrapper>
        * /}
        {children}
        {/* <UserSyncWrapper /> * /}
        <Toaster
          theme="dark"
          richColors
          position="top-center"
        />
      </ThirdwebProvider>
    </ThemeProvider>
    */
    <>
      {console.log("⚠️ [Providers] ALL PROVIDERS DISABLED FOR DEBUGGING")}
      {children}
      <Toaster theme="dark" richColors position="top-center" />
    </>
  );
}

"use client";

import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider, AutoConnect } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";
import { useThirdwebUserSync } from "@/hooks/useThirdwebUserSync";

function UserSyncWrapper() {
  useThirdwebUserSync();
  return null;
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
    }),
    createWallet("io.metamask"),
    createWallet("com.coinbase.wallet"),
    createWallet("me.rainbow"),
  ];

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
          timeout={15000}
          onConnect={(wallet) => {
            console.log("🔗 AutoConnect: Wallet conectada automáticamente", wallet.id);
          }}
          onTimeout={() => {
            console.log("⏰ AutoConnect: Timeout alcanzado");
          }}
        />
        {children}
        <UserSyncWrapper />
        <Toaster
          theme="dark"
          richColors
          position="top-center"
        />
      </ThirdwebProvider>
    </ThemeProvider>
  );
}

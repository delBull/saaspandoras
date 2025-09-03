'use client';

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

// NUEVO: Imports para la configuración global de thirdweb
import { ThirdwebProvider, AutoConnect } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";

const inter = Inter({ subsets: ["latin"] });

// NUEVO: Definimos las wallets que soportará el AutoConnect
const supportedWallets = [
  inAppWallet({
    auth: {
      options: ["email", "google", "apple", "facebook", "passkey"],
    },
  }),
  createWallet("io.metamask"),
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ELIMINADO: El toast de alerta se movió al layout del dashboard,
  // para que solo aparezca en esa sección.

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-b from-zinc-950 to-black text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <ThirdwebProvider>
            {/* NUEVO: El componente invisible que maneja la auto-conexión global */}
            <AutoConnect
              client={client}
              wallets={supportedWallets}
            />
            {children}
            <Toaster theme="dark" richColors position="top-center" />
          </ThirdwebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
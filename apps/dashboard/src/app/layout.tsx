'use client';

import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider, AutoConnect } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";

const inter = Inter({ subsets: ["latin"] });


const supportedWallets = [
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
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-b from-zinc-950 to-black text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <ThirdwebProvider wallets={supportedWallets}>
            {children}
            <Toaster theme="dark" richColors position="top-center" />
          </ThirdwebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@saasfly/ui/toaster";
import { ThirdwebProvider } from "thirdweb/react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThirdwebProvider
          clientId="8a0dde1c971805259575cea5cb737530"
          activeChain="base"
        >
          {children}
          <Toaster />
        </ThirdwebProvider>
      </body>
    </html>
  );
}

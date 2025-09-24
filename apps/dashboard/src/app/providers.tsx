"use client";

import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider } from "thirdweb/react";
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
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <ThirdwebProvider>
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

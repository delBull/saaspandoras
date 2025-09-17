"use client";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThirdwebProvider } from "thirdweb/react";

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
        <Toaster
          theme="dark"
          richColors
          position="top-center"
        />
      </ThirdwebProvider>
    </ThemeProvider>
  );
}

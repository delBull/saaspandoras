'use client';

import { ThirdwebProvider } from "thirdweb/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThirdwebProvider
      clientId="8a0dde1c971805259575cea5cb737530"
      activeChain="sepolia"
    >
      {children}
    </ThirdwebProvider>
  );
}

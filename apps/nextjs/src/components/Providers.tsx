'use client';

import { ThirdwebProvider } from "thirdweb/react";
import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        dedupingInterval: 60000,
        isPaused: () => typeof document !== "undefined" && document.hidden,
      }}
    >
      <ThirdwebProvider>
        {children}
      </ThirdwebProvider>
    </SWRConfig>
  );
}

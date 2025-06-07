"use client";

import React, { ReactNode } from "react";
import { ThirdwebProvider as ThirdwebProviderV4 } from "@thirdweb-dev/react";
import { BaseSepoliaTestnet } from "@thirdweb-dev/chains";


export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThirdwebProviderV4 activeChain={BaseSepoliaTestnet} clientId={process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID} >
      {children}
    </ThirdwebProviderV4>
  );
}

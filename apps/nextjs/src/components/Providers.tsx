"use client";

import React, { ReactNode } from "react";
import { ThirdwebProvider } from "thirdweb/react";

export function Providers({ children }: { children: ReactNode }) {
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
}

import React from "react";
import { NexusProvider } from "@pandoras/display-engine";
import "@pandoras/display-engine/styles.css";

export default function DealLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NexusProvider>
      {children}
    </NexusProvider>
  );
}

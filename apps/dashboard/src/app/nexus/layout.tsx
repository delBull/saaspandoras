import React from "react";
import { NexusProvider } from "@pandoras/display-engine";
import "@pandoras/display-engine/styles.css";

export default function NexusLayout({
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

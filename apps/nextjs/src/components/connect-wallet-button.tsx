"use client";

import { ConnectButton } from "thirdweb/react";
import React from "react";
import { client } from "~/lib/thirdweb";

export function ConnectWalletButton() {
  return (
    <ConnectButton
      client={client}
      theme={"dark"}
      modalSize={"wide"}
      modalTitle={"Conecta tu Wallet"}
      modalTitleIconUrl={"/logop.svg"}
    />
  );
}
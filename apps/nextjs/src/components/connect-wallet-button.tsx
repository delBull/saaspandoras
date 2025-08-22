"use client";

import {
  ConnectButton,
  //useActiveAccount,
  //useActiveWallet,
  //useDisconnect,
} from "thirdweb/react";
import {
  createWallet,
  inAppWallet,
} from "thirdweb/wallets";
import React from "react";
import { client } from "~/lib/thirdweb-client";
import { chain } from "~/lib/thirdweb-chain"; 

export function ConnectWalletButton() {
  //const account = useActiveAccount();
  //const wallet = useActiveWallet();
  //const { disconnect } = useDisconnect();

  return (
    <>
      <ConnectButton
        client={client}
        theme={"dark"}
        wallets={[
          inAppWallet({
            auth: {
              options: [
                "email",
                "google",
                "apple",
                "facebook",
                "passkey",
              ],
            },
            smartAccount: {
              chain, 
              sponsorGas: true,
            },
          }),
          createWallet("io.metamask"),
          createWallet("walletConnect"),
        ]}
        connectModal={{
          showThirdwebBranding: false,
          size: "compact",
        }}
      />
    </>
  );
}

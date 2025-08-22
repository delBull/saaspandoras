"use client";

import { ConnectButton } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { useDisconnect } from "thirdweb/react";
import React from "react";
import { client } from "~/lib/thirdweb-client";

export function ConnectWalletButton() {
  const account = useActiveAccount();
  const disconnect = useDisconnect();

  return (
    <>
      <ConnectButton
        client={client}
        theme={"dark"}
        wallets={[
          inAppWallet({
            auth: {
              options: ["email", "google", "apple", "facebook"],
            },
            gasless: false, // Explicitly disable gasless for inAppWallet
          }),
          createWallet("passkey"),
          createWallet("io.metamask"),
          createWallet("walletConnect"),
        ]}
      />
      {account && (
        <button
          onClick={() => disconnect(account)}
          className="ml-2 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
        >
          Disconnect
        </button>
      )}
    </>
  );
}

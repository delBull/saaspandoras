'use client';

import {
  useActiveAccount,
  useReadContract,
  useConnectModal,
} from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { getContract } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { PANDORAS_KEY_ABI } from "@/lib/pandoras-key-abi";
import { NFTGatingClient } from "./nft-gating/nft-gating-client";
import { Loader2 } from "lucide-react";
import { config } from "@/config"; // Import the central config

export function NFTGate({ children }: { children: React.ReactNode }) {
  const account = useActiveAccount();
  const { connect, isConnecting } = useConnectModal();

  const contract = getContract({
    client,
    chain: config.chain, // Use chain from config
    address: config.nftContractAddress, // Use NFT contract address from config
    abi: PANDORAS_KEY_ABI,
  });

  const { data: hasKey, isLoading } = useReadContract({
    contract,
    method: "isGateHolder",
    params: account ? [account.address] : ["0x0000000000000000000000000000000000000000"],
    queryOptions: {
      enabled: !!account,
    },
  });

  if (!account) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Access Restricted</h2>
          <p className="mt-2 text-gray-600">
            Please connect your wallet to verify your access key.
          </p>
          <div className="mt-4">
            <button
              onClick={() =>
                connect({
                  client,
                  chain: config.chain, // Use chain from config for the connect modal
                  wallets: [
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
                      executionMode: {
                        mode: "EIP7702",
                        sponsorGas: true,
                      },
                    }),
                    createWallet("io.metamask"),
                    createWallet("walletConnect"),
                  ],
                })
              }
              disabled={isConnecting}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (hasKey) {
    return <>{children}</>;
  }

  return <NFTGatingClient />;
}

'use client';

import { useConnectModal, useActiveWallet, AccountAvatar, AccountBlobbie, NFTMedia, AccountProvider, NFTProvider, useDisconnect } from "thirdweb/react";
import { getContract } from "thirdweb";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import React, { useState, useEffect } from "react";
import { client } from "~/lib/thirdweb-client";
import { chain } from "~/lib/thirdweb-chain";
import { motion } from "framer-motion";
import { getOwnedNFTs } from "thirdweb/extensions/erc721";

export function ConnectWalletButton() {
  const { connect, isConnecting } = useConnectModal();
  const { disconnect } = useDisconnect();
  const wallet = useActiveWallet();
  const [hasNFT, setHasNFT] = useState(false);

  const pandorasKeyContract = getContract({
    client,
    chain,
    address: "0x720f378209a5c68f8657080a28ea6452518f67b0",
  });

  useEffect(() => {
    const checkNFT = async () => {
      if (wallet) {
        const account = wallet.getAccount();
        if (account) {
          const nfts = await getOwnedNFTs({ contract: pandorasKeyContract, owner: account.address });
          setHasNFT(nfts.length > 0);
        }
      } else {
        setHasNFT(false);
      }
    };
    checkNFT();
  }, [wallet, pandorasKeyContract]);

  if (wallet) {
    if (hasNFT) {
      return null;
    }

    const account = wallet.getAccount();
    if (!account) return null;

    return (
      <div className="relative group">
        <AccountProvider address={account.address} client={client}>
          <div
            className="flex items-center space-x-2 cursor-pointer rounded-[40px] p-2"
            style={{
              boxShadow: "0px 0.7065919983928324px 0.7065919983928324px -0.625px rgba(0, 0, 0, 0.18456), 0px 1.8065619053231785px 1.8065619053231785px -1.25px rgba(0, 0, 0, 0.17997), 0px 3.6217592146567767px 3.6217592146567767px -1.875px rgba(0, 0, 0, 0.17241), 0px 6.8655999097303715px 6.8655999097303715px -2.5px rgba(0, 0, 0, 0.15889), 0px 13.646761411524492px 13.646761411524492px -3.125px rgba(0, 0, 0, 0.13064), 0px 30px 30px -3.75px rgba(0, 0, 0, 0.0625)",
              backgroundColor: "rgb(0, 0, 0)",
            }}
          >
            {/* Account Avatar or Blobbie */}
            <AccountAvatar
              className="w-8 h-8 rounded-full"
              loadingComponent={<AccountBlobbie className="w-8 h-8 rounded-full" />}
            />
            <span className="text-gray-200 text-[14px] whitespace-nowrap">Pandorian</span>
          </div>
        </AccountProvider>

        {/* Dropdown Content */}
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 w-56 p-4 rounded-[20px] shadow-lg opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-in-out transform"
          style={{
            backgroundColor: "rgb(0, 0, 0)",
            boxShadow: "0px 0.7065919983928324px 0.7065919983928324px -0.625px rgba(0, 0, 0, 0.18456), 0px 1.8065619053231785px 1.8065619053231785px -1.25px rgba(0, 0, 0, 0.17997), 0px 3.6217592146567767px 3.6217592146567767px -1.875px rgba(0, 0, 0, 0.17241), 0px 6.8655999097303715px 6.8655999097303715px -2.5px rgba(0, 0, 0, 0.15889), 0px 13.646761411524492px 13.646761411524492px -3.125px rgba(0, 0, 0, 0.13064), 0px 30px 30px -3.75px rgba(0, 0, 0, 0.0625)",
          }}
        >
          <button
            onClick={() => disconnect(wallet!)}
            className="flex items-center justify-between w-full text-left hover:bg-gray-800 p-2 rounded-md"
          >
            <div className="flex items-center">
              <NFTProvider contract={pandorasKeyContract} tokenId={0n}>
                <NFTMedia
                  className="w-8 h-8 rounded-full"
                  loadingComponent={<span className="text-gray-400">Loading...</span>}
                />
              </NFTProvider>
              <span className="ml-2 text-white">Disconnect</span>
            </div>
            <p className="text-gray-400 text-xs break-words text-right">
              {pandorasKeyContract.address.slice(0, 6)}...{pandorasKeyContract.address.slice(-4)}
            </p>
          </button>
        </div>
      </div>
    );
  }

  // If not connected, render the original button
  return (
    <motion.button
      onClick={() =>
        connect({
          client,
          showThirdwebBranding: false, 
          size: "compact",
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
              smartAccount: {
                chain,
                sponsorGas: true,
              },
            }),
            createWallet("io.metamask"),
            createWallet("walletConnect"),
          ],
        })
      }
      disabled={isConnecting}
      className="relative flex items-center justify-center overflow-hidden rounded-[40px] cursor-pointer will-change-transform group"
      style={{
        boxShadow: "0px 0.7065919983928324px 0.7065919983928324px -0.625px rgba(0, 0, 0, 0.18456), 0px 1.8065619053231785px 1.8065619053231785px -1.25px rgba(0, 0, 0, 0.17997), 0px 3.6217592146567767px 3.6217592146567767px -1.875px rgba(0, 0, 0, 0.17241), 0px 6.8655999097303715px 6.8655999097303715px -2.5px rgba(0, 0, 0, 0.15889), 0px 13.646761411524492px 13.646761411524492px -3.125px rgba(0, 0, 0, 0.13064), 0px 30px 30px -3.75px rgba(0, 0, 0, 0.0625)",
        padding: "2px 32px",
        height: "min-content",
        width: "min-content",
      }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.25, ease: [0.12, 0.23, 0.5, 1] }}
    >
      {/* Border */}
      <motion.div
        className="absolute inset-0 rounded-[40px]"
        style={{ backgroundColor: "rgb(60, 63, 68)" }}
      />

      {/* Border-Shine */}
      <motion.div
        className="absolute inset-0 rounded-[40px]"
        style={{ backgroundColor: "rgb(90, 97, 101)" }}
      />

      {/* Fill */}
      <motion.div
        className="absolute inset-px rounded-[40px]"
        style={{ backgroundColor: "rgb(0, 0, 0)" }}
        whileHover={{ opacity: 0.75 }}
        transition={{ duration: 0.25, ease: [0.12, 0.23, 0.5, 1] }}
      />

      {/* Message */}
      <div className="relative flex flex-row items-center justify-between p-0 w-full">
        {/* Text */}
        <span
          className="z-10 text-[14px] leading-[1.7em] text-gray-400 whitespace-nowrap"
        >
          Get your Pandora's Key&emsp; 
        </span>

        {/* Button Text */}
        <span
          className="z-10 text-[14px] leading-[1.7em] text-gray-200"
        >
          {isConnecting ? "Conectando..." : "🔑"}
        </span>
      </div>
    </motion.button>
  );
}

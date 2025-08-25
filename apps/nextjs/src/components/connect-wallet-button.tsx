'use client';

import { useConnectModal, useActiveWallet } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import React from "react";
import { client } from "~/lib/thirdweb-client";
import { chain } from "~/lib/thirdweb-chain";
import { motion } from "framer-motion";

export function ConnectWalletButton() {
  const { connect, isConnecting } = useConnectModal();
  const wallet = useActiveWallet();

  if (wallet) {
    return null;
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
                  "passkey"
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
        padding: "2px 16px",
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
          className="z-10 text-[14px] leading-[1.7em] text-gray-200 whitespace-nowrap"
        >
          Get your Pandora's Key
        </span>

        {/* Button Text */}
        <span
          className="z-10 text-[14px] leading-[1.7em] text-gray-200 pl-2"
        >
          {isConnecting ? "Conectando..." : "🔑"}
        </span>
      </div>
    </motion.button>
  );
}
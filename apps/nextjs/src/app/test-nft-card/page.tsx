"use client";

import { SuccessNFTCard } from "~/components/success-nft-card";

export default function TestNftCardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <SuccessNFTCard onAnimationComplete={() => console.log("Animation complete on test page")} />
    </div>
  );
} 

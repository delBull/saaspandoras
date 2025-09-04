'use client';

import React from "react";

const CHAIN_NAMES: Record<number, string> = {
  8453: "Base",
  1: "Ethereum",
  11155111: "Sepolia",
  137: "Polygon",
  42161: "Arbitrum",
  // Puedes agregar más redes aquí
};

const CHAIN_COLORS: Record<number, string> = {
  8453: "bg-blue-600 text-white",
  1: "bg-neutral-900 text-white",
  11155111: "bg-fuchsia-700 text-white",
  137: "bg-purple-600 text-white",
  42161: "bg-sky-500 text-white",
};

export function BadgeChain({ chainId, className }: { chainId: number; className?: string; }) {
  const name = CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
  const color = CHAIN_COLORS[chainId] ?? "bg-gray-400 text-black";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${color} ${className || ""}`}
    >
      {name}
    </span>
  );
}
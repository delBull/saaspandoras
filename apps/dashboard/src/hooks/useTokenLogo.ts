'use client';

import { useState } from "react";

const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
];

// Utilidad universal para transformar logoURI de tokenlist (http, ipfs://, etc.)
export function useTokenLogo(
  uri: string | undefined | null,
  fallback = "/images/default-token.png",
) {
  const [gatewayIdx, setGatewayIdx] = useState(0);
  
  let resolved = fallback;

  if (uri) {
    if (uri.startsWith("ipfs://")) {
      const path = uri.replace("ipfs://", "");
      // Aseguramos que el gatewayIdx no se salga de los límites del array
      resolved = (IPFS_GATEWAYS[gatewayIdx] || IPFS_GATEWAYS[0]) + path;
    } else {
      resolved = uri;
    }
  }

  // Soporta fallback: va cambiando de gateway en errores de carga
  const handleImgError = () => {
    if (
      uri &&
      uri.startsWith("ipfs://") &&
      gatewayIdx < IPFS_GATEWAYS.length - 1
    ) {
      setGatewayIdx((idx) => idx + 1);
    }
  };

  return {
    logoURI: resolved,
    handleImgError,
  };
}
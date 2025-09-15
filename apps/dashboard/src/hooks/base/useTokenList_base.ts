import { BASE_TOKENLIST } from "@/lib/tokens/baseTokenList";
import type { Token } from "@/types/token";

export function useTokenList_base(chainId: number): Token[] {
  // Devuelve sólo tokens para BASE si es la red activa
  return chainId === 8453 ? BASE_TOKENLIST : [];
}

export interface Token {
  name: string;
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
  image?: string;
}

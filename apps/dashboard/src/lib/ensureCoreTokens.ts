import type { Token } from "@/types/token";

const CORE_TOKENS: Record<number, Token[]> = {
  1: [
    {
      name: "Wrapped Ether",
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      symbol: "WETH",
      decimals: 18,
      chainId: 1,
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
    },
    {
      name: "USD Coin",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      decimals: 6,
      chainId: 1,
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
    },
  ],
  137: [
    {
      name: "Polygon",
      address: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      symbol: "POL",
      decimals: 18,
      chainId: 137,
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270/logo.png",
    },
    {
      name: "USD Coin (bridged)",
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      symbol: "USDC",
      decimals: 6,
      chainId: 137,
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/logo.png",
    },
    {
      name: "Tether USD",
      address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
      symbol: "USDT",
      decimals: 6,
      chainId: 137,
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/polygon/assets/0xc2132D05D31c914a87C6611C10748AEb04B58e8F/logo.png",
    },
  ],
  42161: [
    {
      name: "Wrapped Ether",
      address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
      symbol: "WETH",
      decimals: 18,
      chainId: 42161,
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/arbitrum/assets/0x82af49447d8a07e3bd95bd0d56f35241523fbab1/logo.png",
    },
  ],
  10: [
    {
      name: "Wrapped Ether",
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18,
      chainId: 10,
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/optimism/assets/0x4200000000000000000000000000000000000006/logo.png",
    },
  ],
  8453: [
    {
      name: "Wrapped Ether",
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18,
      chainId: 8453,
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x4200000000000000000000000000000000000006/logo.png",
    },
    {
      name: "USD Coin",
      address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      symbol: "USDC",
      decimals: 6,
      chainId: 8453,
      logoURI:
        "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913/logo.png",
    },
  ],
};

export function injectCoreTokens(
  tokenList: Token[],
  chainId: number,
): Token[] {
  const coreList = CORE_TOKENS[chainId] ?? [];
  const merged = [...coreList, ...tokenList];

  // Excluye legacy nativo de Polygon
  const blacklist =
    chainId === 137
      ? ["0x0000000000000000000000000000000000001010"]
      : [];

  const uniqueTokens = merged.filter(
    (token, idx, arr) =>
      !blacklist.includes(token.address.toLowerCase()) &&
      arr.findIndex(
        (t) => t.address.toLowerCase() === token.address.toLowerCase(),
      ) === idx,
  );

  return uniqueTokens.map((token) => {
    const core = coreList.find(
      (t) => t.address.toLowerCase() === token.address.toLowerCase(),
    );
    // Si el token está en nuestra lista principal, nos aseguramos de que tenga los datos correctos.
    if (core) {
      return {
        ...token,
        name: core.name,
        symbol: core.symbol,
        decimals: core.decimals,
        logoURI: core.logoURI,
        image: core.logoURI,
      };
    }
    return token;
  });
}
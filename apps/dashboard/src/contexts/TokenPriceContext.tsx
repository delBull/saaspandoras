'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Types for token prices
export interface TokenPrices {
  ETH: number;
  POL: number;
  ARB: number;
  USDC: number;
  USDT: number;
}

// Create context with null as default
const TokenPriceContext = createContext<TokenPrices | null>(null);

// Custom hook for fetching real-time token prices
function useTokenPrices(): TokenPrices {
  const [prices, setPrices] = useState<TokenPrices>({
    ETH: 2500,
    POL: 0.8,
    ARB: 0.6,
    USDC: 1,
    USDT: 1,
  });

  useEffect(() => {
    const fetchPrices = async (): Promise<void> => {
      try {
        // Using CoinGecko API (free tier) for real-time prices
        // Note: Using 'polygon-ecosystem-token' for POL (new native token)
        // Fallback to 'matic-network' for backward compatibility
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,polygon-ecosystem-token,matic-network,arbitrum,usd-coin,tether&vs_currencies=usd'
        );

        if (response.ok) {
          const data = await response.json() as {
            ethereum?: { usd: number };
            'polygon-ecosystem-token'?: { usd: number };
            'matic-network'?: { usd: number };
            arbitrum?: { usd: number };
            'usd-coin'?: { usd: number };
            tether?: { usd: number };
          };

          // Use POL price (polygon-ecosystem-token) if available, fallback to MATIC
          const polPrice = data['polygon-ecosystem-token']?.usd ?? data['matic-network']?.usd ?? 0.8;

          setPrices({
            ETH: data.ethereum?.usd ?? 2500,
            POL: polPrice, // ✅ Using POL price (new Polygon native token)
            ARB: data.arbitrum?.usd ?? 0.6, // ✅ ARB token price
            USDC: data['usd-coin']?.usd ?? 1,
            USDT: data.tether?.usd ?? 1,
          });

          console.log('Token prices updated:', {
            ETH: data.ethereum?.usd ?? 2500,
            POL: polPrice,
            ARB: data.arbitrum?.usd ?? 0.6,
            USDC: data['usd-coin']?.usd ?? 1,
            USDT: data.tether?.usd ?? 1,
          });
        }
      } catch (error) {
        console.error('Error fetching token prices:', error);
        // Keep default prices on error
      }
    };

    // Fetch prices immediately
    void fetchPrices();

    // Set up interval to fetch prices every 30 seconds
    const interval = setInterval(() => void fetchPrices(), 30000);

    return () => clearInterval(interval);
  }, []);

  return prices;
}

// Provider component
interface TokenPriceProviderProps {
  children: ReactNode;
}

export function TokenPriceProvider({ children }: TokenPriceProviderProps) {
  const prices = useTokenPrices();

  return (
    <TokenPriceContext.Provider value={prices}>
      {children}
    </TokenPriceContext.Provider>
  );
}

// Custom hook to use token prices
export function useTokenPricesContext(): TokenPrices {
  const context = useContext(TokenPriceContext);

  if (!context) {
    throw new Error('useTokenPricesContext must be used within a TokenPriceProvider');
  }

  return context;
}
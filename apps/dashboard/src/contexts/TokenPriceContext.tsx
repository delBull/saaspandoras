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

export interface TokenPriceState extends TokenPrices {
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

// Create context with null as default
const TokenPriceContext = createContext<TokenPriceState | null>(null);

// Custom hook for fetching real-time token prices
function useTokenPrices(): TokenPriceState {
  const [prices, setPrices] = useState<TokenPriceState>({
    ETH: 2500,
    POL: 0.8,
    ARB: 0.6,
    USDC: 1,
    USDT: 1,
    isLoading: false,
    lastUpdated: null,
    error: null,
  });

  useEffect(() => {
    const fetchPrices = async (): Promise<void> => {
      // Set loading state
      setPrices(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        console.log('🔄 Fetching token prices from CoinGecko API...');

        // Using CoinGecko API (free tier) for real-time prices
        // Note: Using 'polygon-ecosystem-token' for POL (new native token)
        // Fallback to 'matic-network' for backward compatibility
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,polygon-ecosystem-token,matic-network,arbitrum,usd-coin,tether&vs_currencies=usd',
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            }
          }
        );

        clearTimeout(timeoutId);

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

          const newPrices: TokenPriceState = {
            ETH: data.ethereum?.usd ?? 2500,
            POL: polPrice, // ✅ Using POL price (new Polygon native token)
            ARB: data.arbitrum?.usd ?? 0.6, // ✅ ARB token price
            USDC: data['usd-coin']?.usd ?? 1,
            USDT: data.tether?.usd ?? 1,
            isLoading: false,
            lastUpdated: new Date(),
            error: null,
          };

          setPrices(newPrices);

          console.log('✅ Token prices updated successfully:', {
            ETH: newPrices.ETH,
            POL: newPrices.POL,
            ARB: newPrices.ARB,
            USDC: newPrices.USDC,
            USDT: newPrices.USDT,
            lastUpdated: newPrices.lastUpdated,
          });
        } else {
          console.warn('⚠️ CoinGecko API returned non-ok status:', response.status, response.statusText);
          throw new Error(`API responded with status: ${response.status}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Don't log "Failed to fetch" as error - it's usually network related
        // and we have fallback prices
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('⚠️ Token price fetch timed out, using default prices');
        } else if (!errorMessage.includes('Failed to fetch')) {
          console.error('❌ Error fetching token prices:', errorMessage);
        } else {
          console.warn('⚠️ Network error fetching token prices, using defaults');
        }

        // Set error state but keep previous prices
        setPrices(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
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
export function useTokenPricesContext(): TokenPriceState {
  const context = useContext(TokenPriceContext);

  if (!context) {
    throw new Error('useTokenPricesContext must be used within a TokenPriceProvider');
  }

  return context;
}

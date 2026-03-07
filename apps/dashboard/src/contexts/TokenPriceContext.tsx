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

import useSWR from 'swr';

const fetcher = async (url: string) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  const response = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
  clearTimeout(timeoutId);
  if (!response.ok) throw new Error(`API responded with status: ${response.status}`);
  return response.json();
};

// Custom hook for fetching real-time token prices
function useTokenPrices(): TokenPriceState {
  const { data, error, isLoading } = useSWR('/api/prices', fetcher, {
    // 🛡️ Optimization: SWR automatically caches, deduplicates, and manages focus
    refreshInterval: 120000, // 120 seconds polling
    revalidateOnFocus: false, // Do not spam requests on window focus
    dedupingInterval: 60000, // Do not make same request within 1 min
  });

  if (error) {
    if (error.name !== 'AbortError' && !error.message?.includes('Failed to fetch')) {
      console.error('❌ Error fetching token prices:', error.message);
    } else if (error.name === 'AbortError') {
      console.warn('⚠️ Token price fetch timed out, using default prices');
    }
  }

  const typedData = data as {
    ethereum?: { usd: number };
    'polygon-ecosystem-token'?: { usd: number };
    'matic-network'?: { usd: number };
    arbitrum?: { usd: number };
    'usd-coin'?: { usd: number };
    tether?: { usd: number };
  } | undefined;

  // Use POL price (polygon-ecosystem-token) if available, fallback to MATIC
  const polPrice = typedData?.['polygon-ecosystem-token']?.usd ?? typedData?.['matic-network']?.usd ?? 0.8;

  return {
    ETH: typedData?.ethereum?.usd ?? 2500,
    POL: polPrice,
    ARB: typedData?.arbitrum?.usd ?? 0.6,
    USDC: typedData?.['usd-coin']?.usd ?? 1,
    USDT: typedData?.tether?.usd ?? 1,
    isLoading,
    lastUpdated: typedData ? new Date() : null,
    error: error ? error.message : null,
  };
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

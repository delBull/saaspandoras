'use client';

import React, { useState, useEffect } from "react";
import { Bridge } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { defineChain } from "thirdweb/chains";
import { toast } from "sonner";
import Image from 'next/image';
import type { Token } from "@/types/token";

interface TokenRoutesProps {
  fromChainId: number;
  toChainId: number;
  fromToken: Token | null;
  toToken: Token | null;
  onRoutesChange: (routes: Bridge.Route[]) => void;
  onTokenChange: (token: Token) => void;
}

export function TokenRoutes({ fromChainId, toChainId, fromToken, toToken, onRoutesChange, onTokenChange }: TokenRoutesProps) {
  const [availableRoutes, setAvailableRoutes] = useState<Bridge.Route[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);

  // Fetch available tokens using Bridge.tokens
  useEffect(() => {
    async function fetchTokens() {
      try {
        const allTokens = await Bridge.tokens({
          limit: 100,
          client,
        });
        // Map Thirdweb tokens to our Token interface
        const mappedTokens = allTokens.map((t) => ({
          name: t.name,
          address: t.address,
          symbol: t.symbol,
          decimals: t.decimals,
          chainId: t.chainId,
          logoURI: t.iconUri, // iconUri is the correct property from thirdweb
          image: t.iconUri,
        }));
        setTokens(mappedTokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        toast.error('Error loading tokens');
      }
    }
    void fetchTokens();
  }, []);

  // Check bridge availability using Bridge.Sell.quote
  useEffect(() => {
    if (!fromToken || !toToken) {
      setAvailableRoutes([]);
      onRoutesChange([]);
      return;
    }

    async function checkBridgeAvailability() {
      setIsLoadingRoutes(true);
      try {
        // Check if bridge is available by trying to get a quote
        await Bridge.Sell.quote({
          originChainId: fromToken!.chainId,
          originTokenAddress: fromToken!.address,
          destinationChainId: toToken!.chainId,
          destinationTokenAddress: toToken!.address,
          amount: 1000000n, // Small test amount (0.000001 for most tokens)
          client,
        });

        // If we get a quote, bridge is available - create a mock route for UI
        const mockRoute: Bridge.Route = {
          originToken: {
            chainId: fromToken!.chainId,
            address: fromToken!.address,
            symbol: fromToken!.symbol,
            name: fromToken!.name,
            decimals: fromToken!.decimals,
          },
          destinationToken: {
            chainId: toToken!.chainId,
            address: toToken!.address,
            symbol: toToken!.symbol,
            name: toToken!.name,
            decimals: toToken!.decimals,
          },
        } as Bridge.Route;

        console.log(`Bridge available for ${fromToken!.symbol} -> ${toToken!.symbol}`);
        setAvailableRoutes([mockRoute]);
        onRoutesChange([mockRoute]);
      } catch (error) {
        console.error('Bridge not available for this pair:', error);
        toast.error('No routes available for this pair');
        setAvailableRoutes([]);
        onRoutesChange([]);
      } finally {
        setIsLoadingRoutes(false);
      }
    }
    void checkBridgeAvailability();
  }, [fromToken, toToken, onRoutesChange]);

  // Handle token selection from Bridge.tokens
  const handleTokenSelect = (selectedToken: Token) => {
    const token: Token = {
      ...selectedToken
    };
    onTokenChange(token); // onTokenChange expects our internal Token type
  };

  if (isLoadingRoutes) {
    return <div className="text-center p-4">Loading routes...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Token Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-2">From Tokens</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tokens
              .filter(t => t.chainId === fromChainId)
              .slice(0, 10)
              .map(token => (
                <button
                  key={token.address}
                  onClick={() => handleTokenSelect(token)}
                  className={`w-full p-2 rounded text-left hover:bg-gray-100 ${
                    fromToken?.address === token.address ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src={token.logoURI ?? '/default-token.png'} 
                      alt={token.symbol}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => e.currentTarget.src = '/default-token.png'} 
                    />
                    <span>{token.symbol} - {token.name}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">To Tokens</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {tokens
              .filter(t => t.chainId === toChainId)
              .slice(0, 10)
              .map(token => (
                <button
                  key={token.address}
                  onClick={() => handleTokenSelect(token)}
                  className={`w-full p-2 rounded text-left hover:bg-gray-100 ${
                    toToken?.address === token.address ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Image
                      src={token.logoURI ?? '/default-token.png'} 
                      alt={token.symbol}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full"
                      onError={(e) => e.currentTarget.src = '/default-token.png'}
                    />
                    <span>{token.symbol} - {token.name}</span>
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Available Routes */}
      {availableRoutes.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Available Routes ({availableRoutes.length})</h3>
          <div className="space-y-2">
            {availableRoutes.map((route, index) => (
              <div key={index} className="p-3 bg-green-50/10 text-white rounded border border-green-500/20">
                <p className="font-medium"> 
                  {route.originToken.symbol} ({route.originToken.name}) →{" "}
                  {route.destinationToken.symbol} ({route.destinationToken.name})
                </p>
                <p className="text-sm text-gray-400">
                  Chain: {defineChain(route.originToken.chainId).name} →{" "}
                  {defineChain(route.destinationToken.chainId).name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {availableRoutes.length === 0 && fromToken && toToken && (
        <div className="p-3 bg-yellow-50 rounded border">
          <p className="text-sm text-yellow-800">
            No direct routes found for {fromToken.symbol} → {toToken.symbol}. Try different token pairs or chains.
          </p>
        </div>
      )}
    </div>
  );
}

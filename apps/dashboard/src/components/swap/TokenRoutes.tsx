'use client';

import React, { useState, useEffect } from "react";
import { Bridge } from "thirdweb";
import { client } from "@/lib/thirdweb-client";
import { defineChain } from "thirdweb/chains";
import { toast } from "sonner";

interface Token {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
}

interface Route {
  originToken: Token;
  destinationToken: Token;
}

interface TokenRoutesProps {
  fromChainId: number;
  toChainId: number;
  fromToken: Token | null;
  toToken: Token | null;
  onRoutesChange: (routes: Route[]) => void;
  onTokenChange: (token: Token) => void;
}

export function TokenRoutes({ fromChainId, toChainId, fromToken, toToken, onRoutesChange, onTokenChange }: TokenRoutesProps) {
  const [availableRoutes, setAvailableRoutes] = useState<Route[]>([]);
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
        // Map Thirdweb TokenWithPrices to our Token interface
        const mappedTokens = allTokens.map((t: any) => ({
          name: t.name,
          address: t.address,
          symbol: t.symbol,
          decimals: t.decimals,
          chainId: t.chainId,
          logoURI: t.iconUri,
        })) as Token[];
        setTokens(mappedTokens);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        toast.error('Error loading tokens');
      }
    }
    fetchTokens();
  }, []);

  // Fetch available routes using Bridge.routes
  useEffect(() => {
    if (!fromToken || !toToken) {
      setAvailableRoutes([]);
      onRoutesChange([]);
      return;
    }

    async function fetchRoutes() {
      setIsLoadingRoutes(true);
      try {
        const routes = await Bridge.routes({
          originChainId: fromToken!.chainId,
          originTokenAddress: fromToken!.address,
          destinationChainId: toToken!.chainId,
          destinationTokenAddress: toToken!.address,
          client,
        });
        
        console.log(`Found ${routes.length} routes for ${fromToken!.symbol} -> ${toToken!.symbol}`);
        const routeObjects = routes.map(route => ({
          originToken: fromToken!,
          destinationToken: toToken!,
        }));
        setAvailableRoutes(routeObjects);
        onRoutesChange(routeObjects);
      } catch (error) {
        console.error('Error fetching routes:', error);
        toast.error('No routes available for this pair');
        setAvailableRoutes([]);
        onRoutesChange([]);
      } finally {
        setIsLoadingRoutes(false);
      }
    }
    fetchRoutes();
  }, [fromToken, toToken]);

  // Handle token selection from Bridge.tokens
  const handleTokenSelect = (selectedToken: any) => {
    const token: Token = {
      name: selectedToken.name,
      address: selectedToken.address,
      symbol: selectedToken.symbol,
      decimals: selectedToken.decimals,
      chainId: selectedToken.chainId,
      logoURI: selectedToken.iconUri || '',
    };
    onTokenChange(token);
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
                    <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded" onError={(e) => e.currentTarget.src = '/default-token.png'} />
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
                    <img src={token.logoURI} alt={token.symbol} className="w-6 h-6 rounded" onError={(e) => e.currentTarget.src = '/default-token.png'} />
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
              <div key={index} className="p-3 bg-green-50 rounded border">
                <p className="font-medium">
                  {route.originToken.symbol} ({route.originToken.name}) →{" "}
                  {route.destinationToken.symbol} ({route.destinationToken.name})
                </p>
                <p className="text-sm text-gray-600">
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
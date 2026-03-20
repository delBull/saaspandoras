'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Chain } from 'thirdweb/chains';

// Types for network configuration
interface NetworkToken {
  name: string;
  symbol: string;
  isNative: boolean;
  address?: string;
}

interface NetworkConfig {
  chain: Chain;
  name: string;
  symbol: string;
  tokens: NetworkToken[];
}

interface NetworkSelectorProps {
  selectedChain: Chain;
  onChainChange: (chain: Chain) => void;
  supportedNetworks: NetworkConfig[];
}

export function NetworkSelector({ selectedChain, onChainChange, supportedNetworks }: NetworkSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 hover:bg-zinc-800/50 rounded-md transition-all group"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-lime-500 rounded-full shadow-[0_0_8px_rgba(163,230,53,0.5)]"></div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 group-hover:text-lime-400 pb-0.5">
            {supportedNetworks.find(n => n.chain.id === selectedChain.id)?.name ?? "Network"}
          </span>
        </div>
        <div className="flex items-center">
          <motion.svg
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="w-3 h-3 text-gray-600 group-hover:text-lime-400 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </button>

      {/* Network Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 network-dropdown-content"
          >
            <div className="p-2 space-y-1">
              {supportedNetworks.map((network) => (
                <button
                  key={network.chain.id}
                  onClick={() => {
                    onChainChange(network.chain);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-zinc-800 rounded transition-colors"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-mono text-gray-300">{network.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

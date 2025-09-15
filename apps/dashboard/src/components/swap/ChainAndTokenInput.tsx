'use client';

import { Button } from "@saasfly/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@saasfly/ui/dropdown-menu";
import { Input } from "@saasfly/ui/input";
import { TokenImage } from "../TokenImage";
import type { Token } from "@/types/token";
import { ChevronDownIcon } from "lucide-react";

interface Chain {
  id: number;
  name: string;
  logoUrl?: string;
  disabled?: boolean;
}

interface ChainAndTokenInputProps {
  label: string;
  selectedChainId: number;
  onChainChange: (chainId: number) => void;
  selectedToken: Token | null;
  onTokenSelect: () => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  chains: Chain[];
  balance?: string;
  onMax?: () => void;
  disabled?: boolean;
  isAmountReadOnly?: boolean;
  amountComponent?: React.ReactNode;
  hideChainSelector?: boolean;
}

export function ChainAndTokenInput({
  label,
  selectedChainId,
  onChainChange,
  selectedToken,
  onTokenSelect,
  amount,
  onAmountChange,
  chains,
  balance,
  onMax,
  disabled,
  isAmountReadOnly = false,
  amountComponent,
  hideChainSelector = false,
}: ChainAndTokenInputProps) {
  const selectedChain = chains.find(c => c.id === selectedChainId);

  return (
    <div className="bg-zinc-800 p-3 rounded-xl flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {!hideChainSelector && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-1 h-auto">
                  {selectedChain ? (
                    <div className="flex items-center gap-2">
                      <TokenImage src={selectedChain.logoUrl ?? `/tokens/generic.png`} alt={selectedChain.name} size={20} />
                      <span className="text-sm font-medium text-white">{selectedChain.name}</span>
                      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  ) : <span className="text-sm font-medium text-white">Select Chain</span>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-white">
                {chains.map(chain => (
                  <DropdownMenuItem key={chain.id} onSelect={() => onChainChange(chain.id)} disabled={chain.disabled}>
                    <TokenImage src={chain.logoUrl ?? `/tokens/generic.png`} alt={chain.name} size={20} className="mr-2" />
                    {chain.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <span className="text-xs text-gray-400">{label}</span>
        </div>
        {balance && <span>Saldo: {balance}</span>}
      </div>
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Cantidad de ${selectedToken?.symbol ?? 'token'}`}
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.]/g, ''))}
          disabled={disabled || isAmountReadOnly}
          readOnly={isAmountReadOnly}
          className="w-full text-3xl font-mono text-white focus:outline-none border-none p-0 h-auto bg-transparent"
        />
        <Button onClick={onTokenSelect} variant="secondary" className="flex items-center gap-2 rounded-full font-semibold h-auto py-1.5 px-3 shrink-0">
          {selectedToken ? (
            <TokenImage src={selectedToken.logoURI ?? ''} alt={selectedToken.symbol} size={24} className="rounded-full" />
          ) : null}
          {selectedToken?.symbol ?? "Seleccionar"}
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </Button>
      </div>
      {onMax && (
        <Button onClick={onMax} variant="ghost" disabled={!balance || disabled} className="text-xs px-2 py-1 h-auto text-lime-400 hover:text-lime-300 -ml-2">MAX</Button>
      )}
    </div>
  );
}
'use client';

import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@saasfly/ui/select";
import { TokenImage } from '../TokenImage';

interface Token {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI?: string;
}

interface Chain {
  id: number;
  name: string;
  icon?: string;
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
}: ChainAndTokenInputProps) {
  return (
    <div className="bg-zinc-800 p-4 rounded-xl space-y-2">
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>{label}</span>
        {balance && <span>Saldo: {balance}</span>}
      </div>
      <div className="flex items-center gap-2">
        {isAmountReadOnly ? (
          <div className="w-full text-3xl font-mono text-white h-[40px] flex items-center">
            {amountComponent}
          </div>
        ) : (
          <Input
            aria-label={`Cantidad de ${selectedToken?.symbol ?? 'token'}`}
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value.replace(",", "."))}
            disabled={disabled}
            className="w-full text-3xl font-mono text-white focus:outline-none border-none p-0 h-auto bg-transparent"
          />
        )}
        <div className="flex flex-col items-end gap-2">
          <Select value={String(selectedChainId)} onValueChange={(val) => onChainChange(Number(val))}>
            <SelectTrigger className="bg-zinc-900 border-zinc-700 h-auto py-1.5">
              <SelectValue placeholder="Seleccionar red" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 text-white border-zinc-700">
              {chains.map(chain => (
                <SelectItem key={chain.id} value={String(chain.id)}>{chain.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={onTokenSelect} variant="secondary" className="flex items-center gap-2 rounded-full font-semibold h-auto py-1.5">
            {selectedToken ? (
              <TokenImage src={selectedToken.logoURI ?? ''} alt={selectedToken.symbol} size={24} className="rounded-full" />
            ) : null}
            {selectedToken?.symbol ?? "Seleccionar"}
          </Button>
        </div>
      </div>
      {onMax && (
        <Button onClick={onMax} variant="ghost" disabled={!balance || disabled} className="text-xs px-2 py-1 h-auto text-lime-400 hover:text-lime-300 -ml-2">MAX</Button>
      )}
    </div>
  );
}
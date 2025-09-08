'use client';

import { Input } from "@saasfly/ui/input";
import { Button } from "@saasfly/ui/button";
import { TokenImage } from '../TokenImage';

interface Token {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
}

export function TokenInput({
  label,
  amount,
  onAmountChange,
  token,
  onTokenSelect,
  onMax,
  balance,
  disabled,
}: {
  label: string;
  amount: string;
  onAmountChange: (s: string) => void;
  token: Token | null;
  onTokenSelect: () => void;
  onMax?: () => void;
  balance?: string;
  disabled?: boolean;
}) {
  return (
    <div className="bg-zinc-800 p-4 rounded-xl space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">
          {label}
        </span>
        {balance && (
          <span className="text-xs text-gray-500">
            Saldo: {balance} {token?.symbol}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          aria-label={`Cantidad de ${token?.symbol ?? 'token'}`}
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value.replace(",", "."))}
          disabled={disabled}
          className="w-full text-3xl font-mono text-white focus:outline-none border-none p-0 h-auto bg-transparent"
        />
        {onMax && (
          <Button onClick={onMax} variant="ghost" disabled={!balance || disabled} className="text-xs px-3 py-1 h-auto text-lime-400 hover:text-lime-300">MAX</Button>
        )}
        <Button aria-label={`Seleccionar token (${token?.symbol ?? ""})`} onClick={onTokenSelect} variant="secondary" className="flex items-center gap-2 rounded-full font-semibold">
          {token && (<TokenImage src={token.logoURI} alt={token.symbol ?? "token"} size={24} className="rounded-full" />)}
          {token?.symbol ?? "..."}
        </Button>
      </div>
    </div>
  );
}

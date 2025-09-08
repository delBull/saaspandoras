'use client';

import { Input } from "@saasfly/ui/input";
import { SheetHeader, SheetTitle } from "@saasfly/ui/sheet";
import { ScrollArea } from "@saasfly/ui/scroll-area";
import { SearchIcon } from "lucide-react";
import { TokenImage } from '../TokenImage';

interface Token {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
}

export function TokenSelector({ tokens, currentSelection, onSelect, searchTerm, setSearchTerm }: { tokens: Token[]; currentSelection: string; onSelect: (token: Token) => void; searchTerm: string; setSearchTerm: (t: string) => void; }) {
  const popularTokens = ['ETH', 'USDC', 'WETH', 'DAI', 'USDT', 'WBTC'];
  const popularTokenData = popularTokens
    .map(symbol => tokens.find(t => t.symbol === symbol))
    .filter(Boolean)
    .slice(0, 6) as Token[]; // Limit to 6 for UI
  const filteredTokens = tokens.filter(
      (token) => token.address !== currentSelection &&
      (token.symbol.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
       token.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
       token.address.toLowerCase().includes(searchTerm.trim().toLowerCase()))
  );
  return (
    <div className="grid h-full grid-rows-[auto_auto_auto_1fr] gap-4 p-4">
      <SheetHeader><SheetTitle>Seleccionar Token</SheetTitle></SheetHeader>
      <div className="relative"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input placeholder="Buscar por nombre o símbolo" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-800 border-zinc-700 pl-8" aria-label="Buscar token" /></div>
      <div><p className="text-xs font-semibold text-gray-500 mb-2">Tokens Populares</p><div className="grid grid-cols-4 sm:grid-cols-5 gap-2">{popularTokenData.map(token => (<button key={token.address} onClick={() => onSelect(token)} className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-zinc-800 transition-colors"><TokenImage src={token.logoURI} alt={token.symbol} size={32} className="rounded-full" /><span className="text-xs font-bold text-white">{token.symbol}</span></button>))}</div></div>
      <ScrollArea className="overflow-y-auto"><div className="flex flex-col gap-1 pr-2">{filteredTokens.map((token) => (<button key={token.address} onClick={() => onSelect(token)} className="flex items-center gap-4 p-2 rounded-lg hover:bg-lime-800/20 transition-colors text-left" aria-label={`Seleccionar ${token.symbol}`}><TokenImage src={token.logoURI} alt={token.symbol} size={36} className="rounded-full" /><div><p className="font-bold text-white">{token.symbol}</p><p className="text-xs text-gray-400">{token.name}</p></div></button>))}</div></ScrollArea>
    </div>
  );
}
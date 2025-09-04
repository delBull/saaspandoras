'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  useBuyWithCryptoQuote,
  useSendTransaction,
  useActiveAccount,
  useWalletBalance,
} from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { parseUnits, formatUnits } from "viem";
import { base, defineChain } from "thirdweb/chains";
import { TokenImage } from './TokenImage';

// Componentes de UI
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@saasfly/ui/sheet";
import { ScrollArea } from "@saasfly/ui/scroll-area";
import { toast } from "sonner";
import { ArrowDownIcon, Loader2 } from "lucide-react";

// --- Tipos, Hooks y Datos ---
const TOKENLIST_URL = "https://tokens.uniswap.org";

interface Token {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
};

interface TokenListResponse {
  tokens: Token[];
}

function useTokenList(chainId: number) {
  const [tokens, setTokens] = useState<Token[]>([]);
  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await fetch(TOKENLIST_URL);
        const data = await res.json() as TokenListResponse;
        setTokens(data.tokens.filter((t) => t.chainId === chainId));
      } catch {
        setTokens([]);
        toast.error("Error al cargar la lista de tokens");
      }
    }
    void fetchTokens();
  }, [chainId]);
  return tokens;
}

// --- Sub-Componente: Selector de Tokens ---
function TokenSelector({ tokens, currentSelection, onSelect, searchTerm, setSearchTerm }: { tokens: Token[]; currentSelection: string; onSelect: (token: Token) => void; searchTerm: string; setSearchTerm: (t: string) => void; }) {
  const filteredTokens = tokens.filter(
      (token) => token.address !== currentSelection &&
      (token.symbol.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
       token.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full">
      <SheetHeader>
        <SheetTitle>Seleccionar Token</SheetTitle>
      </SheetHeader>
      <Input
        placeholder="Buscar por nombre o símbolo"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="my-4 bg-zinc-800 border-zinc-700"
        aria-label="Buscar token"
      />
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1">
          {filteredTokens.length === 0 && (
            <div className="text-gray-500 text-center py-4">
              No se encontraron tokens.
            </div>
          )}
          {filteredTokens.map((token) => (
            <button
              key={token.address}
              onClick={() => onSelect(token)}
              className="flex items-center gap-4 p-2 rounded-lg hover:bg-lime-800/20 transition-colors text-left"
              aria-label={`Seleccionar ${token.symbol}`}
            >
              <TokenImage src={token.logoURI} alt={token.symbol} size={36} className="rounded-full" />
              <div>
                <p className="font-bold text-white">{token.symbol}</p>
                <p className="text-xs text-gray-400">{token.name}</p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// --- Componente Principal del Swap ---
export function CustomSwap() {
  const account = useActiveAccount();
  const [fromAmount, setFromAmount] = useState("");
  const [isTokenModalOpen, setTokenModalOpen] = useState<"from" | "to" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animateColor, setAnimateColor] = useState(false);
  
  const activeChainId = base.id;
  const tokenList = useTokenList(activeChainId);

  useEffect(() => {
    if (tokenList.length > 1 && !fromToken && !toToken) {
      setFromToken(tokenList.find(t => t.symbol === 'USDC') ?? tokenList[1]!);
      setToToken(tokenList.find(t => t.symbol === 'ETH') ?? tokenList[0]!);
    }
  }, [tokenList, fromToken, toToken]);
  
  const { data: balance } = useWalletBalance({ client, address: account?.address ?? "", chain: fromToken?.chainId ? defineChain(fromToken.chainId) : undefined, tokenAddress: fromToken?.address });

  const isInvalidAmount = !fromAmount || isNaN(Number(fromAmount)) || Number(fromAmount) <= 0;
  const isSameToken = fromToken?.address === toToken?.address;
  const isInsufficientBalance = fromAmount && balance?.value && fromToken ? (parseUnits(fromAmount, fromToken.decimals) > balance.value) : false;
  const isReadyForQuote = account && fromToken && toToken && !isInvalidAmount && !isSameToken && !isInsufficientBalance;

  const fromAmountBaseUnits = useMemo(() => {
    if (!fromAmount || !fromToken || Number(fromAmount) <= 0) return "0";
    try {
      return parseUnits(fromAmount, fromToken.decimals).toString();
    } catch { return "0"; }
  }, [fromAmount, fromToken]);

  const swapParams = isReadyForQuote ? { client, fromAddress: account.address, toAddress: account.address, fromTokenAddress: fromToken.address, toTokenAddress: toToken.address, fromChainId: fromToken.chainId, toChainId: toToken.chainId, fromAmount: fromAmountBaseUnits } : undefined;

  const { data: quote, isLoading: isQuoting } = useBuyWithCryptoQuote(swapParams);
  const { mutateAsync: sendTx, isPending: isSendingTransaction } = useSendTransaction();
  
  const prevToAmount = useRef("0.0");
  const displayToAmount = useMemo(() => {
    if (!quote || !toToken) return "0.0";
    
    let rawAmount: bigint | undefined = undefined;

    if ("toAmount" in quote && typeof quote.toAmount === "bigint") {
      rawAmount = quote.toAmount;
    } else if (
      "toToken" in quote && 
      typeof quote.toToken === 'object' && 
      quote.toToken && 
      "amount" in quote.toToken && 
      typeof (quote.toToken as { amount?: unknown }).amount === "bigint"
    ) {
      rawAmount = (quote.toToken as { amount: bigint }).amount;
    }

    if (rawAmount) {
      const formatted = formatUnits(rawAmount, toToken.decimals);
      return Number(formatted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    }
    
    return "0.0";
  }, [quote, toToken]);

  useEffect(() => {
    if (displayToAmount !== prevToAmount.current) {
      setAnimateColor(true);
      const timer = setTimeout(() => setAnimateColor(false), 500);
      prevToAmount.current = displayToAmount;
      return () => clearTimeout(timer);
    }
  }, [displayToAmount]);
  
  useEffect(() => {
    if (isInvalidAmount && Number(fromAmount) > 0) setError("Ingresa un monto válido.");
    else if (isSameToken) setError("Debes escoger tokens diferentes.");
    else if (isInsufficientBalance) setError("No tienes suficiente saldo.");
    else setError(null);
  }, [isInvalidAmount, isSameToken, isInsufficientBalance, fromAmount]);

  const handleSwap = async () => {
    if (error) {
      toast.error(error);
      return;
    }
    if (!quote?.transactionRequest || !account) {
      toast.error("No hay ruta disponible para este par de tokens.");
      return;
    }
    try {
      await sendTx(quote.transactionRequest);
      toast.success("Swap realizado correctamente!");
      setFromAmount("");
    } catch (err) {
      console.error("Swap fallido", err);
      toast.error("El swap falló. Revisa tu wallet o la consola.");
    }
  };

  const handleMax = () => { if (balance) setFromAmount(balance.displayValue); };
  const handleTokenSelect = (token: Token) => {
    if (isTokenModalOpen === "from") setFromToken(token);
    if (isTokenModalOpen === "to") setToToken(token);
    setTokenModalOpen(null);
    setSearchTerm("");
  };

  const buttonText = () => {
    if (!account) return "Conectar Wallet";
    if (error && fromAmount) return error;
    if (isQuoting) return "Obteniendo cotización...";
    if (isSendingTransaction) return "Procesando...";
    if (!quote && isReadyForQuote) return "Ruta no disponible";
    return "Intercambiar";
  };
  
  return (
    <div className="flex flex-col gap-2 p-2 md:p-4 rounded-2xl bg-black/20">
      <Sheet open={!!isTokenModalOpen} onOpenChange={(isOpen) => !isOpen && setTokenModalOpen(null)}>
        <SheetContent className="bg-zinc-900 border-l-zinc-800 text-white">
          <TokenSelector tokens={tokenList} onSelect={handleTokenSelect} currentSelection={isTokenModalOpen === 'from' ? toToken?.address ?? "" : fromToken?.address ?? ""} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </SheetContent>
      </Sheet>

      <div className="bg-zinc-800 p-4 rounded-xl space-y-1">
        <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Desde</span><span className="text-xs text-gray-500">Saldo: {balance ? parseFloat(balance.displayValue).toFixed(4) : '0.0'} {fromToken?.symbol}</span></div>
        <div className="flex items-center gap-2">
          <Input aria-label="Cantidad a intercambiar" type="number" placeholder="0.0" value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} className="w-full text-3xl font-mono text-white focus:outline-none border-none p-0 h-auto bg-transparent" />
          <Button onClick={handleMax} variant="ghost" className="text-xs px-3 py-1 h-auto text-lime-400 hover:text-lime-300" disabled={!balance || !account}>MAX</Button>
          <Button aria-label={`Seleccionar token origen (${fromToken?.symbol ?? ""})`} onClick={() => setTokenModalOpen("from")} variant="secondary" className="flex items-center gap-2 rounded-full font-semibold">
            {fromToken && (<TokenImage src={fromToken.logoURI} alt={fromToken.symbol ?? 'token'} size={24} className="rounded-full" />)} {fromToken?.symbol ?? "..."}
          </Button>
        </div>
      </div>
      
      <div className="flex justify-center -my-4 z-10"><button className="p-1.5 bg-zinc-900 border-4 border-zinc-800 rounded-full text-gray-400" aria-label="Cambiar tokens de lugar" onClick={() => { if(fromToken && toToken) { const temp = fromToken; setFromToken(toToken); setToToken(temp); } }}><ArrowDownIcon className="w-4 h-4" /></button></div>
      
      <div className="bg-zinc-800 p-4 rounded-xl space-y-1">
        <span className="text-xs text-gray-400">Hasta</span>
        <div className="flex items-center gap-4">
          <div className={"w-full text-3xl font-mono transition-colors " + (animateColor ? "text-lime-400" : "text-gray-400")} aria-live="polite">
            {isQuoting ? <Loader2 className="animate-spin h-8 w-8" /> : displayToAmount}
          </div>
          <Button aria-label={`Seleccionar token destino (${toToken?.symbol ?? ""})`} onClick={() => setTokenModalOpen("to")} variant="secondary" className="flex items-center gap-2 rounded-full font-semibold">
            {toToken && (<TokenImage src={toToken.logoURI} alt={toToken.symbol ?? 'token'} size={24} className="rounded-full" />)} 
            {toToken?.symbol ?? "..."}
          </Button>
        </div>
      </div>
      
      <Button
        onClick={handleSwap}
        disabled={!!error || isQuoting || isSendingTransaction || !quote}
        className="w-full mt-4 py-6 rounded-2xl font-bold text-lg text-zinc-900 bg-gradient-to-r from-lime-300 to-lime-400 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonText()}
      </Button>
    </div>
  );
}
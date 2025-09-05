'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  useBuyWithCryptoQuote,
  useSendTransaction,
  useActiveAccount,
  useWalletBalance,
} from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { parseUnits, formatUnits, encodeFunctionData } from "viem";
import { base, defineChain } from "thirdweb/chains";
import { TokenImage } from './TokenImage';
import { BadgeChain } from './BadgeChain';

// Componentes de UI
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@saasfly/ui/sheet";
import { ScrollArea } from "@saasfly/ui/scroll-area";
import { toast } from "sonner";
import { ArrowDownIcon, Loader2, SearchIcon } from "lucide-react";

// --- Tipos, Hooks y Datos ---
const TOKENLIST_URL = "https://tokens.uniswap.org";

const erc20Abi = [
  {
    "inputs": [
      { "name": "_spender", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
] as const;

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

// Hook para cargar y filtrar la lista de tokens dinámicamente
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

// Sub-Componente: Selector de Tokens con búsqueda
function TokenSelector({ tokens, currentSelection, onSelect, searchTerm, setSearchTerm }: { tokens: Token[]; currentSelection: string; onSelect: (token: Token) => void; searchTerm: string; setSearchTerm: (t: string) => void; }) {
  const popularTokens = ['ETH', 'USDC', 'WETH', 'DAI'];
  const popularTokenData = popularTokens.map(symbol => tokens.find(t => t.symbol === symbol)).filter(Boolean) as Token[];

  const filteredTokens = tokens.filter(
      (token) => token.address !== currentSelection &&
      (token.symbol.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
       token.name.toLowerCase().includes(searchTerm.trim().toLowerCase()))
  );

  return (
    <div className="grid h-full grid-rows-[auto_auto_auto_1fr] gap-4 p-4">
      <SheetHeader>
        <SheetTitle>Seleccionar Token</SheetTitle>
      </SheetHeader>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar por nombre o símbolo"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-800 border-zinc-700 pl-8"
          aria-label="Buscar token"
        />
      </div>
      <div>
          <p className="text-xs font-semibold text-gray-500 mb-2">Tokens Populares</p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {popularTokenData.map(token => (
                  <button key={token.address} onClick={() => onSelect(token)} className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                      <TokenImage src={token.logoURI} alt={token.symbol} size={32} className="rounded-full" />
                      <span className="text-xs font-bold text-white">{token.symbol}</span>
                  </button>
              ))}
          </div>
      </div>
      <ScrollArea className="overflow-y-auto">
        <div className="flex flex-col gap-1 pr-2">
          {filteredTokens.map((token) => (
            <button key={token.address} onClick={() => onSelect(token)} className="flex items-center gap-4 p-2 rounded-lg hover:bg-lime-800/20 transition-colors text-left" aria-label={`Seleccionar ${token.symbol}`}>
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
  const [isApproving, setIsApproving] = useState(false);
  
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

  const swapParams = isReadyForQuote ? { client, fromAddress: account.address, toAddress: account.address, fromTokenAddress: fromToken.address, toTokenAddress: toToken.address, fromChainId: fromToken.chainId, toChainId: toToken.chainId, fromAmount: fromAmount } : undefined;

  const { data: quote, isLoading: isQuoting } = useBuyWithCryptoQuote(swapParams);
  const { mutateAsync: sendTx, isPending: isSendingTransaction } = useSendTransaction();
  
  const displayToAmount = useMemo(() => {
    if (!quote || !toToken) {
      return "0.00";
    }
    try {
      const formatted = formatUnits(
        BigInt(quote.swapDetails.toAmountWei),
        toToken.decimals
      );
      return parseFloat(formatted).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
    } catch (e) {
      console.error("Error formatting display amount:", e);
      return "0.00";
    }
  }, [quote, toToken]);

  const isCrossChain = fromToken && toToken && fromToken.chainId !== toToken.chainId;

  const prevDisplayAmount = useRef("0.0");
  useEffect(() => {
    if (displayToAmount !== prevDisplayAmount.current) {
      setAnimateColor(true);
      const timer = setTimeout(() => setAnimateColor(false), 500);
      prevDisplayAmount.current = displayToAmount;
      return () => clearTimeout(timer);
    }
  }, [displayToAmount]);
  
  useEffect(() => {
    if (isSameToken) setError("Debes escoger tokens diferentes.");
    else if (isInsufficientBalance) setError("No tienes suficiente saldo.");
    else setError(null);
  }, [isSameToken, isInsufficientBalance]);

  const handleSwap = async () => {
    if (error) { toast.error(error); return; }
    if (!quote || !account) { toast.error("No hay ruta disponible para este par."); return; }

    try {
      if (quote.approvalData) {
        setIsApproving(true);
        toast.info("Se requiere aprobación para gastar tus tokens.");

        const { spenderAddress, amountWei, tokenAddress } = quote.approvalData;

        const approvalTx = {
          to: tokenAddress,
          chain: defineChain(quote.approvalData.chainId),
          client: client,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [spenderAddress, BigInt(amountWei)]
          }),
        };

        await sendTx(approvalTx);
        
        toast.success("Aprobación exitosa. Ahora confirma el swap.");
        setIsApproving(false);
      }

      await sendTx(quote.transactionRequest);
      toast.success("Swap realizado correctamente!");
      setFromAmount("");

    } catch (err) {
      setIsApproving(false);
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

  const buttonText = (): string => {
    if (isInvalidAmount) return "Ingresa un monto";
    if (error) return error;
    if (isApproving) return "Aprobando...";
    if (isQuoting) return "Obteniendo cotización...";
    if (isSendingTransaction) return "Procesando...";
    if (!quote && isReadyForQuote) return "Ruta no disponible";
    return "Intercambiar";
  };
  
  return (
    <div className="flex flex-col gap-2 p-2 md:p-4 rounded-2xl bg-black/20">
      <Sheet open={!!isTokenModalOpen} onOpenChange={(isOpen) => !isOpen && setTokenModalOpen(null)}>
        <SheetContent className="bg-zinc-900 border-none text-white p-0 flex flex-col md:max-w-md md:rounded-2xl inset-x-0 bottom-0 md:inset-auto rounded-t-2xl h-[85vh] md:h-auto md:max-h-[600px]">
          <TokenSelector tokens={tokenList} onSelect={handleTokenSelect} currentSelection={isTokenModalOpen === 'from' ? toToken?.address ?? "" : fromToken?.address ?? ""} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </SheetContent>
      </Sheet>
      
      {isCrossChain && ( <div className="flex items-center justify-center gap-2 mb-2 p-2 bg-zinc-800/50 rounded-lg"> <BadgeChain chainId={fromToken.chainId} /> <span className="font-bold text-base text-gray-400">→</span> <BadgeChain chainId={toToken.chainId} /> <span className="ml-2 text-xs text-orange-400 font-semibold"> ¡Atención: Swap cross-chain! </span> </div> )}

      <div className="bg-zinc-800 p-4 rounded-xl space-y-1">
        <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Desde</span><span className="text-xs text-gray-500">Saldo: {balance ? parseFloat(balance.displayValue).toFixed(4) : '0.0'} {fromToken?.symbol}</span></div>
        <div className="flex items-center gap-2">
          <Input aria-label="Cantidad a intercambiar" type="text" inputMode="decimal" placeholder="0.0" value={fromAmount} onChange={(e) => { const val = e.target.value.replace(",","."); if (val === "" || new RegExp(`^\d*(\.\d{0,${fromToken?.decimals ?? 6}})?$`).test(val)) { setFromAmount(val); } }} className="w-full text-3xl font-mono text-white focus:outline-none border-none p-0 h-auto bg-transparent" />
          <Button onClick={handleMax} variant="ghost" className="text-xs px-3 py-1 h-auto text-lime-400 hover:text-lime-300" disabled={!balance || !account}> MAX </Button>
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
            {isQuoting ? <Loader2 className="animate-spin h-8 w-8" /> : displayToAmount }
          </div>
          <Button aria-label={`Seleccionar token destino (${toToken?.symbol ?? ""})`} onClick={() => setTokenModalOpen("to")} variant="secondary" className="flex items-center gap-2 rounded-full font-semibold">
            {toToken && (<TokenImage src={toToken.logoURI} alt={toToken.symbol ?? 'token'} size={24} className="rounded-full" />)} 
            {toToken?.symbol ?? "..."}
          </Button>
        </div>
      </div>
      
      {account ? (
        <Button
          onClick={handleSwap}
          disabled={!!error || isQuoting || isApproving || isSendingTransaction || !quote}
          className="w-full mt-4 py-6 rounded-2xl font-bold text-lg text-zinc-900 bg-gradient-to-r from-lime-200 to-lime-300 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonText()}
        </Button>
      ) : (
        <Button
          disabled={true}
          className="w-full mt-4 py-6 rounded-2xl font-bold text-lg text-zinc-900 bg-gradient-to-r from-lime-200 to-lime-300 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Conectar Wallet
        </Button>
      )}

      {process.env.NODE_ENV === "development" && quote && (
        <div className="mt-4">
          <p className="text-xs text-zinc-400">Datos del Quote (solo en desarrollo):</p>
          <pre className="text-xs text-yellow-400 bg-black/30 rounded p-2 overflow-x-auto max-h-32 mt-1">
            {JSON.stringify(
              quote,
              (key, value) => {
                if (typeof value === "bigint") {
                  return value.toString();
                }
                // This is a deliberate unsafe return for debugging purposes.
                // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                return value;
              },
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
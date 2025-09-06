'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  useBuyWithCryptoQuote,
  useSendTransaction,
  useActiveAccount,
  useWalletBalance,
  useWaitForReceipt,
  useActiveWalletChain,
  useConnectModal
} from "thirdweb/react";
import type { BuyWithCryptoQuote } from "thirdweb/pay";
import { client } from "@/lib/thirdweb-client";
import { parseUnits, formatUnits, encodeFunctionData } from "viem";
import { base, defineChain } from "thirdweb/chains";
import { prepareTransaction } from "thirdweb";
import { TokenImage } from './TokenImage';
import { useMarketRate } from '@/hooks/useMarketRate';
import { BadgeChain } from './BadgeChain';
// Componentes de UI
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@saasfly/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@saasfly/ui/sheet";
import { ScrollArea } from "@saasfly/ui/scroll-area";
import { toast } from "sonner";
import { ArrowDownIcon, Loader2, SearchIcon, CheckCircle, XCircle, Info } from "lucide-react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { config } from "@/config";

// --- Tipos, Hooks, Datos y ABI Mínimo ---
const TOKENLIST_URL = "https://tokens.uniswap.org";
const erc20Abi = [{"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}] as const;
const TESTNET_IDS = [ 11155111, 84532, 421614, 534351, 80001, 5, 97 ];

interface Token { name: string; address: string; symbol: string; decimals: number; chainId: number; logoURI: string; };
interface TokenListResponse { tokens: Token[]; }

function useTokenList(chainId: number) {
  const [tokens, setTokens] = useState<Token[]>([]);
  useEffect(() => {
    async function fetchTokens() {
      try {
        const res = await fetch(TOKENLIST_URL);
        const data = await res.json() as TokenListResponse;
        setTokens(data.tokens.filter((t: Token) => t.chainId === chainId));
      } catch { setTokens([]); toast.error("Error al cargar la lista de tokens"); }
    }
    void fetchTokens();
  }, [chainId]);
  return tokens;
}

// --- Sub-componentes para el nuevo flujo de Swap ---
interface ReviewModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  fromToken: Token | null;
  toToken: Token | null;
  fromAmount: string;
  displayToAmount: string;
  quote: BuyWithCryptoQuote | null;
  isSwapping: boolean;
  expectedAmount: number | null;
  quotedAmount: number | null;
  priceImpact: number | null;
  marketRate: number | null;
}
function ReviewModal({ isOpen, onOpenChange, onConfirm, fromToken, toToken, fromAmount, displayToAmount, quote, isSwapping, expectedAmount, quotedAmount, priceImpact, marketRate, }: ReviewModalProps) {
  if (!fromToken || !toToken || !quote) return null;
  // Ahora los accesos son 100% seguros porque usamos el tipo oficial
  const minAmount = quote.swapDetails?.toAmountMinWei ? formatUnits(BigInt(quote.swapDetails.toAmountMinWei), toToken.decimals) : "0.0";
  const slippage = quote.swapDetails?.maxSlippageBPS ? (quote.swapDetails.maxSlippageBPS / 100).toFixed(2) : "0.00";
  const gasCost = quote.swapDetails?.estimated?.gasCostUSDCents ? (quote.swapDetails.estimated.gasCostUSDCents / 100).toFixed(4) : "0.0000";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl">Revisar Transacción</DialogTitle>
          <DialogDescription>
            Confirma los detalles antes de swappear.
            {!marketRate && (
              <div style={{ color: "orange", fontWeight: "bold", marginTop: 12, }} >
                Advertencia: No hay tasa de mercado de referencia disponible.
              </div>
            )}
            {priceImpact !== null && priceImpact > 0.15 && (
              <div style={{ color: "#fdba74", fontWeight: "bold", marginTop: 12, }} >
                Impacto estimado mayor al 15%. Verifica la cotización real antes de firmar.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center bg-zinc-800 p-3 rounded-lg"><div><p className="text-sm text-gray-400">Pagas</p><p className="text-2xl font-bold">{fromAmount}</p></div><div className="text-right"><div className="flex items-center gap-2 justify-end"><TokenImage src={fromToken.logoURI} alt={fromToken.symbol} size={24} className="rounded-full"/><span className="font-bold text-xl">{fromToken.symbol}</span></div><BadgeChain chainId={fromToken.chainId} /></div></div>
          <div className="flex justify-center"><ArrowDownIcon className="w-6 h-6 text-gray-500" /></div>
          <div className="flex justify-between items-center bg-zinc-800 p-3 rounded-lg"><div><p className="text-sm text-gray-400">Recibes (Estimado)</p><p className="text-2xl font-bold">{displayToAmount}</p></div><div className="text-right"><div className="flex items-center gap-2 justify-end"><TokenImage src={toToken.logoURI} alt={toToken.symbol} size={24} className="rounded-full"/><span className="font-bold text-xl">{toToken.symbol}</span></div><BadgeChain chainId={toToken.chainId} /></div></div>
          <div className="text-xs text-gray-400 space-y-1 pt-4 border-t border-zinc-800">
            <div className="flex justify-between"><p>Mínimo garantizado:</p><p>{parseFloat(minAmount).toFixed(6)} {toToken.symbol}</p></div>
            <div className="flex justify-between"><p>Slippage:</p><p>{slippage}%</p></div>
            <div className="flex justify-between"><p>Tarifa de Red Estimada:</p><p>~${gasCost} USD</p></div>
            <div className="flex mt-2">
              <span className={ priceImpact !== null && priceImpact > 0.15 ? "text-orange-400 font-bold" : "text-green-400" } >
                Impacto estimado:{" "}
                {priceImpact !== null ? (priceImpact * 100).toFixed(2) + "%" : "N/A"}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}>
              <div> Referencia CoinGecko:{" "} {marketRate !== null ? marketRate.toPrecision(7) : "N/A"} </div>
              <div> Esperado:{" "} {expectedAmount !== null ? expectedAmount.toLocaleString("en-US", { maximumFractionDigits: 8, }) : "N/A"}{" "} {toToken.symbol} </div>
              <div> Cotizado:{" "} {quotedAmount !== null ? quotedAmount.toLocaleString("en-US", { maximumFractionDigits: 8, }) : "N/A"}{" "} {toToken.symbol} </div>
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSwapping}>Cancelar</Button><Button onClick={onConfirm} className="bg-lime-400 text-black hover:bg-lime-500" disabled={isSwapping}>{isSwapping ? <Loader2 className="animate-spin" /> : "Confirmar Swap"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgressStep({ title, status }: { title: string; status: 'pending' | 'success' | 'error' | 'skipped'; }) {
  const statusIcons = { pending: <Loader2 className="animate-spin h-5 w-5 text-gray-400" />, success: <CheckCircle className="h-5 w-5 text-green-500" />, error: <XCircle className="h-5 w-5 text-red-500" />, skipped: <Info className="h-5 w-5 text-gray-500" /> };
  const statusText = { pending: "Pendiente...", success: "Completado", error: "Error", skipped: "Omitido" };
  return ( <div className="flex items-center justify-between text-sm"><p>{title}</p><div className="flex items-center gap-2">{statusIcons[status]}<span className="text-gray-400 w-24 text-right">{statusText[status]}</span></div></div> );
}

function ProgressModal({ isOpen, onOpenChange, approvingStatus, swapStatus, networkStatus }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; approvingStatus: 'pending' | 'success' | 'error' | 'skipped'; swapStatus: 'pending' | 'success' | 'error'; networkStatus: 'pending' | 'success' | 'error'; }) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader><DialogTitle>Procesando Swap</DialogTitle><DialogDescription>Tu transacción se está procesando en la blockchain. Por favor, no cierres esta ventana.</DialogDescription></DialogHeader>
        <div className="space-y-4 py-4"><ProgressStep title="1. Aprobando token" status={approvingStatus} /><ProgressStep title="2. Ejecutando swap" status={swapStatus} /><ProgressStep title="3. Esperando confirmación" status={networkStatus} /></div>
      </DialogContent>
    </Dialog>
  );
}

function ResultModal({ isOpen, onOpenChange, variant, message, txHash }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void; variant: 'success' | 'error'; message: string | null; txHash: `0x${string}` | null; }) {
  const explorerUrl = txHash ? `https://basescan.org/tx/${txHash}` : '#';
  return ( <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogContent className="bg-zinc-900 border-zinc-800 text-white"><DialogHeader className="items-center text-center">{variant === 'success' ? <CheckCircle className="h-16 w-16 text-green-500 mb-4" /> : <XCircle className="h-16 w-16 text-red-500 mb-4" />}<DialogTitle className="text-2xl">{variant === 'success' ? "Swap Exitoso" : "Error en el Swap"}</DialogTitle><DialogDescription>{message}</DialogDescription></DialogHeader>{txHash && ( <div className="text-center pt-4"><a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-lime-400 hover:underline text-sm">Ver en Block Explorer</a></div> )}<DialogFooter className="mt-4"><Button onClick={() => onOpenChange(false)} className="w-full">Cerrar</Button></DialogFooter></DialogContent></Dialog> );
}

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
      <SheetHeader><SheetTitle>Seleccionar Token</SheetTitle></SheetHeader>
      <div className="relative"><SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" /><Input placeholder="Buscar por nombre o símbolo" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-zinc-800 border-zinc-700 pl-8" aria-label="Buscar token" /></div>
      <div><p className="text-xs font-semibold text-gray-500 mb-2">Tokens Populares</p><div className="grid grid-cols-4 sm:grid-cols-5 gap-2">{popularTokenData.map(token => (<button key={token.address} onClick={() => onSelect(token)} className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-zinc-800 transition-colors"><TokenImage src={token.logoURI} alt={token.symbol} size={32} className="rounded-full" /><span className="text-xs font-bold text-white">{token.symbol}</span></button>))}</div></div>
      <ScrollArea className="overflow-y-auto"><div className="flex flex-col gap-1 pr-2">{filteredTokens.map((token) => (<button key={token.address} onClick={() => onSelect(token)} className="flex items-center gap-4 p-2 rounded-lg hover:bg-lime-800/20 transition-colors text-left" aria-label={`Seleccionar ${token.symbol}`}><TokenImage src={token.logoURI} alt={token.symbol} size={36} className="rounded-full" /><div><p className="font-bold text-white">{token.symbol}</p><p className="text-xs text-gray-400">{token.name}</p></div></button>))}</div></ScrollArea>
    </div>
  );
}


// --- Componente Principal del Swap ---
export function CustomSwap() {
  const account = useActiveAccount();
  const activeChain = useActiveWalletChain();
  const { connect } = useConnectModal();
  const [fromAmount, setFromAmount] = useState("");
  const [isTokenModalOpen, setTokenModalOpen] = useState<"from" | "to" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animateColor, setAnimateColor] = useState(false);
  const [swapStep, setSwapStep] = useState<'form' | 'review' | 'swapping' | 'success' | 'error'>('form');
  const [approvingStatus, setApprovingStatus] = useState<'pending' | 'success' | 'error' | 'skipped'>('pending');
  const [swapStatus, setSwapStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [networkStatus, setNetworkStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeChainId = base.id;
  const tokenList = useTokenList(activeChainId);

  useEffect(() => {
    if (tokenList.length > 1 && !fromToken && !toToken) {
      setFromToken(tokenList.find(t => t.symbol === 'USDC') ?? tokenList[1]!);
      setToToken(tokenList.find(t => t.symbol === 'ETH') ?? tokenList[0]!);
    }
  }, [tokenList, fromToken, toToken]);
  
  const { data: balance } = useWalletBalance({ client, address: account?.address ?? "", chain: fromToken?.chainId ? defineChain(fromToken.chainId) : undefined, tokenAddress: fromToken?.address });

  const fromAmountBaseUnits = useMemo(() => {
    if (!fromToken || !fromAmount || Number(fromAmount) <= 0) return 0n;
    try { return parseUnits(fromAmount, fromToken.decimals); } catch { return 0n; }
  }, [fromAmount, fromToken]);

  const isInvalidAmount = !fromAmount || isNaN(Number(fromAmount)) || Number(fromAmount) <= 0;
  const isSameToken = fromToken?.address === toToken?.address;
  const isInsufficientBalance = fromAmount && balance?.value && fromToken ? (fromAmountBaseUnits > balance.value) : false;
  const isReadyForQuote = account && fromToken && toToken && !isInvalidAmount && !isSameToken && !isInsufficientBalance;

  const swapParams = isReadyForQuote ? { client, fromAddress: account.address, toAddress: account.address, fromTokenAddress: fromToken.address, toTokenAddress: toToken.address, fromChainId: fromToken.chainId, toChainId: toToken.chainId, fromAmount: fromAmountBaseUnits.toString() } : undefined;

  const { data: quote, isLoading: isQuoting } = useBuyWithCryptoQuote(swapParams);
  const { mutateAsync: sendTx, isPending: isSendingTransaction } = useSendTransaction();
  
  const { data: receipt, isLoading: isWaitingForConfirmation } = useWaitForReceipt(
    txHash && fromToken
      ? {
          client,
          transactionHash: txHash,
          chain: defineChain(fromToken.chainId),
        }
      : undefined,
  );
  
  useEffect(() => {
    if (!txHash) return;
    if (isWaitingForConfirmation) {
      setNetworkStatus("pending");
    } else if (receipt) {
      setNetworkStatus("success");
      setSwapStep("success");
    } else if (!isWaitingForConfirmation && txHash) {
      setNetworkStatus("error");
      setSwapStep("error");
      setErrorMessage("La transacción falló o fue rechazada en la red.");
    }
  }, [receipt, isWaitingForConfirmation, txHash]);

  // --- Cálculos de Montos y Price Impact ---
  // 1. Montos SIEMPRE en decimales humanos (nunca base units/wei):

  // input usuario en humano decimal (string → número)
  const fromAmountDecimal = Number(fromAmount);

  // Quoted amount (from aggregator) en decimales humanos
  const quotedAmountAsNumber = useMemo(() => {
    if (!quote?.swapDetails?.toAmountWei || !toToken?.decimals) return null;
    try {
      return parseFloat(formatUnits(BigInt(quote.swapDetails.toAmountWei), toToken.decimals));
    } catch {
      return null;
    }
  }, [quote, toToken]);

  // formatea para la UI (solo para mostrar)
  const displayToAmount = useMemo(() => {
    if (quotedAmountAsNumber !== null && quotedAmountAsNumber > 0) {
      return quotedAmountAsNumber.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
    }
    return "0.0";
  }, [quotedAmountAsNumber]);
  
  const isCrossChain = fromToken && toToken && fromToken.chainId !== toToken.chainId;

  // Rate de mercado: puede ser null/N/A y eso está OK para UX
  const marketRate = useMarketRate(fromToken ?? undefined, toToken ?? undefined);
  const isTestnet = activeChain ? TESTNET_IDS.includes(activeChain.id) : false;

  // Expected amount en humanos. Si no hay rate, es null.
  const expectedAmount = useMemo(() => {
    if (!marketRate || isNaN(fromAmountDecimal) || fromAmountDecimal <= 0) return null;
    return fromAmountDecimal * marketRate;
  }, [fromAmountDecimal, marketRate]);

  // Price Impact seguro: solo si ambos montos existen
  const priceImpact = useMemo(() => {
    if (
      expectedAmount !== null &&
      quotedAmountAsNumber !== null &&
      expectedAmount > 0 &&
      quotedAmountAsNumber > 0
    ) {
      return Math.abs(1 - quotedAmountAsNumber / expectedAmount);
    }
    return null;
  }, [expectedAmount, quotedAmountAsNumber]);

  // Nueva lógica para impedir bloqueo:
  const isQuoteUnrealistic =
    !isTestnet &&
    priceImpact !== null &&
    priceImpact > 0.15 &&
    fromAmount !== "";

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

  const handleReview = () => {
    if (error) { toast.error(error); return; }
    if (isQuoteUnrealistic && marketRate !== null) { toast.error("La cotización es muy diferente al precio de mercado."); return; }
    if (!quote || !account) { toast.error("No hay ruta disponible para este par."); return; }
    setSwapStep('review');
  };

  const executeSwap = async () => {
    if (!quote || !account || !fromToken) return;
    setSwapStep('swapping');
    setApprovingStatus('pending'); setSwapStatus('pending'); setNetworkStatus('pending');
    try {
      if (quote.approvalData) {
        const { spenderAddress, amountWei, tokenAddress, chainId } = quote.approvalData;
        const approvalTx = prepareTransaction({ to: tokenAddress, chain: defineChain(chainId), client, data: encodeFunctionData({ abi: erc20Abi, functionName: 'approve', args: [spenderAddress, BigInt(amountWei)] }) });
        await sendTx(approvalTx);
        setApprovingStatus('success');
      } else {
        setApprovingStatus('skipped');
      }
      const txResult = await sendTx(quote.transactionRequest);
      setSwapStatus('success');
      setTxHash(txResult.transactionHash);
    } catch (err) {
      console.error("Swap fallido", err);
      const friendlyMessage = "La transacción falló. Es posible que la hayas rechazado.";
      setErrorMessage(friendlyMessage);
      if (approvingStatus === 'pending') setApprovingStatus('error');
      else setSwapStatus('error');
      setNetworkStatus('error');
      setSwapStep('error');
    }
  };

  const resetSwap = () => {
    setSwapStep('form'); setFromAmount(''); setTxHash(null); setErrorMessage(null);
    setApprovingStatus('pending'); setSwapStatus('pending'); setNetworkStatus('pending');
  };
  
  const handleMax = () => { if (balance) setFromAmount(balance.displayValue); };
  const handleTokenSelect = (token: Token) => {
    if (isTokenModalOpen === "from") setFromToken(token);
    if (isTokenModalOpen === "to") setToToken(token);
    setTokenModalOpen(null);
    setSearchTerm("");
  };

  const buttonText = (): string => {
    if (!account) return "Conectar Wallet";
    if (isInvalidAmount && fromAmount) return "Ingresa un monto válido";
    if (error) return error;
    if (isQuoting) return "Obteniendo cotización...";
    if (isSendingTransaction) return "Procesando...";
    if (isQuoteUnrealistic) return "Cotización Inválida";
    if (!quote && isReadyForQuote) return "Ruta no disponible";
    return "Revisar Swap";
  };
  
  return (
    <div className="flex flex-col gap-2 p-2 md:p-4 rounded-2xl bg-black/20">
      <Sheet open={!!isTokenModalOpen} onOpenChange={(isOpen: boolean) => !isOpen && setTokenModalOpen(null)}>
        <SheetContent className="bg-zinc-900 border-none text-white p-0 flex flex-col md:max-w-md md:rounded-2xl inset-x-0 bottom-0 md:inset-auto rounded-t-2xl h-[85vh] md:h-auto md:max-h-[600px]">
          <TokenSelector tokens={tokenList} onSelect={handleTokenSelect} currentSelection={isTokenModalOpen === 'from' ? toToken?.address ?? "" : fromToken?.address ?? ""} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </SheetContent>
      </Sheet>

      <ReviewModal 
        isOpen={swapStep === 'review'} 
        onOpenChange={(isOpen: boolean) => !isOpen && setSwapStep('form')} 
        onConfirm={() => void executeSwap()}
        isSwapping={isSendingTransaction}
        fromToken={fromToken}
        toToken={toToken}
        fromAmount={fromAmount}
        displayToAmount={displayToAmount}
        quote={quote ?? null}
        expectedAmount={expectedAmount}
        quotedAmount={quotedAmountAsNumber}
        priceImpact={priceImpact}
        marketRate={marketRate}
      />
      <ProgressModal 
        isOpen={swapStep === 'swapping'} 
        // Se usa una función vacía intencionalmente para prevenir que el usuario
        // cierre el modal mientras la transacción está en progreso.
        // Esto mejora la UX al evitar cierres accidentales.
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onOpenChange={() => {}}
        {...{ approvingStatus, swapStatus, networkStatus }} 
      />
      {(swapStep === 'success' || swapStep === 'error') && (
        <ResultModal 
          isOpen={true} 
          onOpenChange={resetSwap} 
          variant={swapStep} 
          message={errorMessage ?? "Tu swap se ha completado y confirmado en la red."} 
          txHash={txHash}
        />
      )}
      
      {isCrossChain && fromToken && toToken && ( <div className="flex items-center justify-center gap-2 mb-2 p-2 bg-zinc-800/50 rounded-lg"> <BadgeChain chainId={fromToken.chainId} /> <span className="font-bold text-base text-gray-400">→</span> <BadgeChain chainId={toToken.chainId} /> <span className="ml-2 text-xs text-orange-400 font-semibold"> ¡Atención: Swap cross-chain! </span> </div> )}

      <div className="bg-zinc-800 p-4 rounded-xl space-y-1">
        <div className="flex justify-between items-center"><span className="text-xs text-gray-400">Desde</span><span className="text-xs text-gray-500">Saldo: {balance ? parseFloat(balance.displayValue).toFixed(4) : '0.0'} {fromToken?.symbol}</span></div>
        <div className="flex items-center gap-2">
          <Input aria-label="Cantidad a intercambiar" type="text" inputMode="decimal" placeholder="0.0" value={fromAmount} onChange={(e) => { const val = e.target.value.replace(",","."); if (val === "" || new RegExp(`^\\d*(\\.\\d{0,${fromToken?.decimals ?? 6}})?$`).test(val)) { setFromAmount(val); } }} className="w-full text-3xl font-mono text-white focus:outline-none border-none p-0 h-auto bg-transparent" />
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
          <div className={"w-full text-3xl font-mono transition-colors " + (animateColor ? "text-lime-400" : (isQuoteUnrealistic && marketRate !== null) ? "text-orange-500" : "text-gray-400")} aria-live="polite">
            {isQuoting ? <Loader2 className="animate-spin h-8 w-8" /> : (isQuoteUnrealistic && marketRate !== null) ? ( <span className="text-lg"> Cotización Irreal <span className="block text-xs text-gray-400 mt-1"> Esperado: ~{expectedAmount?.toLocaleString('en-US', {maximumFractionDigits: 4})} {toToken?.symbol} </span> </span> ) : displayToAmount }
          </div>
          <Button aria-label={`Seleccionar token destino (${toToken?.symbol ?? ""})`} onClick={() => setTokenModalOpen("to")} variant="secondary" className="flex items-center gap-2 rounded-full font-semibold">
            {toToken && (<TokenImage src={toToken.logoURI} alt={toToken.symbol ?? 'token'} size={24} className="rounded-full" />)} 
            {toToken?.symbol ?? "..."}
          </Button>
        </div>
      </div>
      
      {!marketRate && fromAmount && !isQuoting && (
        <div className="text-center text-xs text-orange-400 font-semibold mt-2 p-2 bg-orange-900/30 rounded-lg">
          Advertencia: No hay tasa de mercado de referencia disponible. El valor mostrado es solo la estimación del agregador.
        </div>
      )}

      {account ? (
        <Button
          onClick={handleReview}
          disabled={!!error || isQuoting || isSendingTransaction || !quote || (isQuoteUnrealistic && marketRate !== null)}
          className="w-full mt-4 py-6 rounded-2xl font-bold text-lg text-zinc-900 bg-gradient-to-r from-lime-200 to-lime-300 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonText()}
        </Button>
      ) : (
        <Button
         onClick={() => {
            connect({ 
              client, 
              chain: config.chain,
              showThirdwebBranding: false, 
              wallets: [ 
                inAppWallet({ 
                  auth: { 
                    options: ["email", "google", "apple", "facebook", "passkey"], 
                  }, 
                  executionMode: { 
                    mode: "EIP7702",
                    sponsorGas: true, 
                  }, 
                }), 
                createWallet("io.metamask"), 
              ], 
            })
        }}
         className="w-full mt-4 py-6 rounded-2xl font-bold text-lg text-zinc-900 bg-gradient-to-r from-lime-200 to-lime-300 transition-opacity hover:opacity-90"
        >
          {buttonText()}
          </Button>
      )}
    </div>
  );
}
'use client';

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  useBuyWithCryptoQuote,
  useSendTransaction,
  useActiveAccount,
  useWalletBalance,
  useWaitForReceipt,
  useConnectModal
} from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { parseUnits, formatUnits, encodeFunctionData } from "viem";
import { defineChain } from "thirdweb/chains";
import { prepareTransaction } from "thirdweb";
import { useMarketRate } from '@/hooks/useMarketRate';
import { BadgeChain } from './BadgeChain';
import { useSwapAnalytics } from "@/hooks/useSwapAnalytics";
// Componentes de UI
import { ReviewModal } from './swap/ReviewModal';
import { ChainAndTokenInput } from './swap/ChainAndTokenInput';
import { ProgressModal } from './swap/ProgressModal';
import { ResultModal } from './swap/ResultModal';
import { TokenSelector } from './swap/TokenSelector';
import { Skeleton } from "@saasfly/ui/skeleton";
import { Button } from "@saasfly/ui/button";
import { Sheet, SheetContent } from "@saasfly/ui/sheet";
import { toast } from "sonner";
import { ArrowDownIcon } from "lucide-react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { config } from "@/config";

const FEE_WALLET = process.env.NEXT_PUBLIC_SWAP_FEE_WALLET ?? "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9";
// --- Tipos, Hooks, Datos y ABI Mínimo ---
const TOKENLIST_URL = "https://tokens.uniswap.org";
const erc20Abi = [{"inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}] as const;
const TESTNET_IDS = [ 11155111, 84532, 421614, 534351, 80001, 5, 97 ];
const SUPPORTED_CHAINS = [
  { id: 8453, name: "Base" },
  { id: 1, name: "Ethereum" },
  { id: 137, name: "Polygon" },
  { id: 10, name: "Optimism" },
  { id: 42161, name: "Arbitrum" },
  { id: 56, name: "BNB Chain" },
  { id: 43114, name: "Avalanche" },
];

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


// --- Componente Principal del Swap ---
export function CustomSwap() {
  const account = useActiveAccount();
  const { connect } = useConnectModal();
  const [fromAmount, setFromAmount] = useState("");
  const [isTokenModalOpen, setTokenModalOpen] = useState<"from" | "to" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [fromChainId, setFromChainId] = useState(SUPPORTED_CHAINS[0]!.id);
  const [toChainId, setToChainId] = useState(SUPPORTED_CHAINS[0]!.id);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [animateColor, setAnimateColor] = useState(false);
  const [swapStep, setSwapStep] = useState<'form' | 'review' | 'swapping' | 'success' | 'error'>('form');
  const [approvingStatus, setApprovingStatus] = useState<'pending' | 'success' | 'error' | 'skipped'>('pending');
  const [swapStatus, setSwapStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [networkStatus, setNetworkStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fromTokenList = useTokenList(fromChainId);
  const toTokenList = useTokenList(toChainId);
  const activeTokenList = isTokenModalOpen === 'from' ? fromTokenList : toTokenList;

  useEffect(() => {
    if (fromTokenList.length > 0 && !fromToken) {
      setFromToken(fromTokenList.find(t => t.symbol === 'USDC') ?? fromTokenList[0]!);
    }
  }, [fromTokenList, fromToken]);
  
  useEffect(() => {
    if (toTokenList.length > 0 && !toToken) {
      setToToken(toTokenList.find(t => t.symbol === 'ETH') ?? toTokenList[0]!);
    }
  }, [toTokenList, toToken]);

  useEffect(() => {
    setFromToken(null); // Reset token when chain changes to refetch
  }, [fromChainId]);
  useEffect(() => {
    setToToken(null); // Reset token when chain changes to refetch
  }, [toChainId]);

  const { data: balance } = useWalletBalance({ client, address: account?.address ?? "", chain: fromToken?.chainId ? defineChain(fromToken.chainId) : undefined, tokenAddress: fromToken?.address });

  const fromAmountBaseUnits = useMemo(() => {
    if (!fromToken || !fromAmount || Number(fromAmount) <= 0) return 0n;
    try { return parseUnits(fromAmount, fromToken.decimals); } catch { return 0n; }
  }, [fromAmount, fromToken]);

  const isInvalidAmount = !fromAmount || isNaN(Number(fromAmount)) || Number(fromAmount) <= 0;
  const isSameToken = fromToken?.address === toToken?.address;
  const isInsufficientBalance = fromAmount && balance?.value && fromToken ? (fromAmountBaseUnits > balance.value) : false;
  const isReadyForQuote = account && fromToken && toToken && !isInvalidAmount && !isSameToken && !isInsufficientBalance;
  
  const swapParams = isReadyForQuote ? { 
    client, 
    fromAddress: account.address,
    toAddress: account.address,
    fromTokenAddress: fromToken.address, 
    toTokenAddress: toToken.address, 
    fromAmount: fromAmount,
    toChainId: toToken.chainId,
    fromChainId: fromToken.chainId,
    feeBps: 10,
    feeRecipient: FEE_WALLET,
  } : undefined;

  const { data: quote, isLoading: isQuoteLoading } = useBuyWithCryptoQuote(swapParams);
  const { mutateAsync: sendTx, isPending: isSwapping } = useSendTransaction();
  
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
    if (!quote?.swapDetails.toAmountWei || !toToken?.decimals) return null;
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
  const isTestnet = fromToken ? TESTNET_IDS.includes(fromToken.chainId) : false;

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

  // Additional validation for very large amounts that might cause 400 errors
  const isAmountTooLarge = fromAmount && Number(fromAmount) > 10000; // Arbitrary threshold, adjust based on testing

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

  // Hook de analíticas para el evento de éxito
  useSwapAnalytics({
    event: swapStep === 'success' ? "swap_success" : "",
    address: account?.address,
    fromToken,
    toToken,
    fromAmount,
    quote,
    marketRate,
    txStatus: 'success',
  });

  // Hook de analíticas para el evento de error
  useSwapAnalytics({
    event: swapStep === 'error' ? "swap_fail" : "",
    address: account?.address,
    fromToken,
    toToken,
    fromAmount,
    quote,
    marketRate,
    txStatus: 'error',
  });

  const executeSwap = async () => {
    if (!quote || !account) return;
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
    } catch (err: any) {
      console.error("Swap fallido", err);
      let friendlyMessage = "La transacción falló. Es posible que la hayas rechazado o que la cotización haya expirado.";
      
      // Handle specific Thirdweb/aggregator errors
      if (err.message?.includes('0x7939f424') || err.message?.includes('InsufficientLiquidity')) {
        friendlyMessage = "Liquidez insuficiente en la ruta seleccionada. Intenta con una cantidad menor o cambia los tokens.";
      } else if (err.message?.includes('400') || err.message?.includes('amount is too high')) {
        friendlyMessage = "La cantidad es demasiado alta para esta ruta. Prueba con un monto más pequeño.";
      } else if (err.message?.includes('No route is available')) {
        friendlyMessage = "No hay ruta disponible para este par de tokens. Verifica la liquidez o prueba otros tokens.";
      } else if (err.message?.includes('User rejected')) {
        friendlyMessage = "Transacción rechazada por el usuario.";
      }
      
      setErrorMessage(friendlyMessage);
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
    if (isQuoteLoading) return "Obteniendo cotización...";
    if (isQuoteUnrealistic) return "Cotización Inválida";
    if (isAmountTooLarge) return "Monto demasiado alto";
    if (isSwapping) return "Confirmando en wallet...";
    if (!quote && isReadyForQuote) return "Ruta no disponible";
    return "Revisar Swap";
  };
  
  return (
    <div className="flex flex-col gap-2 p-2 md:p-4 rounded-2xl bg-black/20">
      <Sheet open={!!isTokenModalOpen} onOpenChange={(isOpen: boolean) => !isOpen && setTokenModalOpen(null)}>
        <SheetContent className="bg-zinc-900 border-none text-white p-0 flex flex-col md:max-w-md md:rounded-2xl inset-x-0 bottom-0 md:inset-auto rounded-t-2xl h-[85vh] md:h-auto md:max-h-[600px]">
          <TokenSelector tokens={activeTokenList} onSelect={handleTokenSelect} currentSelection={isTokenModalOpen === 'from' ? toToken?.address ?? "" : fromToken?.address ?? ""} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </SheetContent>
      </Sheet>

      <ReviewModal 
        isOpen={swapStep === 'review'} 
        onOpenChange={(isOpen: boolean) => !isOpen && setSwapStep('form')} 
        onConfirm={() => void executeSwap()}
        isSwapping={isSwapping}
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

      <ChainAndTokenInput
        label="Desde"
        selectedChainId={fromChainId}
        onChainChange={setFromChainId}
        selectedToken={fromToken}
        onTokenSelect={() => setTokenModalOpen("from")}
        amount={fromAmount}
        onAmountChange={setFromAmount}
        chains={SUPPORTED_CHAINS}
        balance={balance ? parseFloat(balance.displayValue).toFixed(4) : undefined}
        onMax={handleMax}
        disabled={!account}
      />
      
      <div className="flex justify-center -my-4 z-10"><button className="p-1.5 bg-zinc-900 border-4 border-zinc-800 rounded-full text-gray-400" aria-label="Cambiar tokens de lugar" onClick={() => { if(fromToken && toToken) { const temp = fromToken; setFromToken(toToken); setToToken(temp); } }}><ArrowDownIcon className="w-4 h-4" /></button></div>
      
      <ChainAndTokenInput
        label="Hasta"
        selectedChainId={toChainId}
        onChainChange={setToChainId}
        selectedToken={toToken}
        onTokenSelect={() => setTokenModalOpen("to")}
        amount={displayToAmount}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onAmountChange={() => {}} // No-op
        chains={SUPPORTED_CHAINS}
        isAmountReadOnly={true}
        amountComponent={
          isQuoteLoading ? <Skeleton className="h-8 w-24 bg-zinc-700" /> :
          (isQuoteUnrealistic && marketRate !== null) ? <span className="text-lg text-orange-500">Cotización Irreal</span> :
          <span className={`transition-colors ${animateColor ? "text-lime-400" : "text-white"}`}>{displayToAmount}</span>
        }
      />
      
      {!marketRate && fromAmount && !isQuoteLoading && (
        <div className="text-center text-xs text-orange-400 font-semibold mt-2 p-2 bg-orange-900/30 rounded-lg">
          Advertencia: No hay tasa de mercado de referencia disponible. El valor mostrado es solo la estimación del agregador.
        </div>
      )}

      {account ? (
        <Button
          onClick={handleReview}
          disabled={!!error || isQuoteLoading || isSwapping || !quote || (isQuoteUnrealistic && marketRate !== null)}
          className="w-full mt-4 py-6 rounded-2xl font-bold text-lg text-zinc-900 bg-gradient-to-r from-lime-200 to-lime-300 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {buttonText()}
        </Button>
      ) : (
        <Button
         onClick={() => void connect({
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
          })}
         className="w-full mt-4 py-6 rounded-2xl font-bold text-lg text-zinc-900 bg-gradient-to-r from-lime-200 to-lime-300 transition-opacity hover:opacity-90"
        >
          {buttonText()}
          </Button>
      )}
    </div>
  );
}
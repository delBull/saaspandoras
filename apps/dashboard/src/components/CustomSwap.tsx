
'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import useQuote from "@/hooks/useQuote";
import type { Token } from "@/types/token";
import { UNISWAP_V3_SWAP_ROUTER_02_ADDRESSES, type SupportedChainId } from "@/lib/uniswap-v3-constants";
import { exactInputSingle } from "thirdweb/extensions/uniswap";
import { approve as thirdwebApprove, allowance as thirdwebAllowance } from "thirdweb/extensions/erc20";
import getThirdwebContract from "@/lib/get-contract";
import {
  useActiveAccount,
  useWalletBalance,
  useWaitForReceipt,
  useSendTransaction,
  useConnectModal
} from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { parseUnits, formatUnits } from "viem";
import { defineChain } from "thirdweb/chains";
import { useMarketRate } from '@/hooks/useMarketRate';
import { BadgeChain } from './BadgeChain';
import { useSwapAnalytics } from "@/hooks/useSwapAnalytics";
import { Bridge } from "thirdweb";
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

const TOKENLIST_URL = "https://tokens.uniswap.org";
const TESTNET_IDS = [ 11155111, 84532, 421614, 534351, 80001, 5, 97 ];
const SUPPORTED_CHAINS = [
  { id: 8453, name: "Base" },
  { id: 1, name: "Ethereum" },
  { id: 137, name: "Polygon" },
  { id: 10, name: "Optimism" },
  { id: 42161, name: "Arbitrum" },
  { id: 43114, name: "Avalanche" },
];

const QUOTE_EXPIRY_MS = 2 * 60 * 1000; // 2 minutos

function isQuoteExpired(quote: { fetchedAt?: number } | null | undefined): boolean {
  if (!quote || !quote.fetchedAt) {
    return true; // Si no hay cotización o no tiene timestamp, se considera expirada.
  }
  return Date.now() - quote.fetchedAt > QUOTE_EXPIRY_MS;
}

// --- Helper de Validación para Transacciones de Bridge ---
interface BridgeTx {
  value?: unknown;
  to?: string;
  from?: string;
  data?: string;
  action?: string;
}

// Solución de Thirdweb: Función de validación robusta
function validateBridgeTx(tx: BridgeTx): {
  ok: boolean;
  error?: string;
} {
  if (
    tx.value === undefined ||
    tx.value === null ||
    (typeof tx.value !== 'bigint' && (typeof tx.value !== 'number' || isNaN(tx.value)))
  ) {
    return { ok: false, error: "El monto (value) es inválido o está ausente." };
  }

  if (!tx.to || typeof tx.to !== "string" || !/^0x[a-fA-F0-9]{40}$/.test(tx.to)) {
    return { ok: false, error: "La dirección de destino ('to') es inválida o está ausente." };
  }

  return { ok: true };
}

function useTokenList(chainId: number) {
  const [tokens, setTokens] = useState<Token[]>([]);
  useEffect(() => {
    async function fetchTokens() {
      try {
        console.log(`Fetching tokens for chain ${chainId} from: ${TOKENLIST_URL}`);
        const res = await fetch(TOKENLIST_URL);
        if (!res.ok) {
          console.error(`Failed to fetch token list: ${res.status} ${res.statusText}`);
          // Fallback to default tokens for basic functionality
          const defaultTokens: Token[] = [
            { name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, chainId: chainId, logoURI: "https://tokens.uniswap.org/images/USDC.svg", image: "https://tokens.uniswap.org/images/USDC.svg" },
            { name: "Wrapped ETH", address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, chainId: chainId, logoURI: "https://tokens.uniswap.org/images/WETH.svg", image: "https://tokens.uniswap.org/images/WETH.svg" },
            { name: "DAI", address: "0x50c5725949A6F0c72E6C4A641F24049A917DB0Cb", symbol: "DAI", decimals: 18, chainId: chainId, logoURI: "https://tokens.uniswap.org/images/DAI.svg", image: "https://tokens.uniswap.org/images/DAI.svg" },
          ];
          console.log(`Using fallback tokens for chain ${chainId}`);
          setTokens(defaultTokens);
          return;
        }
        const data: { tokens: Token[] } = await res.json() as { tokens: Token[] };
        console.log('Token list response structure:', Object.keys(data));
        // Handle different response formats
        const tokenList = data.tokens ?? [];
        const filteredTokens = tokenList.filter((t) => Number(t.chainId) === chainId);
        console.log(`Loaded ${filteredTokens.length} tokens for chain ${chainId} from total ${tokenList.length || 0}`);
        if (filteredTokens.length === 0) {
          console.warn(`No tokens found for chain ${chainId}, using fallback`);
          // Add fallback tokens if no chain-specific tokens found
          const fallbackTokens: Token[] = [
            { name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, chainId: chainId, logoURI: "https://tokens.uniswap.org/images/USDC.svg", image: "https://tokens.uniswap.org/images/USDC.svg" },
            { name: "Wrapped ETH", address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, chainId: chainId, logoURI: "https://tokens.uniswap.org/images/WETH.svg", image: "https://tokens.uniswap.org/images/WETH.svg" },
          ];
          setTokens(fallbackTokens);
        } else {
          setTokens(filteredTokens);
        }
      } catch (error) {
        console.error(`Error fetching tokens:`, error);
        // Fallback to default tokens
        const defaultTokens: Token[] = [
          { name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", symbol: "USDC", decimals: 6, chainId: chainId, logoURI: "https://tokens.uniswap.org/images/USDC.svg", image: "https://tokens.uniswap.org/images/USDC.svg" },
          { name: "Wrapped ETH", address: "0x4200000000000000000000000000000000000006", symbol: "WETH", decimals: 18, chainId: chainId, logoURI: "https://tokens.uniswap.org/images/WETH.svg", image: "https://tokens.uniswap.org/images/WETH.svg" },
        ];
        console.log(`Using fallback tokens for chain ${chainId} due to error`);
        setTokens(defaultTokens);
        toast.error("Error al cargar la lista de tokens, usando tokens por defecto");
      }
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
  const [availableRoutes, setAvailableRoutes] = useState<Bridge.Route[]>([]);
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
      setFromToken(fromTokenList.find(t => t.symbol === 'USDC') || fromTokenList[0] || null);
    }
  }, [fromTokenList, fromToken]);
  
  useEffect(() => {
    if (toTokenList.length > 0 && !toToken) {
      setToToken(toTokenList.find(t => t.symbol === 'ETH') || toTokenList[0] || null);
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
  const isReadyForQuote = !!(account && fromToken && toToken && !isInvalidAmount && !isSameToken && !isInsufficientBalance);
  
  // Estado para la cotización del bridge con marca de tiempo
  const [bridgeQuote, setBridgeQuote] = useState<(Awaited<ReturnType<typeof Bridge.Sell.quote>> & { fetchedAt: number }) | null>(null);
  const [isBridgeQuoteLoading, setIsBridgeQuoteLoading] = useState(false);
  const { loading: uniswapQuoteLoading, fee: uniswapFee, outputAmount: uniswapOutputAmount } = useQuote({
    chainId: fromChainId,
    tokenIn: fromToken,
    tokenOut: toToken,
    amount: fromAmountBaseUnits
  });
  const { mutateAsync: sendTx, isPending: isSwapping } = useSendTransaction();

  const isSameChain = fromChainId === toChainId;
  const isCrossChain = fromToken && toToken && fromToken.chainId !== toToken.chainId;
  
  useEffect(() => {
    if (!isReadyForQuote || (isSameChain && uniswapOutputAmount && uniswapOutputAmount > 0n)) {
      setAvailableRoutes([]); // No buscar rutas de bridge si ya tenemos una de Uniswap
      return;
    }
    async function fetchRoutes() {
      try {
        if (!fromToken || !toToken) return; // Guard clause
        const routes = await Bridge.routes({
          originChainId: fromToken.chainId,
          originTokenAddress: fromToken.address,
          destinationChainId: toToken.chainId,
          destinationTokenAddress: toToken.address,
          client,
        });
        setAvailableRoutes(routes);
        console.log(`Found ${routes.length} Bridge routes for ${fromToken.symbol} -> ${toToken.symbol}`);
      } catch (error) {
        console.error('Error fetching routes:', error);
        setAvailableRoutes([]);
        toast.error('No routes available for this pair');
      }
    }
    void fetchRoutes();
  }, [fromToken, toToken, isReadyForQuote, isSameChain, uniswapOutputAmount]);

  // Solución de Thirdweb: Exponer fetchBridgeQuote con useCallback
  const fetchBridgeQuote = useCallback(async () => {
    if (!isReadyForQuote || availableRoutes.length === 0) {
      setBridgeQuote(null);
      return;
    }
    setIsBridgeQuoteLoading(true);
    try {
      if (!fromToken || !toToken) return; // Guard clause
      const preparedQuote = await Bridge.Sell.quote({
        originChainId: fromToken.chainId,
        originTokenAddress: fromToken.address,
        destinationChainId: toToken.chainId,
        destinationTokenAddress: toToken.address,
        amount: fromAmountBaseUnits,
        client,
      });
      // Añadir marca de tiempo a la cotización
      setBridgeQuote({ ...preparedQuote, fetchedAt: Date.now() });
    } catch (error) {
      console.error('Error getting bridge quote:', error);
      setBridgeQuote(null);
    } finally {
      setIsBridgeQuoteLoading(false);
    }
  }, [isReadyForQuote, availableRoutes.length, fromToken, toToken, fromAmountBaseUnits]);

  // Solución de Thirdweb: Llamar a fetchBridgeQuote cuando los inputs cambian
  useEffect(() => {
    void fetchBridgeQuote();
  }, [fetchBridgeQuote]);
  
  // Solución de Thirdweb: Refresco de Cotización Post-Aprobación
  useEffect(() => {
    if (approvingStatus === 'success' && !isSameChain) {
      toast.info("Actualizando cotización después de la aprobación...");
      void fetchBridgeQuote();
    }
  }, [approvingStatus, isSameChain, fetchBridgeQuote]);
  const { data: receipt, isLoading: isWaitingForConfirmation } = useWaitForReceipt(
    txHash && fromToken
      ? {
          client,
          transactionHash: txHash,
          chain: defineChain(fromToken.chainId), // fromToken is guaranteed here
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
    if (isSameChain && uniswapOutputAmount && toToken?.decimals) {
      try {
        return parseFloat(formatUnits(uniswapOutputAmount, toToken.decimals));
      } catch {
        return null; 
      }
    } else if (bridgeQuote?.destinationAmount && toToken?.decimals) {
      try { // This is for the bridge quote
        return parseFloat(formatUnits(bridgeQuote.destinationAmount, toToken.decimals));
      } catch {
        return null;
      }
    }
    return null;
  }, [uniswapOutputAmount, bridgeQuote, toToken, isSameChain]);

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
  
  const quoteLoading = isSameChain ? uniswapQuoteLoading : isBridgeQuoteLoading;
  
  // This is the core logic fix. We determine which quote to use.
  // Prioritize Uniswap V3 if available, otherwise use the Bridge quote.
  const currentQuote = useMemo(() => {
    if (isSameChain && uniswapOutputAmount && uniswapOutputAmount > 0n) {
      return { outputAmount: uniswapOutputAmount, fee: uniswapFee };
    }
    return bridgeQuote;
  }, [isSameChain, uniswapOutputAmount, uniswapFee, bridgeQuote]);

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
    if (isSameToken) {
      setError("Debes escoger tokens diferentes.");
    }
    else if (isInsufficientBalance) {
      setError("No tienes suficiente saldo.");
    }
    else setError(null);
  }, [isSameToken, isInsufficientBalance]);

  const handleReview = () => {
    if (error) { toast.error(error); return; }
    if (isQuoteUnrealistic && marketRate !== null) { toast.error("La cotización es muy diferente al precio de mercado."); return; }
    // Simplified check: if there's no valid currentQuote, there's no path.
    // Solución de Thirdweb: Verificar si la cotización ha expirado
    if (bridgeQuote && Date.now() - bridgeQuote.fetchedAt > 2 * 60 * 1000) { // 2 minutos
      toast.error(
        "La cotización ha expirado. Por favor, actualiza antes de continuar.",
      );
      void fetchBridgeQuote(); // Refrescar automáticamente
      return;
    }
    if (!currentQuote || !account) { toast.error("No hay ruta disponible para este par."); return; }
    setSwapStep('review');
  };

  // Hook de analíticas para el evento de éxito
  useSwapAnalytics({
    event: swapStep === 'success' ? "swap_success" : "",
    address: account?.address,
    fromToken,
    toToken,
    fromAmount,
    quote: currentQuote,
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
    quote: currentQuote,
    marketRate,
    txStatus: 'error',
  });

  const executeSwap = async () => {
    // GUARDS universales
    if (!currentQuote) {
      toast.error("No hay ruta disponible para este par.");
      setSwapStep("form");
      return;
    }
    if (!account) {
      toast.error("Debes conectar tu wallet.");
      setSwapStep("form");
      return;
    }

    setSwapStep('swapping');
    setApprovingStatus('pending'); setSwapStatus('pending'); setNetworkStatus('pending');
    try {
      if (isSameChain) {
        if (!fromToken || !toToken) {
          toast.error("Debes seleccionar ambos tokens antes de continuar.");
          setSwapStep('form'); // Volver al formulario
          return;
        }
        if (typeof uniswapFee !== "number") {
          toast.error("No se pudo obtener una tarifa válida para el pool. Intenta de nuevo.");
          setSwapStep('form'); // Volver al formulario
          return;
        }

        // Same-chain Uniswap V3 swap
        const inputTokenContract = getThirdwebContract({ address: fromToken.address, chainId: fromChainId });
        const allowance = await thirdwebAllowance({ contract: inputTokenContract, owner: account.address as `0x${string}`, spender: UNISWAP_V3_SWAP_ROUTER_02_ADDRESSES[fromChainId as SupportedChainId] });
        if (allowance < fromAmountBaseUnits) {
          const approveTx = thirdwebApprove({ contract: inputTokenContract, spender: UNISWAP_V3_SWAP_ROUTER_02_ADDRESSES[fromChainId as SupportedChainId], amountWei: fromAmountBaseUnits });
          await sendTx(approveTx);
          setApprovingStatus('success');
        }
        const routerContract = getThirdwebContract({ address: UNISWAP_V3_SWAP_ROUTER_02_ADDRESSES[fromChainId as SupportedChainId], chainId: fromChainId });
        const swapTx = exactInputSingle({
          contract: routerContract,
          params: {
            tokenIn: fromToken.address,
            tokenOut: toToken.address,
            fee: uniswapFee,
            recipient: account.address as `0x${string}`,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 20), // 20 minutes from now
            amountIn: fromAmountBaseUnits,
            amountOutMinimum: 0n,
            sqrtPriceLimitX96: 0n,
          }
        });
        const txResult = await sendTx(swapTx);
        setTxHash(txResult.transactionHash);
        setSwapStatus('success');
      } else {
        // SWAP CROSS-CHAIN (Bridge)
        if (!fromToken || !toToken) {
          toast.error(
            "Selecciona ambos tokens antes de swapear.",
          );
          setSwapStep("form");
          return;
        }

        const preparedQuote = await Bridge.Sell.prepare({
          originChainId: fromToken.chainId,
          originTokenAddress: fromToken.address,
          destinationChainId: toToken.chainId,
          destinationTokenAddress: toToken.address,
          sender: account.address,
          receiver: account.address,
          amount: fromAmountBaseUnits,
          client,
        });

        for (const step of preparedQuote.steps) {
          for (const tx of step.transactions) {
            const validation = validateBridgeTx(tx);
            if (!validation.ok) {
              console.error("Validación de transacción fallida:", validation.error, tx);
              setErrorMessage(`Falló el swap: ${validation.error} Por favor, vuelve a cotizar.`);
              setSwapStep('error');
              return; // Detiene la ejecución
            }

            if (tx.action === "approval") {
              setApprovingStatus('pending');
              await sendTx(tx);
              setApprovingStatus('success');
            } else if (tx.action === "sell") {
              const txResult = await sendTx(tx);
              setTxHash(txResult.transactionHash);
            }
          }
        }
        setSwapStatus('success');
      }
      setNetworkStatus('success');
      setSwapStep('success');
    } catch (err) {
      console.error("Swap fallido", err);
      let friendlyMessage = "La transacción falló. Es posible que la hayas rechazado o que la cotización haya expirado.";
      
      // Handle specific errors
      if (err instanceof Error && (err.message.includes('0x7939f424') || err.message.includes('InsufficientLiquidity'))) {
        friendlyMessage = "Liquidez insuficiente en la ruta seleccionada. Intenta con una cantidad menor o cambia los tokens.";
      } else if (err instanceof Error && (err.message.includes('400') || err.message.includes('amount is too high'))) {
        friendlyMessage = "La cantidad es demasiado alta para esta ruta. Prueba con un monto más pequeño.";
      } else if (err instanceof Error && err.message.includes('No route is available')) {
        friendlyMessage = "No hay ruta disponible para este par de tokens. Verifica la liquidez o prueba otros tokens.";
      } else if (err instanceof Error && err.message.includes('User rejected')) {
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
  const handleTokenSelect = (token: Token): void => {
    if (isTokenModalOpen === "from") setFromToken(token);
    if (isTokenModalOpen === "to") setToToken(token);
    setTokenModalOpen(null); 
    setSearchTerm("");
  };

  const buttonText = (): string => {
    if (!account) return "Conectar Wallet";
    if (isInvalidAmount && fromAmount) return "Ingresa un monto válido";
    if (error) return error;
    if (quoteLoading) return "Obteniendo cotización...";
    if (isQuoteUnrealistic) return "Cotización Inválida";
    if (isAmountTooLarge) return "Monto demasiado alto";
    if (isSwapping) return "Confirmando en wallet...";
    if (!currentQuote && isReadyForQuote) return "Ruta no disponible";
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
        quote={currentQuote}
        fee={isSameChain ? uniswapFee : undefined}
        expectedAmount={expectedAmount}
        quotedAmount={quotedAmountAsNumber}
        priceImpact={priceImpact}
        marketRate={marketRate}
        isQuoteExpired={isCrossChain ? isQuoteExpired(bridgeQuote) : false}
        onRefreshQuote={fetchBridgeQuote}
        isRefreshingQuote={isBridgeQuoteLoading}
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
          quoteLoading ? <Skeleton className="h-8 w-24 bg-zinc-700" /> :
          (isQuoteUnrealistic && marketRate !== null) ? <span className="text-lg text-orange-500">Cotización Irreal</span> :
          <span className={`transition-colors ${animateColor ? "text-lime-400" : "text-white"}`}>{displayToAmount}</span>
        }
      />
      
      {!marketRate && fromAmount && !quoteLoading && quotedAmountAsNumber === null && (
        <div className="text-center text-xs text-orange-400 font-semibold mt-2 p-2 bg-orange-900/30 rounded-lg">
          Advertencia: No hay tasa de mercado de referencia disponible. El valor mostrado es solo la estimación del agregador.
        </div>
      )}

      {account ? (
        <Button
          onClick={handleReview}
          disabled={!!error || quoteLoading || isSwapping || !currentQuote || (isQuoteUnrealistic && marketRate !== null)}
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
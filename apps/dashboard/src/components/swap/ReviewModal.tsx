'use client';

import type { BuyWithCryptoQuote } from "thirdweb/pay";
import { formatUnits } from "viem";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@saasfly/ui/dialog";
import { Button } from "@saasfly/ui/button";
import { ArrowDownIcon, Loader2 } from "lucide-react";
import { TokenImage } from '../TokenImage';
import { BadgeChain } from '../BadgeChain';

interface Token {
  name: string;
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
}

export interface ReviewModalProps {
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

export function ReviewModal({ isOpen, onOpenChange, onConfirm, fromToken, toToken, fromAmount, displayToAmount, quote, isSwapping, expectedAmount, quotedAmount, priceImpact, marketRate, }: ReviewModalProps) {
  if (!fromToken || !toToken || !quote) return null;
  // Ahora los accesos son 100% seguros porque usamos el tipo oficial
  const minAmount = quote.swapDetails.toAmountMinWei ? formatUnits(BigInt(quote.swapDetails.toAmountMinWei), toToken.decimals) : "0.0";
  const slippage = quote.swapDetails.maxSlippageBPS ? (quote.swapDetails.maxSlippageBPS / 100).toFixed(2) : "0.00";
  const gasCost = quote.swapDetails.estimated?.gasCostUSDCents ? (quote.swapDetails.estimated.gasCostUSDCents / 100).toFixed(4) : "0.0000";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white" aria-describedby="review-modal-desc">
        <DialogHeader>
          <DialogTitle className="text-xl">Revisar Transacción</DialogTitle>
          <DialogDescription id="review-modal-desc">
            Confirma los detalles antes de swappear.
            {!marketRate && (
              <div className="text-orange-400 font-bold mt-2">Advertencia: No hay tasa de mercado de referencia disponible.</div>
            )}
            {priceImpact !== null && priceImpact > 0.15 && (
              <div className="text-orange-300 font-bold mt-2">¡Impacto muy alto! Verifica la cotización real antes de firmar.</div>
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
            <div className="flex mt-2"><span className={ priceImpact !== null && priceImpact > 0.15 ? "text-orange-400 font-bold" : "text-green-400" } >Impacto estimado:{" "}{priceImpact !== null ? (priceImpact * 100).toFixed(2) + "%" : "N/A"}</span></div>
            <div style={{ fontSize: 10, color: "#9ca3af" }}><div> Referencia CoinGecko:{" "} {marketRate !== null ? marketRate.toPrecision(7) : "N/A"} </div><div> Esperado:{" "} {expectedAmount !== null ? expectedAmount.toLocaleString("en-US", { maximumFractionDigits: 8, }) : "N/A"}{" "} {toToken.symbol} </div><div> Cotizado:{" "} {quotedAmount !== null ? quotedAmount.toLocaleString("en-US", { maximumFractionDigits: 8, }) : "N/A"}{" "} {toToken.symbol} </div></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSwapping}>Cancelar</Button><Button onClick={onConfirm} className="bg-lime-400 text-black hover:bg-lime-500" disabled={isSwapping}>{isSwapping ? <Loader2 className="animate-spin" /> : "Confirmar Swap"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

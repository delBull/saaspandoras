"use client";

import { useEffect, useState, useRef } from "react";
import { client } from "@saasfly/shared";
import { defineChain, getContract } from "thirdweb";
import { TransactionButton, ConnectButton, useActiveAccount } from "thirdweb/react";
import {
  Loader2, CheckCircle2, ShieldCheck, ArrowUpRight,
  Zap, Link2, XCircle, Copy, Check, Radio, Landmark
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

// NOTE: Uses same Binance WS and rates as PrivatePaymentCheckout for consistency.
const USDC_BASE    = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

type StoredCurrency = "USD" | "MXN" | "USDT" | "USDC";
type TxStep = "idle" | "signing" | "pending" | "confirmed";
type PaymentMethod = "crypto" | "wire";

interface Rates {
  usdToMxn:  number;
  usdtToUsd: number;
  usdcToUsd: number;
  wsLive:    boolean;
}

const DEFAULT_RATES: Rates = { usdToMxn: 17.5, usdtToUsd: 1.0, usdcToUsd: 1.0, wsLive: false };

function useRealtimeRates(): Rates {
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(async (r) => {
        const j = await r.json();
        if (typeof j?.rates?.MXN === "number") setRates((prev) => ({ ...prev, usdToMxn: j.rates.MXN }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const STREAM = "wss://stream.binance.com:9443/stream?streams=usdcusdt@ticker/usdtbusd@ticker";
    function connect() {
      try {
        const ws = new WebSocket(STREAM);
        wsRef.current = ws;
        ws.onopen = () => setRates((p) => ({ ...p, wsLive: true }));
        ws.onmessage = (ev) => {
          try {
            const { stream, data } = JSON.parse(ev.data);
            const price = parseFloat(data?.c ?? "0");
            if (!price) return;
            if (stream === "usdcusdt@ticker") setRates((p) => ({ ...p, usdcToUsd: price, usdtToUsd: price }));
          } catch {}
        };
        ws.onclose = () => { setRates((p) => ({ ...p, wsLive: false })); setTimeout(connect, 5000); };
        ws.onerror = () => ws.close();
      } catch {}
    }
    if (typeof window !== "undefined") connect();
    return () => wsRef.current?.close();
  }, []);
  return rates;
}

const CUR_SYMBOL: Record<StoredCurrency, string> = { USD: "$", MXN: "$", USDT: "₮", USDC: "$" };
function fmt(n: number, d = 2) { return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }); }
function fmtMXN(n: number) { return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function toUSD(amount: number, currency: StoredCurrency, r: Rates): number {
  if (currency === "MXN")  return amount / r.usdToMxn;
  if (currency === "USDT") return amount * r.usdtToUsd;
  if (currency === "USDC") return amount * r.usdcToUsd;
  return amount;
}
function computeAll(amount: number, currency: StoredCurrency, r: Rates) {
  const usd  = toUSD(amount, currency, r);
  return { usd, mxn: usd * r.usdToMxn, usdt: usd / r.usdtToUsd, usdc: usd / r.usdcToUsd };
}

// ── Hermes Unified Checkout Component ──────────────────────────────────────────
export function HermesUnifiedCheckout({ intentId, fetchUrl = "/api/private/pay" }: { intentId: string, fetchUrl?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTx, setCompletedTx] = useState<string | null>(null);
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [method, setMethod] = useState<PaymentMethod>("crypto");
  
  const rates = useRealtimeRates();

  useEffect(() => {
    fetch(`${fetchUrl}/${intentId}`)
      .then(async (res) => { const j = await res.json(); if (!res.ok) throw new Error(j.error || "Error"); setData(j.data); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [intentId, fetchUrl]);

  const handleWireReport = async () => {
    setTxStep("pending");
    toast.info("Notificando intención de pago vía Wire...");
    try {
      await fetch("/api/v1/payments/report-wire", {
        method: "POST",
        body: JSON.stringify({ linkId: intentId, amount: storedAmount, currency: storedCurrency })
      });
      setTxStep("confirmed");
      toast.success("Notificación enviada. Esperando validación ejecutiva.");
    } catch(err) {
      setTxStep("idle");
      toast.error("Error al notificar el pago.");
    }
  };

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-lime-400" /></div>;
  if (error || !data) return <div className="p-8 text-center text-red-400">{error || "No encontrado"}</div>;

  const storedAmount = Number(data.amount);
  const storedCurrency = (data.currency || "USD") as StoredCurrency;
  const all = computeAll(storedAmount, storedCurrency, rates);
  const usdcAmount = all.usdc;

  // Strict Environment Chain Separation (P0-2)
  const isProd = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENVIRONMENT === "production";
  const chainId = isProd ? 8453 : (data.networkChainId || 11155111);
  if (isProd && data.networkChainId && data.networkChainId !== 8453) {
    console.warn("[Security] Forcing Base Mainnet for production settlement.");
  }
  const tokenAddress = data.settlementToken || (chainId === 11155111 ? USDC_SEPOLIA : USDC_BASE);
  const tokenContract = getContract({ client, chain: defineChain(chainId), address: tokenAddress });

  return (
    <div className="w-full max-w-md mx-auto flex flex-col rounded-2xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-xl shadow-2xl mt-4 overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest text-zinc-500 font-bold">
          <ShieldCheck className="w-4 h-4 text-lime-400" /> Hermes Billing Hub
        </div>
        <h1 className="text-xl font-bold text-white">{data.title}</h1>
        {data.description && <p className="text-sm text-zinc-400 mt-1">{data.description}</p>}
      </div>

      {/* Amount Display */}
      <div className="px-5 py-4 border-b border-zinc-800/50">
         <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white">{CUR_SYMBOL[storedCurrency]}{fmt(storedAmount)}</span>
            <span className="text-lg font-bold text-zinc-500">{storedCurrency}</span>
         </div>
         {method === "crypto" && (
           <div className="mt-2 text-sm text-zinc-400 flex justify-between">
             <span>Liquidación USDC:</span>
             <span className="font-mono font-bold text-lime-400">{fmt(usdcAmount, 4)} USDC</span>
           </div>
         )}
      </div>

      {/* Method Selector */}
      <div className="px-5 py-4 flex gap-3 border-b border-zinc-800/50">
         <button onClick={() => setMethod("crypto")} className={`flex-1 py-2 px-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-colors ${method === "crypto" ? "bg-lime-400/10 border-lime-400 text-lime-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>
            <Zap className="w-5 h-5" /> Web3 (Crypto)
         </button>
         <button onClick={() => setMethod("wire")} className={`flex-1 py-2 px-3 rounded-xl border text-sm font-bold flex flex-col items-center gap-1 transition-colors ${method === "wire" ? "bg-blue-400/10 border-blue-400 text-blue-400" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}>
            <Landmark className="w-5 h-5" /> Wire / SPEI
         </button>
      </div>

      {/* Action Section */}
      <div className="px-5 py-5">
        {method === "crypto" ? (
           <PayWithCrypto 
             tokenContract={tokenContract} 
             data={data} 
             usdcAmount={usdcAmount} 
             intentId={intentId}
             txStep={txStep}
             setTxStep={setTxStep}
             setCompletedTx={setCompletedTx}
           />
        ) : (
           <PayWithWire amount={storedAmount} currency={storedCurrency} onReport={handleWireReport} txStep={txStep} />
        )}
      </div>

      {completedTx && method === "crypto" && (
        <div className="px-5 pb-5 text-center">
          <p className="text-xs text-lime-400 font-mono break-all bg-lime-400/10 p-2 rounded-lg border border-lime-400/20">{completedTx}</p>
        </div>
      )}
    </div>
  );
}

function PayWithCrypto({ tokenContract, data, usdcAmount, intentId, txStep, setTxStep, setCompletedTx }: any) {
  const account = useActiveAccount();
  
  const handleSettlement = async (txHash: string) => {
      setTxStep("confirmed"); 
      toast.success("Pago en red confirmado");
      setCompletedTx(txHash);
      
      try {
        await fetch("/api/v1/payments/settle", {
          method: "POST",
          body: JSON.stringify({ linkId: intentId, txHash: txHash, amount: usdcAmount, currency: "USDC" })
        });
        toast.success("Liquidación orquestada en Pandora's OS");
      } catch(e) {
        console.error(e);
      }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* TODO (P0-1): Migrate to CheckoutWidget (Thirdweb v5) for Fiat-to-Crypto Commerce. PayEmbed is deprecated. */}
      
      {!account ? (
        <ConnectButton client={client} theme="dark" connectButton={{ label: "Conectar Wallet Web3", style: { width: "100%", background: "#a3e635", color: "#000", fontWeight: "bold" } }} />
      ) : (
        <TransactionButton
          transaction={() => { setTxStep("signing"); return import("thirdweb/extensions/erc20").then(ext => ext.transfer({ contract: tokenContract, to: data.destinationWallet, amount: usdcAmount })); }}
          onTransactionSent={() => setTxStep("pending")}
          onTransactionConfirmed={(tx) => handleSettlement(tx.transactionHash)}
          onError={() => { setTxStep("idle"); toast.error("Error on-chain"); }}
          theme="dark"
          className="!bg-lime-400 !text-black !font-black !w-full !py-3 !rounded-xl"
        >
          {txStep === "idle" ? `Liquidar ${fmt(usdcAmount, 4)} USDC via Wallet` : "Procesando..."}
        </TransactionButton>
      )}
    </div>
  );
}

function PayWithWire({ amount, currency, onReport, txStep }: any) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-2 text-sm text-zinc-300">
        <p><span className="text-zinc-500">Banco:</span> Banregio</p>
        <p><span className="text-zinc-500">CLABE:</span> 058320000000000000</p>
        <p><span className="text-zinc-500">Beneficiario:</span> Pandora's Ecosystem</p>
        <p><span className="text-zinc-500">Monto exacto:</span> {CUR_SYMBOL[currency as StoredCurrency]}{fmt(amount)} {currency}</p>
      </div>
      <button 
        onClick={onReport} 
        disabled={txStep !== "idle"}
        className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold transition-colors disabled:opacity-50"
      >
        {txStep === "idle" ? "Ya realicé la transferencia" : "Validando..."}
      </button>
      <p className="text-[10px] text-zinc-500 text-center leading-tight">
        Al confirmar, se enviará una solicitud de validación ejecutiva. Su plan se activará en cuanto nuestro equipo confirme el depósito.
      </p>
    </div>
  );
}

"use client";

import { memo, useEffect, useMemo, useState, useRef, useCallback } from "react";
import { client } from "@saasfly/shared/thirdweb-client";
import { defineChain, getContract } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { TransactionButton, ConnectButton, useActiveAccount } from "thirdweb/react";
import {
  Loader2, CheckCircle2, ShieldCheck, ArrowUpRight,
  Zap, Link2, XCircle, Copy, Check, Radio, CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { wallets } from "@/lib/wallets";
import { BuyUsdcPanel } from "./BuyUsdcPanel";

const USDC_BASE    = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

type StoredCurrency = "USD" | "MXN" | "USDT" | "USDC";
type TxStep = "idle" | "signing" | "pending" | "confirmed";

interface Rates {
  usdToMxn:  number; // 1 USD → MXN  (fiat, daily via open.er-api)
  usdtToUsd: number; // 1 USDT → USD  (≈ 1.000, Binance WS)
  usdcToUsd: number; // 1 USDC → USD  (Binance WS — real-time)
  wsLive:    boolean; // Binance WS connected
}

const DEFAULT_RATES: Rates = {
  usdToMxn: 17.5, usdtToUsd: 1.0, usdcToUsd: 1.0, wsLive: false,
};

// ── Binance WebSocket hook ────────────────────────────────────────────────────
// Streams: usdcusdt (USDC real price) · used as USDT proxy too (both ≈ $1)
// MXN: client-side fetch to open.er-api.com on mount (fresh, no 30-min server cache)
function useRealtimeRates(): Rates {
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const wsRef = useRef<WebSocket | null>(null);

  // 1) MXN rate — fetch directly from open.er-api on client (bypasses Vercel edge cache)
  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(async (r) => {
        const j = await r.json();
        if (typeof j?.rates?.MXN === "number") {
          setRates((prev) => ({ ...prev, usdToMxn: j.rates.MXN }));
        }
      })
      .catch(() => {/* keep default */});
  }, []);

  // 2) Binance WebSocket — USDC/USDT real-time price
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
            if (stream === "usdcusdt@ticker") {
              // 1 USDC = price USDT ≈ price USD
              setRates((p) => ({ ...p, usdcToUsd: price, usdtToUsd: price }));
            }
          } catch { /* ignore malformed */ }
        };

        ws.onclose = () => {
          setRates((p) => ({ ...p, wsLive: false }));
          // Reconnect after 5s
          setTimeout(connect, 5000);
        };
        ws.onerror = () => ws.close();
      } catch { /* WS not available (SSR guard) */ }
    }

    if (typeof window !== "undefined") connect();
    return () => wsRef.current?.close();
  }, []);

  return rates;
}

// ── Currency helpers ──────────────────────────────────────────────────────────
const CUR_SYMBOL: Record<StoredCurrency, string> = { USD: "$", MXN: "$", USDT: "₮", USDC: "$" };
const CUR_FLAG:   Record<StoredCurrency, string> = { USD: "🇺🇸", MXN: "🇲🇽", USDT: "₮", USDC: "🔵" };

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtMXN(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Convert stored amount to USD
function toUSD(amount: number, currency: StoredCurrency, r: Rates): number {
  if (currency === "MXN")  return amount / r.usdToMxn;
  if (currency === "USDT") return amount * r.usdtToUsd;
  if (currency === "USDC") return amount * r.usdcToUsd;
  return amount;
}

// All 4 cross-rates
function computeAll(amount: number, currency: StoredCurrency, r: Rates) {
  const usd  = toUSD(amount, currency, r);
  return {
    usd,
    mxn:  usd * r.usdToMxn,
    usdt: usd / r.usdtToUsd,
    usdc: usd / r.usdcToUsd,  // settlement amount
  };
}

// ── Wallet identicon ──────────────────────────────────────────────────────────
function WalletIdenticon({ address }: { address: string }) {
  const hash = address.toLowerCase().split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffff, 0);
  const hue = hash % 360;
  const colors = Array.from({ length: 9 }, (_, i) => `hsl(${(hash * (i + 1) * 137) % 360},65%,${40 + (i % 3) * 15}%)`);
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border-2" style={{ borderColor: `hsl(${hue},70%,50%)` }}>
      <svg width="28" height="28" viewBox="0 0 3 3">
        {colors.map((fill, i) => <rect key={i} x={i % 3} y={Math.floor(i / 3)} width="1" height="1" fill={fill} />)}
      </svg>
    </div>
  );
}

// ── TX Progress ───────────────────────────────────────────────────────────────
const TX_STEPS = [
  { key: "signing"   as TxStep, label: "Esperando firma..." },
  { key: "pending"   as TxStep, label: "Confirmando en Base..." },
  { key: "confirmed" as TxStep, label: "Liquidado ✓" },
];
function TxProgress({ step }: { step: TxStep }) {
  const idx = TX_STEPS.findIndex((s) => s.key === step);
  if (idx < 0) return null;
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
      <Loader2 className={`w-3 h-3 text-lime-400 flex-shrink-0 ${step !== "confirmed" ? "animate-spin" : ""}`} />
      <span className="text-zinc-300 font-medium truncate">{TX_STEPS[idx]?.label}</span>
      <div className="ml-auto flex gap-1 flex-shrink-0">
        {TX_STEPS.map((s, i) => <span key={s.key} className={`w-1.5 h-1.5 rounded-full ${i <= idx ? "bg-lime-400" : "bg-zinc-700"}`} />)}
      </div>
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-1 text-zinc-600 hover:text-lime-400 transition-colors flex-shrink-0" style={{ touchAction: "manipulation" }}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Amount panel with 4 cross-rates ──────────────────────────────────────────
function AmountPanel({ amount, currency, rates }: {
  amount: number; currency: StoredCurrency; rates: Rates;
}) {
  const all = computeAll(amount, currency, rates);

  const mainFmt = currency === "MXN"
    ? `${CUR_SYMBOL[currency]}${fmtMXN(amount)}`
    : `${CUR_SYMBOL[currency]}${fmt(amount, currency === "USDT" || currency === "USDC" ? 4 : 2)}`;

  // Cross-rates: the 3 not-selected currencies
  type RefRow = { label: string; value: string; live: boolean };
  const refs: RefRow[] = [];
  if (currency !== "USD")  refs.push({ label: `${CUR_FLAG.USD} USD`,  value: `$${fmt(all.usd)}`, live: false });
  if (currency !== "MXN")  refs.push({ label: `${CUR_FLAG.MXN} MXN`,  value: `$${fmtMXN(all.mxn)}`, live: false });
  if (currency !== "USDT") refs.push({ label: `${CUR_FLAG.USDT} USDT`, value: `₮${fmt(all.usdt, 4)}`, live: rates.wsLive });
  if (currency !== "USDC") refs.push({ label: `${CUR_FLAG.USDC} USDC`, value: `$${fmt(all.usdc, 4)}`, live: rates.wsLive });

  return (
    <div className="flex flex-col p-3.5 rounded-xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/40 border border-zinc-800/60 gap-2.5">
      {/* Live badge */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Monto a Pagar</span>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
          rates.wsLive
            ? "text-lime-400 bg-lime-400/10 border-lime-400/20"
            : "text-zinc-600 bg-zinc-900 border-zinc-800"
        }`}>
          <Radio className={`w-2.5 h-2.5 ${rates.wsLive ? "animate-pulse" : ""}`} />
          {rates.wsLive ? "LIVE · Binance" : "Cargando..."}
        </div>
      </div>

      {/* Primary amount */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black tracking-tight text-white font-mono leading-none">{mainFmt}</span>
        <span className="text-sm font-bold text-zinc-400">{currency}</span>
      </div>

      <div className="border-t border-zinc-800/50" />

      {/* Cross-rates */}
      <div className="space-y-1.5">
        {refs.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">{r.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-300 font-semibold">{r.value}</span>
              {r.live && <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse flex-shrink-0" title="Precio en tiempo real" />}
            </div>
          </div>
        ))}

        {/* USDC settlement row (always shown, highlighted) */}
        <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800/40 mt-0.5">
          <span className="text-[11px] text-zinc-600">Liquidación USDC on-chain</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-lime-400/10 border border-lime-400/20">
            <span className="text-xs font-black text-lime-400 font-mono">{fmt(all.usdc, 4)}</span>
            <span className="text-[9px] font-bold text-lime-400/70">USDC</span>
            {rates.wsLive && <span className="w-1 h-1 rounded-full bg-lime-400 animate-pulse ml-0.5 flex-shrink-0" />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pay Section ───────────────────────────────────────────────────────────────
const PaySection = memo(function PaySection({ data, tokenContract, txStep, setTxStep, setCompletedTx, usdcAmount }: {
  data: any; tokenContract: any; txStep: TxStep;
  setTxStep: (s: TxStep) => void; setCompletedTx: (tx: string) => void; usdcAmount: number;
}) {
  const account = useActiveAccount();
  return (
    <div className="px-4 pt-3 pb-1 flex-shrink-0">
      {!account ? (
        <>
          <p className="text-[11px] text-zinc-500 text-center mb-2">Conecta con wallet o inicio de sesión social</p>
          <ConnectButton client={client} theme="dark" wallets={wallets}
            connectButton={{ label: "Conectar Wallet para Pagar", style: { width: "100%", background: "#a3e635", color: "#000", fontWeight: "900", fontSize: "0.9rem", padding: "0.85rem", borderRadius: "0.75rem", border: "none", touchAction: "manipulation" } }} />
        </>
      ) : (
        <TransactionButton
          transaction={() => { setTxStep("signing"); return transfer({ contract: tokenContract, to: data.destinationWallet, amount: usdcAmount }); }}
          onTransactionSent={() => setTxStep("pending")}
          onTransactionConfirmed={(tx) => { setTxStep("confirmed"); toast.success("¡Pago liquidado!"); setTimeout(() => setCompletedTx(tx.transactionHash), 500); }}
          onError={(err) => { setTxStep("idle"); console.error("[PrivateCheckout]", err); toast.error("Error al procesar la transacción"); }}
          theme="dark"
          style={{ touchAction: "manipulation", width: "100%" }}
          className="!bg-lime-400 hover:!bg-lime-300 active:!bg-lime-500 !text-black !font-black !py-3.5 !rounded-xl !transition-all !duration-150 !text-sm !tracking-tight !shadow-lg !shadow-lime-500/20"
        >
          Pagar {fmt(usdcAmount, 4)} USDC
        </TransactionButton>
      )}
    </div>
  );
});

// ── Sub-components ────────────────────────────────────────────────────────────
function NexusHeader() {
  return (
    <div className="text-center flex-shrink-0 py-1">
      <div className="inline-flex flex-col items-center gap-0">
        <span className="text-[9px] uppercase tracking-[0.3em] font-semibold text-lime-400">PANDORAS</span>
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-lime-400/60 to-transparent" />
        <span className="text-xl font-black tracking-widest text-white leading-tight">NEXUS</span>
      </div>
    </div>
  );
}

function SecurityBand() {
  return (
    <div className="mx-4 my-2 flex rounded-xl bg-zinc-900/50 border border-zinc-800/40 overflow-hidden divide-x divide-zinc-800/40 flex-shrink-0">
      {[{ icon: ShieldCheck, label: "Non-custodial" }, { icon: Zap, label: "Base Network" }, { icon: Link2, label: "USDC Nativo" }]
        .map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1 px-2 py-2 text-[10px] text-zinc-500 font-medium flex-1 justify-center">
            <Icon className="w-2.5 h-2.5 text-lime-400/70 flex-shrink-0" /><span className="truncate">{label}</span>
          </div>
        ))}
    </div>
  );
}

function NexusFooter() {
  return (
    <div className="text-center flex-shrink-0 py-1">
      <a href="https://nexus.pandoras.finance" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
        Powered by <span className="text-lime-400/70 font-semibold ml-0.5">Pandoras Nexus</span>
        <ArrowUpRight className="w-2.5 h-2.5" />
        {/* Marcador de build: sirve para saber qué versión está desplegada. */}
        <span className="ml-1 text-zinc-700 font-mono">
          · {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local'}
        </span>
      </a>
    </div>
  );
}

// ── Main Checkout ─────────────────────────────────────────────────────────────
/**
 * Contenedor estable. Debe vivir FUERA del componente: definirlo dentro crea un
 * tipo nuevo en cada render, React desmonta/remonta todo el subárbol (incluido el
 * modal de thirdweb) y el botón parece "parpadear" sin poder usarse.
 */
function Screen({ children }: { children: React.ReactNode }) {
  // Sin maxHeight fijo: en móvil el contenido crece y la página hace scroll.
  return <div className="w-full max-w-md flex flex-col">{children}</div>;
}

export function PrivatePaymentCheckout({ id }: { id: string }) {
  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [completedTx, setCompletedTx] = useState<string | null>(null);
  const [txStep, setTxStep]           = useState<TxStep>("idle");
  const [showBuy, setShowBuy]         = useState(false);
  // Monto a pagar CONGELADO: las tasas se actualizan cada segundo y el importe de
  // una transferencia no puede cambiar mientras el pagador firma. Congelarlo
  // también evita que el botón de pago (y su modal) se reinicien cada tick.
  const [frozenUsdcAmount, setFrozenUsdcAmount] = useState<number | null>(null);
  const rates = useRealtimeRates();

  // Callback estable (evita re-renders por el tick de tasas en vivo).
  const handleFunded = useCallback(() => setShowBuy(false), []);

  useEffect(() => {
    if (frozenUsdcAmount !== null || !data) return;
    const amount = Number((data as { amount?: unknown }).amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const currency = String((data as { currency?: unknown }).currency ?? 'USD') as StoredCurrency;
    setFrozenUsdcAmount(computeAll(amount, currency, rates).usdc);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sólo se fija una vez
  }, [data, rates, frozenUsdcAmount]);

  useEffect(() => {
    fetch(`/api/private/pay/${id}`)
      .then(async (res) => { const j = await res.json(); if (!res.ok) throw new Error(j.error || "Error"); setData(j.data); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  /**
   * Monto CONGELADO para el checkout con tarjeta.
   *
   * El widget de thirdweb re-cotiza cada vez que cambian sus props. `rates` se
   * actualiza por WebSocket (~1/s), así que pasarle un monto recalculado en vivo
   * provocaba un ciclo de recotización infinito (el "blink" que se quedaba
   * cargando). Se fija la conversión con las tasas del primer render y se
   * memoiza para que la identidad del objeto sea estable.
   */
  const cardLink = useMemo(() => {
    if (!data) return null;
    const amount = Number(data.amount);
    const currency = (data.currency || "USD") as StoredCurrency;
    const frozenUsdc = Number(computeAll(amount, currency, rates).usdc.toFixed(2));
    return {
      id: String(data.id),
      title: String(data.title ?? "Cobro"),
      description: (data.description as string | null) ?? null,
      amount: String(frozenUsdc),
      currency: "USD",
      destinationWallet: String(data.destinationWallet),
      networkChainId: Number(data.networkChainId ?? 8453),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- congelamos las tasas a propósito (ver comentario)
  }, [data]);

  /**
   * Contrato del token memoizado y declarado ANTES de los returns tempranos:
   * los hooks no pueden ejecutarse condicionalmente (React #310).
   */
  const payChainId = Number((data as { networkChainId?: number } | null)?.networkChainId ?? 8453);
  const payTokenAddress =
    String((data as { settlementToken?: string | null } | null)?.settlementToken ?? '') ||
    (payChainId === 11155111 ? USDC_SEPOLIA : USDC_BASE);
  const payTokenContract = useMemo(
    () => (data ? getContract({ client, chain: defineChain(payChainId), address: payTokenAddress }) : null),
    [data, payChainId, payTokenAddress]
  );

  if (loading) return (
    <Screen>
      <NexusHeader />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Zap className="w-6 h-6 text-lime-400" />
          </div>
          <Loader2 className="w-4 h-4 text-lime-400 animate-spin absolute -bottom-1 -right-1" />
        </div>
        <p className="text-sm font-medium text-zinc-300">Cargando terminal de pago...</p>
      </div>
      <NexusFooter />
    </Screen>
  );

  if (error || !data) return (
    <Screen>
      <NexusHeader />
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full rounded-2xl bg-zinc-950/90 border border-red-900/40 p-6 text-center">
          <XCircle className="w-9 h-9 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-white mb-1">Enlace no disponible</h2>
          <p className="text-sm text-zinc-500">{error || "El link ha expirado o no existe."}</p>
        </div>
      </div>
      <NexusFooter />
    </Screen>
  );

  const storedAmount   = Number(data.amount);
  const storedCurrency = (data.currency || "USD") as StoredCurrency;
  const all            = computeAll(storedAmount, storedCurrency, rates);
  const usdcAmount     = all.usdc;
  // Importe que se cobra/firma: fijo desde el primer cálculo (no baila con las tasas).
  const payableUsdc    = frozenUsdcAmount ?? usdcAmount;

  const chainId       = data.networkChainId || 8453;
  const isBase        = chainId === 8453;
  const tokenAddress  = data.settlementToken || (chainId === 11155111 ? USDC_SEPOLIA : USDC_BASE);
  // Ya memoizado arriba (antes de los returns) para no romper el orden de hooks.
  const tokenContract = payTokenContract;
  const explorerBase  = isBase ? "https://basescan.org" : "https://sepolia.etherscan.io";


  if (completedTx) return (
    <Screen>
      <NexusHeader />
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-zinc-950/90 border border-lime-500/20 backdrop-blur-xl overflow-hidden mt-2">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-lime-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-1">¡Pago Liquidado!</h2>
          <p className="text-zinc-400 text-sm mb-1">On-chain en Base Network.</p>
          <p className="text-zinc-500 text-xs mb-4">{fmt(usdcAmount, 4)} USDC transferidos</p>
          <div className="w-full p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-400 break-all text-left mb-3">
            <span className="text-zinc-600 block mb-1 text-[10px] uppercase tracking-wider">TX Hash</span>
            {completedTx}
          </div>
          <a href={`${explorerBase}/tx/${completedTx}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-lime-400 hover:text-lime-300 font-medium">
            Ver en {isBase ? "BaseScan" : "Etherscan"} <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <SecurityBand />
      </div>
      <NexusFooter />
    </Screen>
  );

  return (
    <Screen>
      <NexusHeader />
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-xl shadow-2xl shadow-black/60 mt-2 overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-zinc-800/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <Zap className="w-2 h-2" /> Terminal Privada
            </span>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <ShieldCheck className="w-3 h-3 text-lime-400" /> Liquidación Segura
            </div>
          </div>
          <h1 className="text-lg font-bold tracking-tight text-white leading-tight">{data.title}</h1>
          {data.description && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{data.description}</p>}
        </div>

        {/* Amount + 4 live cross-rates */}
        <div className="px-4 pt-3 flex-shrink-0">
          <AmountPanel amount={storedAmount} currency={storedCurrency} rates={rates} />
        </div>

        {/* Network + wallet */}
        <div className="px-4 pt-2 flex-shrink-0">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/30">
            <span className="text-[11px] text-zinc-500">Red</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[11px] font-mono text-zinc-300">{isBase ? "Base Mainnet" : "Sepolia"} ({chainId})</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-[11px] text-zinc-500">Destino</span>
            <div className="flex items-center gap-1.5">
              <WalletIdenticon address={data.destinationWallet} />
              <span className="text-[11px] font-mono text-zinc-300">
                {data.destinationWallet.slice(0, 6)}···{data.destinationWallet.slice(-4)}
              </span>
              <CopyBtn value={data.destinationWallet} />
            </div>
          </div>
        </div>

        {/* Alternativa que NO depende de thirdweb: enviar USDC directo a la
            dirección del cobrador. Si el widget falla, el cobro se puede completar
            igual desde cualquier wallet y el settle lo verifica on-chain. */}
        <div className="px-4 flex-shrink-0">
          <details className="group rounded-xl border border-zinc-800/70 bg-zinc-900/30">
            <summary className="cursor-pointer list-none flex items-center justify-between px-3 py-2 text-[10px] text-zinc-400 hover:text-lime-400 transition-colors">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3 h-3" /> Pagar desde otra wallet (QR)
              </span>
              <span className="text-[9px] text-zinc-600 group-open:hidden">abrir</span>
              <span className="hidden text-[9px] text-zinc-600 group-open:inline">cerrar</span>
            </summary>
            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-center justify-center rounded-lg bg-white p-2">
                <QRCode
                  value={`ethereum:${data.destinationWallet}@${chainId}/transfer?address=${tokenAddress}&uint256=${BigInt(Math.round(payableUsdc * 1e6)).toString()}`}
                  size={128}
                  bgColor="#ffffff"
                  fgColor="#070707"
                  level="M"
                />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5">
                <span className="truncate font-mono text-[10px] text-zinc-300">{data.destinationWallet}</span>
                <CopyBtn value={data.destinationWallet} />
              </div>
              <p className="text-[10px] leading-relaxed text-zinc-500">
                Envía exactamente <span className="font-mono text-zinc-300">{fmt(payableUsdc, 4)} USDC</span> en{' '}
                {isBase ? 'Base' : 'Sepolia'} a esa dirección. Cualquier wallet sirve (MetaMask, Rabby, exchange).
              </p>
            </div>
          </details>
        </div>

        {txStep !== "idle" && <div className="px-4 flex-shrink-0"><TxProgress step={txStep} /></div>}

        <div className="flex-1 min-h-0" />

        <PaySection data={data} tokenContract={tokenContract} txStep={txStep} setTxStep={setTxStep} setCompletedTx={setCompletedTx} usdcAmount={payableUsdc} />

        {/* Mismo modelo que admin: se conecta (wallet o login social) y paga.
            Si no tiene USDC, puede comprarlo con tarjeta en SU wallet y volver. */}
        <div className="px-4 pb-2 flex-shrink-0">
          {showBuy ? (
            <BuyUsdcPanel amount={cardLink ? cardLink.amount : String(payableUsdc)} onFunded={handleFunded} />
          ) : (
            <button
              type="button"
              onClick={() => setShowBuy(true)}
              className="flex w-full items-center justify-center gap-1.5 py-1.5 text-[10px] text-zinc-500 hover:text-lime-400 transition-colors"
            >
              <CreditCard className="w-3 h-3" /> ¿No tienes USDC? Cómpralo con tarjeta
            </button>
          )}
        </div>

        <SecurityBand />

        <p className="text-[9px] text-zinc-700 text-center px-6 pb-3 leading-relaxed flex-shrink-0">
          USDC/USDT en tiempo real via Binance · MXN actualización diaria · Liquidación en USDC sobre Base.
        </p>
      </div>
      <NexusFooter />
    </Screen>
  );
}

"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/thirdweb-client";
import { defineChain, getContract } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { TransactionButton, ConnectButton, useActiveAccount } from "thirdweb/react";
import {
  Loader2, CheckCircle2, ShieldCheck, ArrowUpRight,
  Zap, Link2, XCircle, Copy, Check, RefreshCw, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

const USDC_BASE    = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

type StoredCurrency = "USD" | "MXN" | "USDT";
type TxStep = "idle" | "signing" | "pending" | "confirmed";

interface Rates {
  usdToMxn: number;   // 1 USD → MXN
  mxnToUsd: number;   // 1 MXN → USD
  usdtToUsd: number;  // 1 USDT → USD (≈1.000)
  usdToUsdt: number;  // 1 USD → USDT
  fallback: boolean;
  usdtFallback: boolean;
}

const DEFAULT_RATES: Rates = {
  usdToMxn: 17.5, mxnToUsd: 1 / 17.5,
  usdtToUsd: 1.0, usdToUsdt: 1.0,
  fallback: true, usdtFallback: true,
};

// ── Formatting ────────────────────────────────────────────────────────────────
function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtMXN(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const CUR_SYMBOL: Record<StoredCurrency, string> = { USD: "$", MXN: "$", USDT: "₮" };
const CUR_FLAG:   Record<StoredCurrency, string> = { USD: "🇺🇸", MXN: "🇲🇽", USDT: "🟡" };

// ── Convert any amount to USD ─────────────────────────────────────────────────
function toUSD(amount: number, currency: StoredCurrency, rates: Rates): number {
  if (currency === "MXN")  return amount * rates.mxnToUsd;
  if (currency === "USDT") return amount * rates.usdtToUsd;
  return amount; // USD
}

// ── All 3 cross-rates from a stored amount ────────────────────────────────────
function computeAll(amount: number, currency: StoredCurrency, rates: Rates) {
  const usd  = toUSD(amount, currency, rates);
  const usdc = usd; // 1 USDC ≈ 1 USD (settlement)
  return {
    usd,
    mxn:  usd * rates.usdToMxn,
    usdt: usd * rates.usdToUsdt,
    usdc,
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

// ── Main amount + 3 reference rates ──────────────────────────────────────────
function AmountPanel({
  amount, currency, rates, ratesLoading,
}: {
  amount: number; currency: StoredCurrency; rates: Rates; ratesLoading: boolean;
}) {
  const all = computeAll(amount, currency, rates);

  // Display in stored currency
  const mainFmt = currency === "MXN"
    ? `${CUR_SYMBOL[currency]}${fmtMXN(amount)}`
    : `${CUR_SYMBOL[currency]}${fmt(amount)}`;

  // Reference rows — the other two + USDC settlement
  const refs: { label: string; value: string; badge?: boolean; fallback?: boolean }[] = [];

  if (currency !== "USD")  refs.push({ label: `${CUR_FLAG.USD} USD`,  value: `$${fmt(all.usd)}`, fallback: rates.fallback });
  if (currency !== "MXN")  refs.push({ label: `${CUR_FLAG.MXN} MXN`,  value: `$${fmtMXN(all.mxn)}`, fallback: rates.fallback });
  if (currency !== "USDT") refs.push({ label: `${CUR_FLAG.USDT} USDT`, value: `₮${fmt(all.usdt, 4)}`, fallback: rates.usdtFallback });

  return (
    <div className="flex flex-col p-3.5 rounded-xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/40 border border-zinc-800/60 gap-2.5">
      {/* Primary amount */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Monto a Pagar</span>
        {ratesLoading && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin flex-shrink-0" />}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black tracking-tight text-white font-mono leading-none">{mainFmt}</span>
        <span className="text-sm font-bold text-zinc-400">{currency}</span>
      </div>

      {/* Separator */}
      <div className="border-t border-zinc-800/50" />

      {/* Reference rates */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1 text-[10px] text-zinc-600 mb-0.5">
          <TrendingUp className="w-2.5 h-2.5" /> Tipos de cambio en tiempo real
        </div>
        {refs.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">{r.label}</span>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-mono text-zinc-300 font-semibold">{r.value}</span>
              {r.fallback && <span title="Tasa estimada"><RefreshCw className="w-2 h-2 text-zinc-700" /></span>}
            </div>
          </div>
        ))}
        {/* Always show USDC settlement */}
        <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 mt-1">
          <span className="text-[11px] text-zinc-600">Liquidación USDC</span>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-lime-400/10 border border-lime-400/20">
            <span className="text-xs font-black text-lime-400 font-mono">{fmt(all.usdc)}</span>
            <span className="text-[9px] font-bold text-lime-400/70">USDC</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pay Section ───────────────────────────────────────────────────────────────
function PaySection({ data, tokenContract, txStep, setTxStep, setCompletedTx, usdcAmount }: {
  data: any; tokenContract: any; txStep: TxStep;
  setTxStep: (s: TxStep) => void; setCompletedTx: (tx: string) => void; usdcAmount: number;
}) {
  const account = useActiveAccount();
  return (
    <div className="px-4 pt-3 pb-1 flex-shrink-0">
      {!account ? (
        <>
          <p className="text-[11px] text-zinc-500 text-center mb-2">Conecta tu wallet para pagar</p>
          <ConnectButton client={client} theme="dark"
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
          Pagar {fmt(usdcAmount)} USDC
        </TransactionButton>
      )}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────
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
      </a>
    </div>
  );
}

// ── Main Checkout ─────────────────────────────────────────────────────────────
export function PrivatePaymentCheckout({ id }: { id: string }) {
  const [data, setData]               = useState<any>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [completedTx, setCompletedTx] = useState<string | null>(null);
  const [txStep, setTxStep]           = useState<TxStep>("idle");
  const [showQR, setShowQR]           = useState(false);
  const [rates, setRates]             = useState<Rates>(DEFAULT_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);
  const payUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    fetch(`/api/private/pay/${id}`)
      .then(async (res) => { const j = await res.json(); if (!res.ok) throw new Error(j.error || "Error"); setData(j.data); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch("/api/public/rates")
      .then(async (res) => { const j = await res.json(); setRates({ ...DEFAULT_RATES, ...j }); })
      .catch(() => {/* keep defaults */})
      .finally(() => setRatesLoading(false));
  }, []);

  // ── Full-screen container shared across all states ────────────────────────
  const Screen = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full max-w-md flex flex-col" style={{ maxHeight: "calc(100dvh - 1.5rem)" }}>
      {children}
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
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

  // ── Error ─────────────────────────────────────────────────────────────────
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

  const chainId       = data.networkChainId || 8453;
  const isBase        = chainId === 8453;
  const tokenAddress  = data.settlementToken || (chainId === 11155111 ? USDC_SEPOLIA : USDC_BASE);
  const tokenContract = getContract({ client, chain: defineChain(chainId), address: tokenAddress });
  const explorerBase  = isBase ? "https://basescan.org" : "https://sepolia.etherscan.io";

  // ── Success ───────────────────────────────────────────────────────────────
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
          <p className="text-zinc-500 text-xs mb-4">{fmt(usdcAmount)} USDC transferidos</p>
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

  // ── Main checkout ─────────────────────────────────────────────────────────
  return (
    <Screen>
      <NexusHeader />

      <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-xl shadow-2xl shadow-black/60 mt-2 overflow-hidden">

        {/* Header: badge + title */}
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
          {data.description && (
            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{data.description}</p>
          )}
        </div>

        {/* Amount panel + 3 cross-rates */}
        <div className="px-4 pt-3 flex-shrink-0">
          <AmountPanel
            amount={storedAmount}
            currency={storedCurrency}
            rates={rates}
            ratesLoading={ratesLoading}
          />
        </div>

        {/* Network + wallet details */}
        <div className="px-4 pt-2 flex-shrink-0">
          <div className="flex items-center justify-between py-2 border-b border-zinc-800/30">
            <span className="text-[11px] text-zinc-500">Red</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-[11px] font-mono text-zinc-300">
                {isBase ? "Base Mainnet" : "Sepolia"} ({chainId})
              </span>
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

        {/* QR (collapsible) */}
        <div className="px-4 flex-shrink-0">
          <button onClick={() => setShowQR((v) => !v)} style={{ touchAction: "manipulation" }}
            className="flex items-center gap-1 text-[10px] text-zinc-700 hover:text-lime-400 transition-colors py-1">
            <Link2 className="w-2.5 h-2.5" />
            {showQR ? "Ocultar" : "QR"} enlace de pago
          </button>
          {showQR && (
            <div className="mb-2 p-3 rounded-xl bg-white flex items-center justify-center">
              <QRCode value={payUrl || `https://nexus.pandoras.finance/pay/private/${id}`} size={120} bgColor="#ffffff" fgColor="#070707" level="M" />
            </div>
          )}
        </div>

        {/* TX Progress */}
        {txStep !== "idle" && (
          <div className="px-4 flex-shrink-0"><TxProgress step={txStep} /></div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-h-0" />

        {/* Pay button */}
        <PaySection
          data={data} tokenContract={tokenContract}
          txStep={txStep} setTxStep={setTxStep}
          setCompletedTx={setCompletedTx} usdcAmount={usdcAmount}
        />

        <SecurityBand />

        <p className="text-[9px] text-zinc-700 text-center px-6 pb-3 leading-relaxed flex-shrink-0">
          Tipos de cambio reales · El pago final se liquida en USDC sobre Base Network.
        </p>
      </div>

      <NexusFooter />
    </Screen>
  );
}

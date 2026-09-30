"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/thirdweb-client";
import { defineChain, getContract } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { TransactionButton, ConnectButton, useActiveAccount } from "thirdweb/react";
import {
  Loader2, CheckCircle2, ShieldCheck, ArrowUpRight,
  Zap, Link2, XCircle, Copy, Check, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "react-qr-code";

const USDC_BASE    = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
type DisplayCurrency = "USD" | "MXN";
type TxStep = "idle" | "signing" | "pending" | "confirmed";

function fmtUSD(n: number) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtMXN(n: number) { return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

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
        {TX_STEPS.map((s, i) => (
          <span key={s.key} className={`w-1.5 h-1.5 rounded-full ${i <= idx ? "bg-lime-400" : "bg-zinc-700"}`} />
        ))}
      </div>
    </div>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="ml-1 text-zinc-600 hover:text-lime-400 transition-colors flex-shrink-0" title="Copiar"
      style={{ touchAction: "manipulation" }}>
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Currency toggle ───────────────────────────────────────────────────────────
function CurrencyToggle({ value, onChange }: { value: DisplayCurrency; onChange: (c: DisplayCurrency) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5 gap-0.5">
      {(["USD", "MXN"] as DisplayCurrency[]).map((cur) => (
        <button key={cur} onClick={() => onChange(cur)} style={{ touchAction: "manipulation" }}
          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all duration-150 ${value === cur ? "bg-lime-400 text-black" : "text-zinc-500 hover:text-zinc-300"}`}>
          {cur === "USD" ? "🇺🇸 USD" : "🇲🇽 MXN"}
        </button>
      ))}
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
          Pagar {fmtUSD(usdcAmount)} USDC
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
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("USD");
  const [usdToMxn, setUsdToMxn]       = useState(17.5);
  const [rateLoading, setRateLoading] = useState(true);
  const [rateFallback, setRateFallback] = useState(false);
  const payUrl = typeof window !== "undefined" ? window.location.href : "";

  useEffect(() => {
    fetch(`/api/private/pay/${id}`)
      .then(async (res) => { const j = await res.json(); if (!res.ok) throw new Error(j.error || "Error"); setData(j.data); if (j.data?.currency === "MXN") setDisplayCurrency("MXN"); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetch("/api/public/rates")
      .then(async (res) => { const j = await res.json(); if (j.usdToMxn) { setUsdToMxn(j.usdToMxn); setRateFallback(j.fallback === true); } })
      .catch(() => setRateFallback(true))
      .finally(() => setRateLoading(false));
  }, []);

  // ── Full-screen wrapper used by all states
  const Screen = ({ children, borderColor = "border-zinc-800/80" }: { children: React.ReactNode; borderColor?: string }) => (
    <div className="w-full max-w-md flex flex-col" style={{ maxHeight: "calc(100dvh - 1.5rem)" }}>
      {children}
    </div>
  );

  // ── Loading ──────────────────────────────────────────────────────────────
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
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-300">Cargando terminal de pago...</p>
          <p className="text-xs text-zinc-600 mt-0.5">Pandoras Nexus · Private Rail</p>
        </div>
      </div>
      <NexusFooter />
    </Screen>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) return (
    <Screen>
      <NexusHeader />
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
        <div className="w-full rounded-2xl bg-zinc-950/90 border border-red-900/40 backdrop-blur-xl p-6 text-center">
          <XCircle className="w-9 h-9 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-white mb-1">Enlace no disponible</h2>
          <p className="text-sm text-zinc-500">{error || "El link ha expirado o no existe."}</p>
        </div>
      </div>
      <NexusFooter />
    </Screen>
  );

  const storedAmount   = Number(data.amount);
  const storedCurrency = (data.currency || "USD") as string;
  const usdcAmount     = storedCurrency === "MXN" ? storedAmount / usdToMxn : storedAmount;
  const chainId        = data.networkChainId || 8453;
  const isBase         = chainId === 8453;
  const tokenAddress   = data.settlementToken || (chainId === 11155111 ? USDC_SEPOLIA : USDC_BASE);
  const tokenContract  = getContract({ client, chain: defineChain(chainId), address: tokenAddress });
  const explorerBase   = isBase ? "https://basescan.org" : "https://sepolia.etherscan.io";

  // Compute display amount
  let displayFmt: string;
  let displaySymbol: string;
  if (storedCurrency === "MXN") {
    displayFmt    = displayCurrency === "MXN" ? `$${fmtMXN(storedAmount)}` : `$${fmtUSD(storedAmount / usdToMxn)}`;
    displaySymbol = displayCurrency;
  } else {
    displayFmt    = displayCurrency === "USD" ? `$${fmtUSD(storedAmount)}` : `$${fmtMXN(storedAmount * usdToMxn)}`;
    displaySymbol = displayCurrency;
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (completedTx) return (
    <Screen>
      <NexusHeader />
      <div className="flex-1 min-h-0 mx-0 flex flex-col rounded-2xl bg-zinc-950/90 border border-lime-500/20 backdrop-blur-xl overflow-hidden mt-2">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-lime-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-1">¡Pago Liquidado!</h2>
          <p className="text-zinc-400 text-sm mb-1">On-chain en Base Network.</p>
          <p className="text-zinc-500 text-xs mb-4">{fmtUSD(usdcAmount)} USDC transferidos</p>
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
      {/* Branding header */}
      <NexusHeader />

      {/* Card — fills remaining height, no internal scroll */}
      <div className="flex-1 min-h-0 flex flex-col rounded-2xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-xl shadow-2xl shadow-black/60 mt-2 overflow-hidden">

        {/* ── Top section: badge + title ── */}
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
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed line-clamp-1">{data.description}</p>
          )}
        </div>

        {/* ── Currency toggle + Amount ── */}
        <div className="px-4 pt-3 flex-shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-medium">Ver precio en</span>
            <CurrencyToggle value={displayCurrency} onChange={setDisplayCurrency} />
          </div>

          {/* Amount box */}
          <div className="flex flex-col p-3.5 rounded-xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/40 border border-zinc-800/60 gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black tracking-tight text-white font-mono">{displayFmt}</span>
              <span className="text-sm font-bold text-zinc-400">{displaySymbol}</span>
              {rateLoading && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin ml-auto" />}
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/40">
              <span className="text-[10px] text-zinc-600">Se liquidará como</span>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-lime-400/10 border border-lime-400/20">
                <span className="text-xs font-black text-lime-400 font-mono">{fmtUSD(usdcAmount)}</span>
                <span className="text-[9px] font-bold text-lime-400/70">USDC</span>
              </div>
              {rateFallback && (
                <span className="text-[9px] text-zinc-700 ml-auto flex items-center gap-0.5">
                  <RefreshCw className="w-2 h-2" /> est.
                </span>
              )}
            </div>
          </div>

          <p className="text-[9px] text-zinc-700 text-right leading-none">
            1 USD = {fmtMXN(usdToMxn)} MXN{rateFallback ? " (est.)" : ""}
          </p>
        </div>

        {/* ── Details: network + wallet ── */}
        <div className="px-4 pt-1 flex-shrink-0">
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

        {/* ── QR (collapsible) ── */}
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

        {/* ── TX Progress ── */}
        {txStep !== "idle" && (
          <div className="px-4 flex-shrink-0">
            <TxProgress step={txStep} />
          </div>
        )}

        {/* ── Spacer pushes button to bottom ── */}
        <div className="flex-1 min-h-0" />

        {/* ── Pay Button ── */}
        <PaySection
          data={data} tokenContract={tokenContract}
          txStep={txStep} setTxStep={setTxStep}
          setCompletedTx={setCompletedTx} usdcAmount={usdcAmount}
        />

        {/* ── Security Band ── */}
        <SecurityBand />

        {/* ── Fine print ── */}
        <p className="text-[9px] text-zinc-700 text-center px-6 pb-3 leading-relaxed flex-shrink-0">
          Conversión de referencia. El pago final se procesa en USDC sobre Base Network.
        </p>
      </div>

      {/* Footer — always visible below card */}
      <NexusFooter />
    </Screen>
  );
}

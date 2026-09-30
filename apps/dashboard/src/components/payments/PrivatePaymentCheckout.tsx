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

// ── Formatting helpers ────────────────────────────────────────────────────────
function fmtUSD(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtMXN(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Wallet identicon ──────────────────────────────────────────────────────────
function WalletIdenticon({ address }: { address: string }) {
  const hash = address.toLowerCase().split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) & 0xffffff, 0);
  const hue = hash % 360;
  const colors = Array.from({ length: 9 }, (_, i) => `hsl(${(hash * (i + 1) * 137) % 360}, 65%, ${40 + (i % 3) * 15}%)`);
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2" style={{ borderColor: `hsl(${hue},70%,50%)` }} title={address}>
      <svg width="36" height="36" viewBox="0 0 3 3">
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
    <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs">
      <Loader2 className={`w-3.5 h-3.5 text-lime-400 ${step !== "confirmed" ? "animate-spin" : ""}`} />
      <span className="text-zinc-300 font-medium">{TX_STEPS[idx]?.label}</span>
      <div className="ml-auto flex gap-1">
        {TX_STEPS.map((s, i) => (
          <span key={s.key} className={`w-1.5 h-1.5 rounded-full transition-all ${i <= idx ? "bg-lime-400" : "bg-zinc-700"}`} />
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
      className="ml-1.5 text-zinc-600 hover:text-lime-400 transition-colors" title="Copiar">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ── Currency selector ─────────────────────────────────────────────────────────
function CurrencyToggle({ value, onChange }: { value: DisplayCurrency; onChange: (c: DisplayCurrency) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/60 p-0.5 gap-0.5">
      {(["USD", "MXN"] as DisplayCurrency[]).map((cur) => (
        <button
          key={cur}
          onClick={() => onChange(cur)}
          style={{ touchAction: "manipulation" }}
          className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150 ${
            value === cur
              ? "bg-lime-400 text-black shadow-sm"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {cur === "USD" ? "🇺🇸 USD" : "🇲🇽 MXN"}
        </button>
      ))}
    </div>
  );
}

// ── Amount display with conversion ────────────────────────────────────────────
function AmountDisplay({
  amount, storedCurrency, displayCurrency, usdcAmount, rateLoading, rateFallback, usdToMxn,
}: {
  amount: number;
  storedCurrency: string;
  displayCurrency: DisplayCurrency;
  usdcAmount: number;
  rateLoading: boolean;
  rateFallback: boolean;
  usdToMxn: number;
}) {
  // Compute display amount in the selected currency
  let displayAmount: number;
  let displaySymbol: string;
  let displayFmt: string;

  if (storedCurrency === "MXN") {
    if (displayCurrency === "MXN") {
      displayAmount = amount;
      displayFmt = `$${fmtMXN(amount)}`;
      displaySymbol = "MXN";
    } else {
      displayAmount = amount / usdToMxn;
      displayFmt = `$${fmtUSD(displayAmount)}`;
      displaySymbol = "USD";
    }
  } else {
    // stored in USD
    if (displayCurrency === "USD") {
      displayAmount = amount;
      displayFmt = `$${fmtUSD(amount)}`;
      displaySymbol = "USD";
    } else {
      displayAmount = amount * usdToMxn;
      displayFmt = `$${fmtMXN(displayAmount)}`;
      displaySymbol = "MXN";
    }
  }

  return (
    <div className="relative flex flex-col p-5 rounded-xl bg-gradient-to-br from-zinc-900/80 to-zinc-950/40 border border-zinc-800/60 gap-3">
      {/* Main amount */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Monto a Pagar</span>
        {rateLoading && <Loader2 className="w-3 h-3 text-zinc-600 animate-spin" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black tracking-tight text-white font-mono">{displayFmt}</span>
        <span className="text-sm font-bold text-zinc-400">{displaySymbol}</span>
      </div>

      {/* USDC settlement line */}
      <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/40">
        <span className="text-[11px] text-zinc-600">Se liquidará como</span>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-lime-400/10 border border-lime-400/20">
          <span className="text-xs font-black text-lime-400 font-mono">{fmtUSD(usdcAmount)}</span>
          <span className="text-[10px] font-bold text-lime-400/70">USDC</span>
        </div>
        {rateFallback && (
          <span className="text-[10px] text-zinc-600 ml-auto flex items-center gap-0.5">
            <RefreshCw className="w-2.5 h-2.5" /> tasa estimada
          </span>
        )}
      </div>
    </div>
  );
}

// ── Pay Section ───────────────────────────────────────────────────────────────
function PaySection({ data, tokenContract, txStep, setTxStep, setCompletedTx, usdcAmount }: {
  data: any;
  tokenContract: any;
  txStep: TxStep;
  setTxStep: (s: TxStep) => void;
  setCompletedTx: (tx: string) => void;
  usdcAmount: number;
}) {
  const account = useActiveAccount();

  return (
    <div className="px-6 pt-4 pb-2">
      {!account ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 text-center mb-3">Conecta tu wallet para pagar</p>
          <ConnectButton
            client={client}
            theme="dark"
            connectButton={{
              label: "Conectar Wallet para Pagar",
              style: {
                width: "100%",
                background: "#a3e635",
                color: "#000",
                fontWeight: "900",
                fontSize: "1rem",
                padding: "1rem",
                borderRadius: "0.75rem",
                border: "none",
                touchAction: "manipulation",
              },
            }}
          />
        </div>
      ) : (
        <TransactionButton
          transaction={() => {
            setTxStep("signing");
            return transfer({
              contract: tokenContract,
              to: data.destinationWallet,
              amount: usdcAmount,
            });
          }}
          onTransactionSent={() => setTxStep("pending")}
          onTransactionConfirmed={(tx) => {
            setTxStep("confirmed");
            toast.success("¡Pago liquidado!");
            setTimeout(() => setCompletedTx(tx.transactionHash), 500);
          }}
          onError={(err) => {
            setTxStep("idle");
            console.error("[PrivateCheckout]", err);
            toast.error("Error al procesar la transacción");
          }}
          theme="dark"
          style={{ touchAction: "manipulation", width: "100%" }}
          className="!bg-lime-400 hover:!bg-lime-300 active:!bg-lime-500 !text-black !font-black !py-4 !rounded-xl !transition-all !duration-150 !text-base !tracking-tight !shadow-lg !shadow-lime-500/20"
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
    <div className="text-center mb-1">
      <div className="inline-flex flex-col items-center gap-0.5">
        <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-lime-400">PANDORAS</span>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-lime-400/60 to-transparent" />
        <span className="text-2xl font-black tracking-widest text-white">NEXUS</span>
      </div>
    </div>
  );
}

function SecurityBand() {
  return (
    <div className="mx-6 my-4 flex rounded-xl bg-zinc-900/50 border border-zinc-800/40 overflow-hidden divide-x divide-zinc-800/40">
      {[{ icon: ShieldCheck, label: "Non-custodial" }, { icon: Zap, label: "Base Network" }, { icon: Link2, label: "USDC Nativo" }]
        .map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1.5 px-3 py-2.5 text-[11px] text-zinc-500 font-medium flex-1 justify-center">
            <Icon className="w-3 h-3 text-lime-400/70" />{label}
          </div>
        ))}
    </div>
  );
}

function NexusFooter() {
  return (
    <div className="mt-4 text-center">
      <a href="https://nexus.pandoras.finance" target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors">
        Powered by <span className="text-lime-400/70 font-semibold ml-1">Pandoras Nexus</span>
        <ArrowUpRight className="w-2.5 h-2.5 ml-0.5" />
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

  // FX state
  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>("USD");
  const [usdToMxn, setUsdToMxn]               = useState(17.5);
  const [rateLoading, setRateLoading]         = useState(true);
  const [rateFallback, setRateFallback]       = useState(false);

  const payUrl = typeof window !== "undefined" ? window.location.href : "";

  // Fetch payment link data
  useEffect(() => {
    fetch(`/api/private/pay/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "No se pudo cargar");
        const linkData = json.data;
        setData(linkData);
        // Auto-set display currency to stored currency
        if (linkData.currency === "MXN") setDisplayCurrency("MXN");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Fetch exchange rate
  useEffect(() => {
    fetch("/api/public/rates")
      .then(async (res) => {
        const json = await res.json();
        if (json.usdToMxn) {
          setUsdToMxn(json.usdToMxn);
          setRateFallback(json.fallback === true);
        }
      })
      .catch(() => setRateFallback(true))
      .finally(() => setRateLoading(false));
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Zap className="w-7 h-7 text-lime-400" />
        </div>
        <Loader2 className="w-5 h-5 text-lime-400 animate-spin absolute -bottom-1 -right-1" />
      </div>
      <p className="text-sm font-medium text-zinc-300">Cargando terminal de pago seguro...</p>
      <p className="text-xs text-zinc-600 mt-1">Pandoras Nexus · Private Rail</p>
    </div>
  );

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) return (
    <div className="w-full max-w-md">
      <NexusHeader />
      <div className="mt-4 rounded-2xl bg-zinc-950/90 border border-red-900/40 backdrop-blur-xl p-8 text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-white mb-1">Enlace no disponible</h2>
        <p className="text-sm text-zinc-500">{error || "El link de pago ha expirado o no existe."}</p>
      </div>
      <NexusFooter />
    </div>
  );

  // Compute USDC amount (always in USD)
  const storedAmount   = Number(data.amount);
  const storedCurrency = (data.currency || "USD") as string;
  const usdcAmount     = storedCurrency === "MXN" ? storedAmount / usdToMxn : storedAmount;

  const chainId       = data.networkChainId || 8453;
  const isBase        = chainId === 8453;
  const tokenAddress  = data.settlementToken || (chainId === 11155111 ? USDC_SEPOLIA : USDC_BASE);
  const tokenContract = getContract({ client, chain: defineChain(chainId), address: tokenAddress });
  const explorerBase  = isBase ? "https://basescan.org" : "https://sepolia.etherscan.io";

  // ── Success ──────────────────────────────────────────────────────────────
  if (completedTx) return (
    <div className="w-full max-w-md">
      <NexusHeader />
      <div className="mt-4 rounded-2xl bg-zinc-950/90 border border-lime-500/20 backdrop-blur-xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-lime-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-1">¡Pago Liquidado!</h2>
          <p className="text-zinc-400 text-sm mb-2">La transacción se liquidó on-chain en Base Network.</p>
          <p className="text-zinc-500 text-xs mb-6">
            {fmtUSD(usdcAmount)} USDC transferidos a destino
          </p>
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-400 break-all text-left mb-4">
            <span className="text-zinc-600 block mb-1 text-[10px] uppercase tracking-wider">TX Hash</span>
            {completedTx}
          </div>
          <a href={`${explorerBase}/tx/${completedTx}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-lime-400 hover:text-lime-300 font-medium transition-colors">
            Ver en {isBase ? "BaseScan" : "Etherscan"} <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <SecurityBand />
      </div>
      <NexusFooter />
    </div>
  );

  // ── Main checkout ─────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-md">
      <NexusHeader />

      <div className="mt-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 backdrop-blur-xl shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-zinc-800/60">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <Zap className="w-2.5 h-2.5" /> Terminal Privada
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-lime-400" /> Liquidación Segura
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">{data.title}</h1>
          {data.description && <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">{data.description}</p>}
        </div>

        {/* Currency selector + Amount */}
        <div className="px-6 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-600 uppercase tracking-wider font-medium">Ver precio en</span>
            <CurrencyToggle value={displayCurrency} onChange={setDisplayCurrency} />
          </div>

          <AmountDisplay
            amount={storedAmount}
            storedCurrency={storedCurrency}
            displayCurrency={displayCurrency}
            usdcAmount={usdcAmount}
            rateLoading={rateLoading}
            rateFallback={rateFallback}
            usdToMxn={usdToMxn}
          />

          {/* Rate info */}
          <p className="text-[10px] text-zinc-700 text-right">
            1 USD = {fmtMXN(usdToMxn)} MXN{rateFallback ? " (estimado)" : ""}
          </p>
        </div>

        {/* Details */}
        <div className="px-6 pt-3">
          <div className="flex items-center justify-between py-2.5 border-b border-zinc-800/40">
            <span className="text-xs text-zinc-500">Red de Liquidación</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-mono text-zinc-300 font-medium">
                {isBase ? "Base Mainnet" : "Sepolia Testnet"} ({chainId})
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-xs text-zinc-500">Wallet Destino</span>
            <div className="flex items-center gap-2">
              <WalletIdenticon address={data.destinationWallet} />
              <span className="text-xs font-mono text-zinc-300">
                {data.destinationWallet.slice(0, 6)}···{data.destinationWallet.slice(-4)}
              </span>
              <CopyBtn value={data.destinationWallet} />
            </div>
          </div>
        </div>

        {/* QR */}
        <div className="px-6 pt-1 pb-2">
          <button onClick={() => setShowQR((v) => !v)} style={{ touchAction: "manipulation" }}
            className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-lime-400 transition-colors py-1">
            <Link2 className="w-3 h-3" />
            {showQR ? "Ocultar" : "Mostrar"} QR de este enlace
          </button>
          {showQR && (
            <div className="mt-3 mb-1 p-4 rounded-xl bg-white flex items-center justify-center">
              <QRCode value={payUrl || `https://nexus.pandoras.finance/pay/private/${id}`} size={160} bgColor="#ffffff" fgColor="#070707" level="M" />
            </div>
          )}
        </div>

        {/* TX Progress */}
        {txStep !== "idle" && <div className="px-6 pt-1"><TxProgress step={txStep} /></div>}

        {/* Pay button */}
        <PaySection
          data={data}
          tokenContract={tokenContract}
          txStep={txStep}
          setTxStep={setTxStep}
          setCompletedTx={setCompletedTx}
          usdcAmount={usdcAmount}
        />

        <SecurityBand />

        <p className="text-[11px] text-zinc-600 text-center px-8 pb-5 leading-relaxed">
          Conversión de referencia. El pago final se procesa en USDC sobre Base Network.
        </p>
      </div>

      <NexusFooter />
    </div>
  );
}

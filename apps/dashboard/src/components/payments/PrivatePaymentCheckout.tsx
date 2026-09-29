"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/thirdweb-client";
import { defineChain, getContract } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { TransactionButton } from "thirdweb/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, CheckCircle2, ShieldCheck, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

// Native USDC Token addresses
const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

export function PrivatePaymentCheckout({ id }: { id: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedTx, setCompletedTx] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/private/pay/${id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "No se pudo cargar el link");
        setData(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-lime-400 mb-3" />
        <p className="text-sm">Cargando terminal de pago seguro...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-red-400 text-lg">Enlace no disponible</CardTitle>
          <CardDescription className="text-zinc-500">
            {error || "El link de pago ha expirado o no existe."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chainId = data.networkChainId || 8453;
  const targetChain = defineChain(chainId);
  const tokenAddress = data.settlementToken || (chainId === 11155111 ? USDC_SEPOLIA : USDC_BASE);

  const tokenContract = getContract({
    client,
    chain: targetChain,
    address: tokenAddress,
  });

  if (completedTx) {
    return (
      <Card className="w-full max-w-md bg-zinc-950 border-lime-500/30 text-white shadow-2xl p-6 text-center">
        <CardContent className="pt-6 space-y-4">
          <CheckCircle2 className="w-16 h-16 text-lime-400 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold tracking-tight text-white">¡Pago Confirmado!</h2>
          <p className="text-zinc-400 text-sm">
            La transacción se ha liquidado on-chain con éxito.
          </p>
          <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 break-all">
            Tx: {completedTx}
          </div>
          <a
            href={chainId === 8453 ? `https://basescan.org/tx/${completedTx}` : `https://sepolia.etherscan.io/tx/${completedTx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-lime-400 hover:underline pt-2"
          >
            Ver recibo en explorador <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md bg-zinc-950/90 border-zinc-800 backdrop-blur-xl text-white shadow-2xl">
      <CardHeader className="border-b border-zinc-800/80 pb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
            Terminal Directa
          </span>
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
            Liquidación Segura
          </div>
        </div>
        <CardTitle className="text-2xl font-semibold tracking-tight">{data.title}</CardTitle>
        {data.description && (
          <CardDescription className="text-zinc-400 text-sm mt-1">{data.description}</CardDescription>
        )}
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div className="flex items-baseline justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
          <span className="text-xs text-zinc-400 font-medium">Monto a Liquidar</span>
          <div className="text-right">
            <span className="text-3xl font-bold tracking-tight text-white font-mono">
              ${Number(data.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-zinc-400 ml-1.5 font-semibold">USDC</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Red de Liquidación</span>
            <span className="font-mono text-zinc-300">Base Mainnet (8453)</span>
          </div>
          <div className="flex justify-between text-xs text-zinc-400">
            <span>Wallet Destino</span>
            <span className="font-mono text-zinc-400">
              {data.destinationWallet.slice(0, 6)}...{data.destinationWallet.slice(-4)}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <TransactionButton
            transaction={() => {
              return transfer({
                contract: tokenContract,
                to: data.destinationWallet,
                amount: data.amount,
              });
            }}
            onTransactionConfirmed={(tx) => {
              toast.success("Pago liquidado con éxito");
              setCompletedTx(tx.transactionHash);
            }}
            onError={(err) => {
              console.error("[PrivateCheckout Error]", err);
              toast.error("Error al procesar la transacción");
            }}
            theme="dark"
            className="w-full !bg-lime-400 hover:!bg-lime-300 !text-black !font-bold !py-3.5 !rounded-xl !transition-all !duration-200 !shadow-lg !shadow-lime-500/10 cursor-pointer"
          >
            Pagar ${data.amount} USDC
          </TransactionButton>
        </div>

        <p className="text-[11px] text-zinc-500 text-center leading-relaxed">
          Pago descentralizado directo sin intermediarios. La transacción se verifica y liquida en el ledger de Base.
        </p>
      </CardContent>
    </Card>
  );
}

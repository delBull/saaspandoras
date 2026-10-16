import React, { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Key, 
  FileCheck2, 
  Clock, 
  Wallet, 
  ExternalLink, 
  ArrowUpRight,
  AlertCircle 
} from "lucide-react";
import Link from "next/link";

interface UserSpaceVaultProps {
  walletAddress?: string | null;
  onConnectWallet?: () => void;
}

interface UserPurchase {
  id: number;
  projectTitle: string;
  amount: string;
  currency: string;
  status: string;
  createdAt: string;
  agreementHash?: string | null;
  legalPortalUrl?: string | null;
}

export function UserSpaceVault({ walletAddress, onConnectWallet }: UserSpaceVaultProps) {
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress) {
      setPurchases([]);
      return;
    }

    async function fetchUserSpace() {
      setIsLoading(true);
      setError(null);
      try {
        // Query existing live endpoint for external purchases with authorized wallet
        const res = await fetch(`/api/v1/external/users/${walletAddress}/purchases`);
        if (!res.ok) {
          throw new Error("No fue posible cargar sus adquisiciones");
        }
        const data = await res.json();
        if (data.success && Array.isArray(data.purchases)) {
          setPurchases(data.purchases);
        } else if (Array.isArray(data)) {
          setPurchases(data);
        }
      } catch (err: any) {
        console.warn("[UserSpaceVault] Querying purchases degraded:", err.message);
        setError("Error de sincronización con la bóveda. Intente reconectar.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserSpace();
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800/80 backdrop-blur-md">
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-4">
          <Wallet className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100 mb-1">
          Bóveda Soberana No Conectada
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">
          Conecta tu wallet para inspeccionar tus títulos notarizados en IPFS, membresías activas, pases de acceso y órdenes de adquisición registradas.
        </p>
        <button
          onClick={onConnectWallet}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-950"
        >
          Conectar Bóveda
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Wallet Sovereign Card */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-900/60 flex items-center justify-center text-emerald-400">
            <Key className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
              Bóveda Soberana Activa
            </span>
            <span className="text-sm font-mono font-medium text-zinc-200">
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-900/60">
            <ShieldCheck className="w-4 h-4" />
            Identidad Conectada
          </span>
        </div>
      </div>

      {/* Acquisitions & Legal Deeds Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-zinc-200 flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-400" />
          Títulos y Adquisiciones Notarizadas
        </h3>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-500 animate-pulse border border-zinc-800 rounded-xl">
            Sincronizando registros con la red...
          </div>
        ) : error ? (
          <div className="p-5 rounded-xl bg-red-950/30 border border-red-900/40 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-10 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-center flex flex-col items-center">
            <Clock className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-300 font-medium">Aún no posees títulos o pases registrados</p>
            <p className="text-xs text-zinc-500 max-w-sm mt-1">
              Cuando participes en una oferta de RWA o adquieras una licencia de un partner, tus acuerdos notarizados y recibos aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-100">{p.projectTitle || "Adquisición Registrada"}</h4>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
                    {p.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-zinc-500">Monto:</span>
                  <span className="font-semibold text-zinc-200">{p.amount} {p.currency}</span>
                </div>

                {p.agreementHash && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-900">
                    <span className="text-zinc-500 font-mono text-[11px]">Hash Acuerdo:</span>
                    <span className="font-mono text-emerald-400 text-[11px]">
                      {p.agreementHash.slice(0, 10)}...
                    </span>
                  </div>
                )}

                {p.legalPortalUrl && (
                  <a
                    href={p.legalPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium bg-zinc-900 text-zinc-300 hover:text-emerald-400 hover:bg-zinc-800 transition-colors border border-zinc-800"
                  >
                    <span>Ver Título / Documento</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

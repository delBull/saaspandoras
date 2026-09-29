"use client";

import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Copy, Check, ExternalLink, ShieldCheck, Wallet, Plus, ArrowUpRight } from "lucide-react";

export function PrivateTerminalClient({ inModal = false }: { inModal?: boolean }) {
  const account = useActiveAccount();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [destinationWallet, setDestinationWallet] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");

  useEffect(() => {
    if (account?.address && !destinationWallet) {
      setDestinationWallet(account.address);
    }
  }, [account?.address, destinationWallet]);

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("pandoras_nexus_token") || localStorage.getItem("nexus_token");
      if (storedToken) headers["x-nexus-token"] = storedToken;
    }
    if (account?.address) {
      headers["x-wallet-address"] = account.address;
    }
    return headers;
  };

  const loadLinks = async () => {
    try {
      const res = await fetch("/api/private/payments", {
        headers: getAuthHeaders(),
      });
      if (res.status === 403 || res.status === 401) {
        toast.error("Acceso restringido a Super Administrador");
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setLinks(json.links || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [account?.address]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !destinationWallet) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/private/payments", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          amount: parseFloat(amount),
          destinationWallet: destinationWallet.trim(),
          networkChainId: 8453, // Base
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al crear link");

      toast.success("Terminal de cobro generada exitosamente");
      setTitle("");
      setDescription("");
      setAmount("");
      loadLinks();
    } catch (err: any) {
      toast.error(err.message || "Error al crear link");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/pay/private/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={inModal ? "space-y-6" : "max-w-6xl mx-auto p-6 md:p-10 space-y-10"}>
      {/* Top Banner (Full Page Mode) */}
      {!inModal && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse shadow-sm shadow-lime-400" />
              <span className="text-[11px] font-mono tracking-widest uppercase text-lime-400 font-semibold">
                Sovereign Rail • Super Admin Only
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Private Pay & Finance Terminal</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Cobros directos on-chain liquidables a tu wallet personal. Aislado de tenants, CRM y contabilidad de Pandoras.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#0D0D12] border border-white/[0.08] p-3.5 rounded-2xl shadow-inner">
            <Wallet className="w-5 h-5 text-lime-400" />
            <div className="text-xs">
              <div className="text-zinc-400 font-medium">Wallet Administrador Activa</div>
              <div className="font-mono text-zinc-200">
                {account?.address ? `${account.address.slice(0, 8)}...${account.address.slice(-6)}` : "No conectada"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form: Generator */}
        <div className="lg:col-span-5">
          <div className="bg-[#0c0c12]/90 border border-white/[0.08] hover:border-lime-500/30 rounded-2xl text-white shadow-xl p-5 md:p-6 transition-all">
            <div className="mb-5 pb-3 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold flex items-center gap-2 text-white">
                  <Plus className="w-4 h-4 text-lime-400" /> Generar Cobro Directo
                </div>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Crea un link único sin custodia ni intermediación.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-lime-500/10 text-lime-400 border border-lime-500/20">
                Non-Custodial
              </span>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">Concepto / Título *</Label>
                <Input
                  placeholder="Ej. Asesoría Arquitectura / Retainer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-[#12121A] border-white/10 text-white rounded-xl focus:border-lime-500/50 text-xs py-2"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">Monto en USD (USDC) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="bg-[#12121A] border-white/10 text-white pl-7 font-mono text-base rounded-xl focus:border-lime-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">Wallet Receptora (Base Mainnet) *</Label>
                <Input
                  placeholder="0x..."
                  value={destinationWallet}
                  onChange={(e) => setDestinationWallet(e.target.value)}
                  required
                  className="bg-[#12121A] border-white/10 text-white font-mono text-xs rounded-xl focus:border-lime-500/50"
                />
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Fondos depositados directamente aquí vía contrato/transferencia segura.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">Descripción / Términos (Opcional)</Label>
                <Textarea
                  placeholder="Detalles adicionales para el comprobante o cliente..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="bg-[#12121A] border-white/10 text-white text-xs rounded-xl focus:border-lime-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-300 font-medium">Días de Expiración</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                  className="bg-[#12121A] border-white/10 text-white text-xs rounded-xl focus:border-lime-500/50"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-lime-400 hover:bg-lime-300 text-black font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-lime-500/20 transition-all cursor-pointer mt-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Generar Enlace de Cobro"}
              </Button>
            </form>
          </div>
        </div>

        {/* List of Active Links */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>Terminales Activas</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                {links.length}
              </span>
            </h2>
            <button
              onClick={loadLinks}
              disabled={loading}
              className="text-[11px] text-zinc-400 hover:text-white transition-colors"
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-zinc-500 text-xs">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-lime-400" /> Cargando enlaces...
            </div>
          ) : links.length === 0 ? (
            <div className="p-8 border border-dashed border-white/[0.08] rounded-2xl text-center text-zinc-500 text-xs">
              No tienes enlaces de cobro privados activos aún. Genera uno con el formulario.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto custom-scrollbar pr-1">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="p-4 rounded-2xl bg-[#0c0c12]/80 border border-white/[0.06] hover:border-lime-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate text-xs">{link.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-lime-400 font-mono">
                        Base
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      Destino: {link.destinationWallet.slice(0, 6)}...{link.destinationWallet.slice(-4)}
                    </div>
                    {link.description && (
                      <p className="text-[11px] text-zinc-500 line-clamp-1">{link.description}</p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                    <span className="text-base font-bold text-white font-mono">
                      ${Number(link.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(link.id)}
                        className="h-7 px-2.5 bg-[#14141c] border-white/10 hover:border-lime-500/40 text-[11px] text-zinc-200 rounded-lg cursor-pointer"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3.5 h-3.5 text-lime-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span className="ml-1">Copiar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/pay/private/${link.id}`, "_blank")}
                        className="h-7 px-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

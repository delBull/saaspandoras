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

export function PrivateTerminalClient() {
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

  const loadLinks = async () => {
    try {
      const res = await fetch("/api/private/payments");
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
  }, []);

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
        headers: { "Content-Type": "application/json" },
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
    <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-lime-400 font-semibold">
              Sovereign Rail • Super Admin Only
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Private Pay & Finance Terminal</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Cobros directos on-chain liquidables a tu wallet personal. Aislado de tenants, CRM y contabilidad de Pandoras.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
          <Wallet className="w-5 h-5 text-lime-400" />
          <div className="text-xs">
            <div className="text-zinc-500 font-medium">Wallet Administrador Activa</div>
            <div className="font-mono text-zinc-300">
              {account?.address ? `${account.address.slice(0, 8)}...${account.address.slice(-6)}` : "No conectada"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form: Generator */}
        <div className="lg:col-span-5">
          <Card className="bg-zinc-950 border-zinc-800 text-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Plus className="w-4 h-4 text-lime-400" /> Generar Nuevo Cobro Directo
              </CardTitle>
              <CardDescription className="text-zinc-400 text-xs">
                Crea un link único de settlement para tus servicios externos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Concepto / Título *</Label>
                  <Input
                    placeholder="Ej. Asesoría Arquitectura / Retainer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Monto en USD (USDC) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-800 text-white font-mono text-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Wallet Receptora (Base Mainnet) *</Label>
                  <Input
                    placeholder="0x..."
                    value={destinationWallet}
                    onChange={(e) => setDestinationWallet(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Los fondos se depositan directamente aquí sin pasar por custodia de la plataforma.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Descripción / Términos (Opcional)</Label>
                  <Textarea
                    placeholder="Detalles adicionales para el cliente..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="bg-zinc-900 border-zinc-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-300">Días de Expiración</Label>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-white text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-lime-400 hover:bg-lime-300 text-black font-semibold mt-4"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Generar Enlace de Cobro"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List of Active Links */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Enlaces Privados Generados</h2>
            <span className="text-xs text-zinc-500 font-mono">{links.length} registros</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando enlaces...
            </div>
          ) : links.length === 0 ? (
            <div className="p-8 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500 text-sm">
              No tienes enlaces de cobro privados activos aún.
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate text-sm">{link.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-lime-400 font-mono">
                        Base
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      Destino: {link.destinationWallet.slice(0, 6)}...{link.destinationWallet.slice(-4)}
                    </div>
                    {link.description && (
                      <p className="text-xs text-zinc-500 line-clamp-1">{link.description}</p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                    <span className="text-lg font-bold text-white font-mono">
                      ${Number(link.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(link.id)}
                        className="h-8 px-2.5 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-300"
                      >
                        {copiedId === link.id ? (
                          <Check className="w-3.5 h-3.5 text-lime-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="ml-1.5">Copiar</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/pay/private/${link.id}`, "_blank")}
                        className="h-8 px-2 text-zinc-400 hover:text-white"
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

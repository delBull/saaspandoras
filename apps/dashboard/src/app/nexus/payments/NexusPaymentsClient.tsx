'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CreditCard, Copy, Check, ExternalLink, Loader2, ShieldAlert, RefreshCw, Wallet } from 'lucide-react';

interface PaymentLinkRow {
  id: string;
  title: string;
  amount: string;
  currency: string;
  status: string;
  networkChainId: number;
  destinationWallet: string | null;
  createdAt: string;
  expiresAt: string | null;
  metadata: unknown;
}

interface PayoutOption {
  address: string;
  label: string;
  isDefault: boolean;
  source: 'default' | 'allowlist';
}

interface TreasuryState {
  configured: boolean;
  wallet?: string;
  source?: string;
  reason?: string;
}

interface LinksResponse {
  ok: boolean;
  treasury: TreasuryState;
  payoutOptions?: PayoutOption[];
  links?: PaymentLinkRow[];
  error?: string;
}

interface CreateResponse {
  ok: boolean;
  link?: {
    id: string;
    amount: string;
    currency: string;
    url: string;
    expiresAt: string;
    destinationWallet: string;
    destinationSource: 'default' | 'allowlist' | 'custom';
  };
  error?: string;
  code?: string;
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const CUSTOM = '__custom__';

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function statusLabel(link: PaymentLinkRow): { label: string; className: string } {
  if (link.status === 'completed') {
    return { label: 'PAGADO', className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' };
  }
  if (link.status !== 'active') {
    return { label: link.status.toUpperCase(), className: 'bg-zinc-500/10 border-zinc-500/30 text-zinc-300' };
  }
  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
    return { label: 'EXPIRADO', className: 'bg-amber-500/10 border-amber-500/30 text-amber-300' };
  }
  return { label: 'ACTIVO', className: 'bg-blue-500/10 border-blue-500/30 text-blue-300' };
}

export function NexusPaymentsClient({ operator }: { operator: { email: string | null; wallet: string | null } }) {
  const [loading, setLoading] = useState(true);
  const [treasury, setTreasury] = useState<TreasuryState>({ configured: false });
  const [payoutOptions, setPayoutOptions] = useState<PayoutOption[]>([]);
  const [links, setLinks] = useState<PaymentLinkRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Wallet destino: 'default' = la del entorno; una address = allowlist; CUSTOM = escrita a mano.
  const [destination, setDestination] = useState<string | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [customConfirmed, setCustomConfirmed] = useState(false);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreateResponse['link'] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/nexus/payments/links', { cache: 'no-store' });
      const data = (await res.json().catch(() => null)) as LinksResponse | null;
      if (!res.ok || !data?.ok) {
        setLoadError(data?.error ?? `No se pudieron cargar los cobros (HTTP ${res.status}).`);
        return;
      }
      setTreasury(data.treasury);
      setPayoutOptions(data.payoutOptions ?? []);
      setLinks(data.links ?? []);
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : 'Error de conexión al cargar los cobros.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Selección inicial: la wallet del entorno si existe; si no, obliga a elegir una.
  useEffect(() => {
    if (destination !== null || loading) return;
    setDestination(treasury.configured ? 'default' : CUSTOM);
  }, [destination, loading, treasury.configured]);

  const customTrimmed = customAddress.trim();
  const customValid =
    ADDRESS_REGEX.test(customTrimmed) && customTrimmed.toLowerCase() !== ZERO_ADDRESS;
  const isCustom = destination === CUSTOM;

  const destinationReady =
    isCustom ? customValid && customConfirmed : destination !== null && destination !== '';

  const allowlistOptions = payoutOptions.filter((option) => !option.isDefault);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!destinationReady) return;

    setCreating(true);
    setCreateError(null);
    setCreated(null);
    try {
      // Si es la del entorno se omite: el servidor la resuelve y sigue siendo la autoridad del default.
      const destinationWallet =
        destination === 'default' ? undefined : isCustom ? customTrimmed : destination ?? undefined;

      const res = await fetch('/api/nexus/payments/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, title, description, destinationWallet }),
      });
      const data = (await res.json().catch(() => null)) as CreateResponse | null;
      if (!res.ok || !data?.ok || !data.link) {
        setCreateError(data?.error ?? `No se pudo crear el cobro (HTTP ${res.status}).`);
        return;
      }
      setCreated(data.link);
      setAmount('');
      setTitle('');
      setDescription('');
      if (isCustom) {
        setCustomAddress('');
        setCustomConfirmed(false);
        setDestination(treasury.configured ? 'default' : CUSTOM);
      }
      await load();
    } catch (error: unknown) {
      setCreateError(error instanceof Error ? error.message : 'Error de conexión al crear el cobro.');
    } finally {
      setCreating(false);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
          <CreditCard className="h-3 w-3" /> Pay &amp; Finance · Piloto
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Cobros con tarjeta</h1>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
          Genera un link de cobro. El pagador paga con tarjeta en un checkout de thirdweb y la liquidación cae en
          la wallet que elijas. El pago se marca como pagado <strong>sólo</strong> si la verificación on-chain del
          settle lo confirma.
        </p>
        <p className="text-[11px] text-zinc-500 font-mono">
          Operador: {operator.email ?? '—'} · {operator.wallet ?? 'sin wallet'}
        </p>
      </header>

      {!loading && !treasury.configured && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">No hay wallet predeterminada en el entorno</p>
            <p className="mt-1 text-amber-200/80">{treasury.reason}</p>
            <p className="mt-1 text-amber-200/60">
              Puedes cobrar igual eligiendo <strong>“Otra wallet…”</strong> y escribiendo la dirección. Para tener
              una predeterminada, define <code className="font-mono">PANDORAS_TREASURY_WALLET</code> (o{' '}
              <code className="font-mono">PANDORAS_ADMIN_WALLET</code>).
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-white/10 bg-[#0e0e16] p-6">
        <h2 className="text-sm font-semibold text-zinc-200">Nuevo cobro</h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-1 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Monto (USD)</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="1500.00"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none"
              required
            />
          </label>
          <label className="sm:col-span-2 space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500">Concepto</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Servicio de consultoría — Octubre"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none"
              required
            />
          </label>
        </div>

        {/* Wallet destino */}
        <div className="space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <label className="block space-y-1">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-zinc-500">
              <Wallet className="h-3 w-3" /> Wallet destino (recibe el pago)
            </span>
            <select
              value={destination ?? ''}
              onChange={(e) => {
                setDestination(e.target.value);
                setCustomConfirmed(false);
                setCreateError(null);
                setCreated(null);
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white focus:border-emerald-500/50 focus:outline-none"
            >
              {treasury.configured && treasury.wallet && (
                <option value="default">
                  Predeterminada (entorno) · {shortAddress(treasury.wallet)}
                </option>
              )}
              {allowlistOptions.map((option) => (
                <option key={option.address} value={option.address}>
                  {option.label} · {shortAddress(option.address)}
                </option>
              ))}
              <option value={CUSTOM}>Otra wallet…</option>
            </select>
          </label>

          {isCustom && (
            <div className="space-y-2">
              <input
                value={customAddress}
                onChange={(e) => {
                  setCustomAddress(e.target.value);
                  setCustomConfirmed(false);
                  setCreateError(null);
                  setCreated(null);
                }}
                placeholder="0x…"
                spellCheck={false}
                className={`w-full rounded-lg border bg-zinc-900 px-3 py-2 font-mono text-[11px] text-white placeholder-zinc-600 focus:outline-none ${
                  customTrimmed && !customValid
                    ? 'border-rose-500/60 focus:border-rose-500'
                    : 'border-zinc-700 focus:border-emerald-500/50'
                }`}
              />
              {customTrimmed && !customValid && (
                <p className="text-[10px] text-rose-400">
                  Dirección inválida: debe ser <code className="font-mono">0x</code> + 40 caracteres hexadecimales.
                </p>
              )}
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] leading-relaxed text-amber-200">
                Un pago enviado a una wallet equivocada <strong>no se puede recuperar</strong>. El link queda fijado
                a esta dirección al crearse.
              </div>
              <label className="flex items-start gap-2 text-[10px] text-zinc-300">
                <input
                  type="checkbox"
                  checked={customConfirmed}
                  onChange={(e) => setCustomConfirmed(e.target.checked)}
                  className="mt-0.5 h-3 w-3 accent-emerald-500"
                />
                Confirmo que la dirección es correcta y que quiero que este cobro liquide ahí.
              </label>
            </div>
          )}

          {destination === 'default' && treasury.wallet && (
            <p className="text-[10px] text-zinc-500">
              Liquidando a <span className="font-mono text-emerald-300">{treasury.wallet}</span>
              {treasury.source ? <span className="text-zinc-600"> · origen: {treasury.source}</span> : null}
            </p>
          )}
        </div>

        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Descripción (opcional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={creating || !destinationReady}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-40"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
            {creating ? 'Generando…' : 'Generar link de cobro'}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Recargar
          </button>
          <span className="text-[10px] text-zinc-500">Vigencia: 7 días · Moneda: USD (liquidación en USDC)</span>
        </div>

        {createError && <p className="text-[11px] text-rose-400">{createError}</p>}

        {created && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-[11px] text-emerald-200">
            <p className="font-semibold">Link creado</p>
            <p className="mt-1 text-emerald-200/80">
              Liquida a <span className="font-mono text-emerald-100">{created.destinationWallet}</span>
              {created.destinationSource === 'custom' ? ' (wallet personalizada)' : ''}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-[11px] text-emerald-100">
                {`${typeof window !== 'undefined' ? window.location.origin : ''}${created.url}`}
              </code>
              <button
                type="button"
                onClick={() =>
                  void copy(`${typeof window !== 'undefined' ? window.location.origin : ''}${created.url}`)
                }
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 px-2 py-1 text-[10px] hover:bg-emerald-500/10"
              >
                {copied === `${typeof window !== 'undefined' ? window.location.origin : ''}${created.url}` ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                Copiar
              </button>
              <a
                href={created.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 px-2 py-1 text-[10px] hover:bg-emerald-500/10"
              >
                <ExternalLink className="h-3 w-3" /> Abrir
              </a>
            </div>
          </div>
        )}
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-200">Cobros recientes</h2>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando…
          </div>
        )}

        {loadError && <p className="text-[11px] text-rose-400">{loadError}</p>}

        {!loading && !loadError && links.length === 0 && (
          <p className="text-xs text-zinc-500">Todavía no hay cobros generados.</p>
        )}

        {links.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-white/[0.03] text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Concepto</th>
                  <th className="px-3 py-2 font-medium">Monto</th>
                  <th className="px-3 py-2 font-medium">Wallet destino</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                  <th className="px-3 py-2 font-medium">Creado</th>
                  <th className="px-3 py-2 font-medium">Link</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => {
                  const status = statusLabel(link);
                  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/pay/card/${link.id}`;
                  return (
                    <tr key={link.id} className="border-t border-white/5">
                      <td className="max-w-[220px] truncate px-3 py-2 text-zinc-200">{link.title}</td>
                      <td className="px-3 py-2 font-mono text-zinc-300">
                        {Number(link.amount).toFixed(2)} {link.currency}
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-400" title={link.destinationWallet ?? undefined}>
                        {link.destinationWallet ? shortAddress(link.destinationWallet) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono ${status.className}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-zinc-500">
                        {new Date(link.createdAt).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void copy(url)}
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-zinc-300 hover:bg-white/5"
                        >
                          {copied === url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied === url ? 'Copiado' : 'Copiar'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-[10px] leading-relaxed text-zinc-600">
        Nota: el cobro con tarjeta lo procesa la rampa de thirdweb. La transacción on-chain que liquida a la wallet
        elegida se verifica en el servidor antes de marcar el link como pagado; si el procesador reporta el pago
        pero la verificación aún no es posible, el cobro queda pendiente de revisión (nunca se marca pagado sin
        evidencia).
      </p>
    </div>
  );
}

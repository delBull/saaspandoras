import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { db } from '@saasfly/db-core';
import { privatePaymentLinks } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';
import { ShieldCheck, Lock } from 'lucide-react';
import { CardCheckoutClient } from './CardCheckoutClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Pago seguro · Pandora's Finance",
  description: 'Completa tu pago con tarjeta de forma segura.',
  // Un link de cobro no debe indexarse ni compartirse por buscadores.
  robots: { index: false, follow: false, nocache: true },
};

/**
 * /pay/card/[id] — Checkout público de un link de cobro (tarjeta vía thirdweb).
 *
 * Sólo expone datos del cobro (concepto, monto). Nunca metadata interna
 * (creado por, email del operador) ni la wallet destino del cobrador.
 */
export default async function CardPayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [link] = await db
    .select({
      id: privatePaymentLinks.id,
      title: privatePaymentLinks.title,
      description: privatePaymentLinks.description,
      amount: privatePaymentLinks.amount,
      currency: privatePaymentLinks.currency,
      destinationWallet: privatePaymentLinks.destinationWallet,
      networkChainId: privatePaymentLinks.networkChainId,
      status: privatePaymentLinks.status,
      expiresAt: privatePaymentLinks.expiresAt,
    })
    .from(privatePaymentLinks)
    .where(eq(privatePaymentLinks.id, id))
    .limit(1);

  if (!link || link.status !== 'active') {
    notFound();
  }

  const expired = Boolean(link.expiresAt && new Date(link.expiresAt).getTime() < Date.now());

  return (
    <div className="relative flex min-h-screen flex-col bg-[#08080A] text-white">
      {/* Fondo sutil, mismo lenguaje visual que el resto del producto */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <header className="relative z-10 border-b border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo_finance.png"
              width={148}
              height={37}
              alt="Pandora's Finance"
              priority
              style={{ width: 'auto', height: '22px' }}
            />
            <span className="hidden h-4 w-px bg-white/10 sm:block" />
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-zinc-500 sm:block">
              Pagos institucionales
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
            <ShieldCheck className="h-3 w-3" /> Pago seguro
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-4">
          {expired ? (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
              <h1 className="text-lg font-semibold text-amber-200">Este link de cobro expiró</h1>
              <p className="mt-2 text-xs leading-relaxed text-amber-200/70">
                Solicita un link nuevo a tu contacto en Pandora&apos;s. No se realizó ningún cargo.
              </p>
            </div>
          ) : (
            <>
              <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e16] shadow-2xl">
                <div className="border-b border-white/[0.06] px-5 py-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Cobro</p>
                  <h1 className="mt-1 text-sm font-semibold leading-snug text-white">{link.title}</h1>
                  {link.description ? (
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{link.description}</p>
                  ) : null}
                </div>

                <div className="flex items-end justify-between px-5 py-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Total a pagar</p>
                    <p className="mt-1 font-mono text-3xl font-semibold text-white">
                      ${Number(link.amount).toFixed(2)}
                      <span className="ml-2 text-xs font-normal text-zinc-500">{link.currency}</span>
                    </p>
                  </div>
                  <span className="pb-1 text-[10px] text-zinc-600">
                    Liquidación en USDC · Base
                  </span>
                </div>

                <div className="border-t border-white/[0.06] px-5 py-5">
                  <CardCheckoutClient
                    link={{
                      id: link.id,
                      title: link.title,
                      description: link.description,
                      amount: link.amount,
                      currency: link.currency,
                      destinationWallet: link.destinationWallet,
                      networkChainId: link.networkChainId,
                    }}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <p className="flex items-start gap-2 text-[10px] leading-relaxed text-zinc-500">
                  <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    El pago con tarjeta lo procesa la rampa de thirdweb. Pandora&apos;s no almacena los datos de tu
                    tarjeta. El cobro se confirma únicamente cuando la liquidación se verifica en la red.
                  </span>
                </p>
              </section>

              <p className="text-center text-[10px] leading-relaxed text-zinc-600">
                ¿Dudas con este cobro? Contacta a tu contraparte en Pandora&apos;s Finance.
              </p>
            </>
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-1 px-5 py-4 text-[10px] text-zinc-600 sm:flex-row">
          <span>© {new Date().getFullYear()} Pandora&apos;s Finance</span>
          <a href="https://pandoras.finance" className="hover:text-zinc-400" rel="noreferrer">
            pandoras.finance
          </a>
        </div>
      </footer>
    </div>
  );
}

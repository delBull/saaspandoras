import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Compass } from 'lucide-react';

export interface TenantPassportShellProps {
  organization: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
  };
  children: React.ReactNode;
}

export function TenantPassportShell({ organization, children }: TenantPassportShellProps) {
  const display = organization.name || organization.slug.toUpperCase();

  return (
    <div className="min-h-screen bg-[#06060a] text-zinc-100 antialiased">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(120,85,255,0.16),transparent_70%)]"
      />
      <header className="sticky top-0 z-20 border-b border-white/5 bg-[#06060a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            {organization.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organization.logoUrl}
                alt={display}
                className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/10 ring-1 ring-white/10">
                <Compass className="h-4.5 w-4.5 text-violet-300" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold leading-tight">{display}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Tenant Passport</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300 sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sesión verificada
            </span>
            <Link
              href="/portal/login"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/10"
            >
              Cuenta
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>

      <footer className="border-t border-white/5 py-6">
        <p className="mx-auto max-w-6xl px-5 text-center text-xs text-zinc-600 sm:px-8">
          Pandora&apos;s Sovereign Portal · Tu activos son solo lectura aquí · Acceso aislado a {display}
        </p>
      </footer>
    </div>
  );
}
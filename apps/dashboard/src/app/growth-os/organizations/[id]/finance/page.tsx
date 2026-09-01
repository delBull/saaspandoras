import { DashApi } from '@/lib/dash-api';
import type { TenantWalletConfigDTO } from '@/lib/dash-contracts/growth';
import { 
  Wallet, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  ArrowUpRight, 
  CheckCircle2, 
  Sliders,
  Layers,
  Key
} from 'lucide-react';
import Link from 'next/link';

export default async function SovereignFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams.id;
  const orgId = `org_${slugId}`;

  let walletConfig: TenantWalletConfigDTO = {
    organizationId: orgId,
    walletMode: 'NOT_CONFIGURED',
    primaryAddress: '',
    smartAccountAddress: '',
    dailySpendLimitUsdc: 0,
    spentTodayUsdc: 0,
    withdrawalAllowlist: [],
    requiresMultiSig: false,
    signerCount: 0,
    balanceUsdc: 0,
    balanceNative: 0,
    nativeSymbol: 'ETH',
    isIsolated: true,
    lastAuditedAt: undefined,
  };

  try {
    const fetched = await DashApi.growth.getWalletConfig(orgId);
    if (fetched) walletConfig = fetched;
  } catch (err) {
    console.warn('[SovereignFinancePage] Live wallet config fetch notice:', err);
  }

  const hasTreasuryAddress = Boolean(walletConfig.primaryAddress);
  const hasSafe = Boolean(walletConfig.smartAccountAddress);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* ── HEADER BANNER (Hermes Obsidian Glass) ── */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] via-white/[0.01] to-transparent p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                SOVEREIGN TREASURY & PAY
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                 {hasSafe ? 'Safe Proxy Configurado' : hasTreasuryAddress ? 'Wallet de Tesorería' : 'Pendiente de Configuración'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Wallet className="w-8 h-8 text-emerald-400" />
              Pay & Soberanía Financiera
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Custodia multi-firma, reglas de dispersión autónoma protegida y segregación de fondos para {slugId.toUpperCase()}.
            </p>
          </div>

          <Link
            href={`/portal/${slugId}/ecosystem`}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 px-4 py-2.5 rounded-xl text-xs font-bold transition-all backdrop-blur-sm self-start md:self-auto"
          >
            <Layers className="w-4 h-4 text-zinc-400" />
            Sovereign Mesh Hub
          </Link>
        </div>
      </div>

      {/* ── BALANCES & SECURITY CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Treasury Status Card */}
        <div className="rounded-3xl p-6 bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">Tesorería Multi-Sig</span>
              <span className={`text-[10px] font-mono px-3 py-1 rounded-full font-bold flex items-center gap-1.5 border ${
                 hasTreasuryAddress
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                 {hasTreasuryAddress ? 'Tesorería Identificada' : 'No Configurado'}
              </span>
            </div>

            <div>
              <p className="text-xs font-mono text-zinc-400">Balance Total Disponible</p>
              <p className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight mt-1">
                ${walletConfig.balanceUsdc.toLocaleString()} <span className="text-sm font-normal text-zinc-500">USDC</span>
              </p>
              <p className="text-xs font-mono text-zinc-500 mt-1">
                + {walletConfig.balanceNative} {walletConfig.nativeSymbol} reservado para gas en red
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span className="text-zinc-500">Smart Account (Safe):</span>
              <span className="text-zinc-300">
                {walletConfig.smartAccountAddress 
                  ? `${walletConfig.smartAccountAddress.slice(0, 8)}...${walletConfig.smartAccountAddress.slice(-6)}` 
                  : 'Sin Safe asignado'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-zinc-500">Owner Wallet:</span>
              <span className="text-zinc-300">
                {walletConfig.primaryAddress 
                  ? `${walletConfig.primaryAddress.slice(0, 8)}...${walletConfig.primaryAddress.slice(-6)}` 
                  : 'Sin Wallet asignada'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Controls Card */}
        <div className="rounded-3xl p-6 bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2 text-sm font-mono uppercase tracking-wider">
              <Lock className="w-4 h-4 text-amber-400" />
              Guardias de Seguridad Financiera
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Fail-Closed
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-200 font-mono">
                <span>Límite de Gasto Autónomo</span>
                <span className="text-emerald-400">${walletConfig.dailySpendLimitUsdc} USDC / día</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Todo movimiento superior a este umbral requiere firma multi-sig explícita en el Governance Center.
              </p>
            </div>

            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-200 font-mono">
                <span>Lista Blanca de Retiro</span>
                <span className="text-zinc-400">{walletConfig.withdrawalAllowlist.length} Direcciones</span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Los fondos solo pueden transferirse a destinos autorizados por el gobierno corporativo.
              </p>
            </div>

            <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-mono text-zinc-300">Firmantes Autorizados:</span>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {walletConfig.signerCount} {walletConfig.signerCount === 1 ? 'Firmante' : 'Firmantes'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

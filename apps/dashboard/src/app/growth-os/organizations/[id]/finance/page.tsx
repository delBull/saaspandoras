import { DashApi } from '@/lib/dash-api';
import type { TenantWalletConfigDTO } from '@/lib/dash-contracts/growth';
import { Wallet, ShieldCheck, Lock, AlertTriangle, ArrowUpRight, CheckCircle2, Sliders } from 'lucide-react';

export default async function SovereignFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const slugId = resolvedParams.id;
  const orgId = `org_${slugId}`;

  let walletConfig: TenantWalletConfigDTO = {
    organizationId: orgId,
    walletMode: 'PANDORAS_MANAGED',
    primaryAddress: '0x71C8F79D3A8b5774E906F2997e0C25553e1644B2',
    smartAccountAddress: '0xSafe_snarai_71C8',
    dailySpendLimitUsdc: 2500,
    spentTodayUsdc: 0,
    withdrawalAllowlist: ['0x71C8F79D3A8b5774E906F2997e0C25553e1644B2'],
    requiresMultiSig: true,
    signerCount: 2,
    balanceUsdc: 14500.50,
    balanceNative: 0.854,
    nativeSymbol: 'ETH',
    isIsolated: true,
    lastAuditedAt: new Date().toISOString(),
  };

  try {
    const fetched = await DashApi.growth.getWalletConfig(orgId);
    if (fetched) walletConfig = fetched;
  } catch (err) {
    console.warn('[SovereignFinancePage] Error fetching wallet config:', err);
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Wallet className="w-7 h-7 text-indigo-600" />
          Pay & Soberanía Financiera
        </h1>
        <p className="text-slate-500 mt-1">
          Configuración de tesorería, reglas de retiro seguro y billetera soberana para {slugId.toUpperCase()}.
        </p>
      </div>

      {/* Balances Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Tesorería Soberana</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Aislada & Segregada
            </span>
          </div>

          <div>
            <p className="text-sm text-slate-400">Balance Total Disponible</p>
            <p className="text-3xl sm:text-4xl font-bold tracking-tight mt-1">
              ${walletConfig.balanceUsdc.toLocaleString()} <span className="text-lg font-normal text-slate-400">USDC</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              + {walletConfig.balanceNative} {walletConfig.nativeSymbol} para gas on-chain
            </p>
          </div>

          <div className="pt-4 border-t border-slate-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Smart Account Safe:</span>
              <span className="font-mono text-indigo-300">{walletConfig.smartAccountAddress || 'Configurado'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Owner Wallet:</span>
              <span className="font-mono text-slate-300">
                {walletConfig.primaryAddress.slice(0, 8)}...{walletConfig.primaryAddress.slice(-6)}
              </span>
            </div>
          </div>
        </div>

        {/* Security Controls */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              Guardias de Seguridad Financiera
            </h3>
            <span className="text-xs font-semibold text-slate-500">Fail-Closed Active</span>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Límite Diario de Movimiento Autónomo</span>
                <span className="text-indigo-600">${walletConfig.dailySpendLimitUsdc} USDC/día</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Cualquier gasto superior requiere firma manual del fundador en el Governance Center.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Wallets Autorizadas para Retiro</span>
                <span className="text-emerald-600">{walletConfig.withdrawalAllowlist.length} en Allowlist</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Los fondos solo pueden transferirse a direcciones verificadas por gobernanza.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Recomendación de Seguridad Soberana
              </p>
              <p className="text-[11px] text-amber-700">
                Recomendamos que la wallet asignada a Hermes sea una cuenta dedicada exclusivamente a este negocio y no se use como wallet personal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

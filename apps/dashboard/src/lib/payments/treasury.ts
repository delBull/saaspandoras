/**
 * Resolución de la wallet que recibe los cobros (treasury / admin).
 *
 * Regla: SIEMPRE server-side y fail-closed. Nunca se usa una dirección
 * hardcodeada como fallback: si no hay configuración, el cobro no se crea y la
 * UI lo dice explícitamente. (Antes existía un fallback literal en
 * `internal/nexus/orders` y `growth/billing/create-intent`; aquí no se repite.)
 *
 * Orden de preferencia:
 *   PANDORAS_TREASURY_WALLET -> NEXT_PUBLIC_PANDORAS_TREASURY_WALLET
 *   -> PANDORAS_ADMIN_WALLET -> NEXT_PUBLIC_PANDORAS_ADMIN_WALLET
 */

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const CANDIDATES = [
  'PANDORAS_TREASURY_WALLET',
  'NEXT_PUBLIC_PANDORAS_TREASURY_WALLET',
  'PANDORAS_ADMIN_WALLET',
  'NEXT_PUBLIC_PANDORAS_ADMIN_WALLET',
] as const;

export type TreasuryResolution =
  | { ok: true; wallet: string; source: (typeof CANDIDATES)[number] }
  | { ok: false; reason: string; missing: readonly string[] };

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function isValidDestinationWallet(raw: string | null | undefined): raw is string {
  const value = (raw ?? '').trim();
  if (!ADDRESS_REGEX.test(value)) return false;
  return value.toLowerCase() !== ZERO_ADDRESS;
}

export interface PayoutOption {
  address: string;
  label: string;
  /** true = wallet resuelta desde el entorno (la que se usa si el operador no elige otra). */
  isDefault: boolean;
  source: 'default' | 'allowlist';
}

/**
 * Lista de wallets ofrecidas en el selector de la UI.
 *
 * - La primera es SIEMPRE la del entorno (default).
 * - Opcionalmente se pueden declarar más en `PANDORAS_PAYOUT_WALLETS`, con formato
 *   `0xAddr:Etiqueta,0xAddr2:Otra etiqueta`. Sirven como atajos aprobados.
 * - El operador puede además escribir otra wallet ("Otra wallet…"); el servidor
 *   valida el formato antes de guardarla (ver ruta de creación).
 */
export function resolvePayoutOptions(env: NodeJS.ProcessEnv = process.env): PayoutOption[] {
  const options: PayoutOption[] = [];
  const seen = new Set<string>();

  const treasury = resolveTreasuryWallet(env);
  if (treasury.ok) {
    options.push({
      address: treasury.wallet,
      label: 'Predeterminada (entorno)',
      isDefault: true,
      source: 'default',
    });
    seen.add(treasury.wallet);
  }

  const raw = env.PANDORAS_PAYOUT_WALLETS?.trim();
  if (raw) {
    for (const entry of raw.split(',')) {
      const [addressPart, ...labelParts] = entry.split(':');
      const address = (addressPart ?? '').trim().toLowerCase();
      if (!isValidDestinationWallet(address) || seen.has(address)) continue;
      const label = labelParts.join(':').trim() || `Wallet ${options.length + 1}`;
      options.push({ address, label, isDefault: false, source: 'allowlist' });
      seen.add(address);
      if (options.length >= 10) break;
    }
  }

  return options;
}

export function resolveTreasuryWallet(
  env: NodeJS.ProcessEnv = process.env
): TreasuryResolution {
  for (const key of CANDIDATES) {
    const raw = env[key]?.trim();
    if (!raw) continue;
    if (!ADDRESS_REGEX.test(raw)) {
      // Configurado pero inválido: se ignora y se sigue buscando, pero se reporta.
      continue;
    }
    return { ok: true, wallet: raw.toLowerCase(), source: key };
  }

  return {
    ok: false,
    reason:
      'No hay wallet de cobro configurada. Define PANDORAS_TREASURY_WALLET (o PANDORAS_ADMIN_WALLET) con una dirección 0x de 40 caracteres.',
    missing: CANDIDATES,
  };
}

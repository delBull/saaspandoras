/**
 * Canonical normalization for Nexus operator contact numbers (WhatsApp).
 *
 * SINGLE SOURCE OF TRUTH for the client preview and the server-side validation:
 * both must agree on the exact E.164 value that gets persisted. Keeping two
 * copies of this rule (client + route) caused silent drift, so any change to the
 * accepted formats belongs here and nowhere else.
 *
 * Rules:
 *  - Formatting characters (spaces, dashes, dots, parentheses) are stripped.
 *  - A leading `00` international prefix is rewritten to `+`.
 *  - An explicit `+` is authoritative: the number must already be E.164.
 *  - Digits WITHOUT `+` carry no country information. The only accepted case is
 *    an exact national number for the declared default country (Mexico, 10
 *    digits). The caller receives `assumedCountryCode` so the UI can show the
 *    operator what will be stored instead of mutating the value silently.
 *  - Anything else is rejected as ambiguous. Guessing the country from the digit
 *    count (e.g. forcing `+52` on any 10-digit number) would silently corrupt
 *    numbers from other countries.
 */

/** E.164 as accepted for persistence: 7-15 digits, leading `+`, no leading zero. */
export const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/**
 * Country assumed ONLY when the operator types a bare national number of
 * exactly 10 digits. Mexico's national mobile length is 10.
 */
export const NEXUS_DEFAULT_PHONE_COUNTRY_CODE = '52';

const DEFAULT_COUNTRY_NATIONAL_LENGTH = 10;

export type PhoneNormalizationFailure =
  /** No number was provided. */
  | 'EMPTY'
  /** Characters that cannot be part of a phone number, or a malformed E.164 value. */
  | 'INVALID_FORMAT'
  /** Digits without a country code that do not match the default country length. */
  | 'AMBIGUOUS_COUNTRY_CODE';

export type PhoneNormalizationResult =
  | {
      ok: true;
      /** Canonical E.164 value to persist. */
      value: string;
      /** Country code injected by this normalization, or null when the operator provided one. */
      assumedCountryCode: string | null;
    }
  | { ok: false; reason: PhoneNormalizationFailure };

/**
 * Normalizes an operator-typed phone number into E.164 without guessing.
 *
 * @param raw Number as typed by the operator (any accepted formatting).
 * @param options.defaultCountryCode Country to assume for bare national numbers.
 *   Omit it to reject every number that carries no country code.
 */
export function normalizePhoneE164(
  raw: string | null | undefined,
  options: { defaultCountryCode?: string } = {},
): PhoneNormalizationResult {
  const cleaned = (raw ?? '').replace(/[\s\-().]/g, '');
  if (!cleaned) return { ok: false, reason: 'EMPTY' };

  const international = cleaned.startsWith('00') ? `+${cleaned.slice(2)}` : cleaned;

  if (international.startsWith('+')) {
    return E164_PATTERN.test(international)
      ? { ok: true, value: international, assumedCountryCode: null }
      : { ok: false, reason: 'INVALID_FORMAT' };
  }

  if (!/^\d+$/.test(international)) return { ok: false, reason: 'INVALID_FORMAT' };

  const { defaultCountryCode } = options;
  if (defaultCountryCode && international.length === DEFAULT_COUNTRY_NATIONAL_LENGTH) {
    const candidate = `+${defaultCountryCode}${international}`;
    return E164_PATTERN.test(candidate)
      ? { ok: true, value: candidate, assumedCountryCode: defaultCountryCode }
      : { ok: false, reason: 'INVALID_FORMAT' };
  }

  return { ok: false, reason: 'AMBIGUOUS_COUNTRY_CODE' };
}

/** True only for an already canonical E.164 value. */
export function isE164Phone(raw: string | null | undefined): boolean {
  return E164_PATTERN.test((raw ?? '').replace(/[\s\-().]/g, ''));
}

/** Operator-facing explanation of a failed normalization. */
export function describePhoneFailure(
  reason: PhoneNormalizationFailure,
  options: { defaultCountryCode?: string } = {},
): string {
  switch (reason) {
    case 'EMPTY':
      return 'Ingresa un número de WhatsApp.';
    case 'AMBIGUOUS_COUNTRY_CODE':
      return options.defaultCountryCode
        ? `Escribe el número con código de país (ej. +${options.defaultCountryCode}5512345678) o captura los ${DEFAULT_COUNTRY_NATIONAL_LENGTH} dígitos nacionales.`
        : 'Escribe el número con código de país (ej. +525512345678).';
    case 'INVALID_FORMAT':
      return 'El número de WhatsApp no tiene un formato válido. Usa el estándar internacional (ej. +525512345678).';
  }
}

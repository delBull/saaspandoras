import { describe, expect, it } from 'vitest';
import {
  NEXUS_DEFAULT_PHONE_COUNTRY_CODE,
  describePhoneFailure,
  isE164Phone,
  normalizePhoneE164,
} from '../phone';

const MX = { defaultCountryCode: NEXUS_DEFAULT_PHONE_COUNTRY_CODE };

describe('normalizePhoneE164 — canonical operator phone normalization', () => {
  it('keeps an explicit E.164 number untouched', () => {
    expect(normalizePhoneE164('+14155551234', MX)).toEqual({
      ok: true,
      value: '+14155551234',
      assumedCountryCode: null,
    });
  });

  it('never applies +52 to a number that already carries an explicit country code', () => {
    const result = normalizePhoneE164('+1 415 555 1234', MX);
    expect(result).toMatchObject({ ok: true, value: '+14155551234', assumedCountryCode: null });
  });

  it('applies the declared default country to a bare 10-digit national number and reports the assumption', () => {
    expect(normalizePhoneE164('3324158568', MX)).toEqual({
      ok: true,
      value: '+523324158568',
      assumedCountryCode: '52',
    });
  });

  it('strips formatting characters before validating', () => {
    expect(normalizePhoneE164('+52 (33) 2415-8568', MX)).toMatchObject({
      ok: true,
      value: '+523324158568',
    });
  });

  it('rewrites the 00 international prefix to +', () => {
    expect(normalizePhoneE164('0049 15123456789', MX)).toMatchObject({ ok: true, value: '+4915123456789' });
  });

  it('rejects bare international digits instead of guessing the country', () => {
    // 11 digits without '+' — previously rewritten to '+14155551234' by guesswork.
    expect(normalizePhoneE164('14155551234', MX)).toEqual({
      ok: false,
      reason: 'AMBIGUOUS_COUNTRY_CODE',
    });
    expect(normalizePhoneE164('4915123456789', MX)).toEqual({
      ok: false,
      reason: 'AMBIGUOUS_COUNTRY_CODE',
    });
  });

  it('rejects a bare national number when no default country is declared', () => {
    expect(normalizePhoneE164('3324158568')).toEqual({ ok: false, reason: 'AMBIGUOUS_COUNTRY_CODE' });
  });

  it('rejects malformed and empty input', () => {
    expect(normalizePhoneE164('')).toEqual({ ok: false, reason: 'EMPTY' });
    expect(normalizePhoneE164('   ')).toEqual({ ok: false, reason: 'EMPTY' });
    expect(normalizePhoneE164(null)).toEqual({ ok: false, reason: 'EMPTY' });
    expect(normalizePhoneE164('+0123456789', MX)).toEqual({ ok: false, reason: 'INVALID_FORMAT' });
    expect(normalizePhoneE164('abc3324158568', MX)).toEqual({ ok: false, reason: 'INVALID_FORMAT' });
    expect(normalizePhoneE164('+52', MX)).toEqual({ ok: false, reason: 'INVALID_FORMAT' });
  });

  it('isE164Phone only accepts canonical values', () => {
    expect(isE164Phone('+523324158568')).toBe(true);
    expect(isE164Phone('523324158568')).toBe(false);
    expect(isE164Phone('3324158568')).toBe(false);
    expect(isE164Phone('')).toBe(false);
  });

  it('describePhoneFailure tells the operator how to fix an ambiguous number', () => {
    expect(describePhoneFailure('AMBIGUOUS_COUNTRY_CODE', MX)).toContain('+525512345678');
    expect(describePhoneFailure('INVALID_FORMAT')).toContain('estándar internacional');
    expect(describePhoneFailure('EMPTY')).toContain('WhatsApp');
  });
});

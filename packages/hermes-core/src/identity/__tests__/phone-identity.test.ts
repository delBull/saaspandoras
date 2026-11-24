/**
 * 🏛️ HERMES OS — Canonical phone identity (P1-4)
 *
 * Regla: un número extranjero que comparte los últimos 10 dígitos NO puede
 * resolver como el jefe, un colaborador ni un lead registrado. Los formatos
 * mexicanos (+52, 521, local de 10 dígitos) sí deben seguir resolviendo.
 */

import { describe, it, expect } from 'vitest';
import {
  canonicalPhone,
  phonesShareIdentity,
  InterlocutorResolver,
} from '../interlocutor-resolver';

describe('canonicalPhone', () => {
  it('pliega el trunk móvil mexicano (521 → 52)', () => {
    const a = canonicalPhone('5213221051871');
    expect(a).toEqual({ e164: '523221051871', prefix: '52', national: '3221051871' });
    expect(a?.e164).toBe(canonicalPhone('+52 322 105 1871')?.e164);
  });

  it('trata un número local de 10 dígitos como el país por defecto', () => {
    expect(canonicalPhone('3221051871')).toEqual({
      e164: '523221051871',
      prefix: '52',
      national: '3221051871',
    });
  });

  it('respeta formatos internacionales y conserva su prefijo', () => {
    expect(canonicalPhone('+1 (322) 105-1871')).toEqual({
      e164: '13221051871',
      prefix: '1',
      national: '3221051871',
    });
  });

  it('devuelve null para entradas vacías o demasiado cortas', () => {
    expect(canonicalPhone('')).toBeNull();
    expect(canonicalPhone('12345')).toBeNull();
    expect(canonicalPhone(undefined)).toBeNull();
  });
});

describe('phonesShareIdentity', () => {
  it('considera la misma persona los formatos mexicanos', () => {
    // Meta entrega 521…, la ficha puede estar en +52 …, y el humano escribe 10 dígitos.
    expect(phonesShareIdentity('5213221051871', '+52 322 105 1871')).toBe(true);
    expect(phonesShareIdentity('523222149409', '3222149409')).toBe(true);
    expect(phonesShareIdentity('+52 1 322 214 9409', '523222149409')).toBe(true);
  });

  it('NO considera la misma persona a un extranjero con los mismos 10 dígitos', () => {
    // +1 322 214 9409 (Estados Unidos) ≠ +52 322 214 9409 (México).
    expect(phonesShareIdentity('13222149409', '523222149409')).toBe(false);
    expect(phonesShareIdentity('+34 322 214 9409', '523222149409')).toBe(false);
  });

  it('no compara números cortos o vacíos', () => {
    expect(phonesShareIdentity('', '523222149409')).toBe(false);
    expect(phonesShareIdentity('12345', '12345')).toBe(false);
  });
});

describe('InterlocutorResolver.isBossIdentity — teléfono', () => {
  const bossFormats = [
    '+52 322 274 1987',
    '523222741987',
    '5213222741987',
    '3222741987',
  ];

  it.each(bossFormats)('reconoce al jefe en formato %s', (phone) => {
    expect(InterlocutorResolver.isBossIdentity({ phone })).toBe(true);
  });

  it('rechaza un número extranjero con los mismos 10 dígitos del jefe', () => {
    expect(InterlocutorResolver.isBossIdentity({ phone: '13222741987' })).toBe(false);
    expect(InterlocutorResolver.isBossIdentity({ phone: '+44 322 274 1987' })).toBe(false);
  });

  it('no confunde a un colaborador con el jefe por coincidencia de sufijo', () => {
    // Susana: 523221023028 — un +1 con el mismo nacional no es el jefe ni Susana.
    expect(InterlocutorResolver.isBossIdentity({ phone: '13221023028' })).toBe(false);
    expect(phonesShareIdentity('13221023028', '523221023028')).toBe(false);
  });
});

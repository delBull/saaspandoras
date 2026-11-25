import { describe, it, expect } from 'vitest';
import {
  ATTRIBUTION_COOKIE,
  isValidAttributionCode,
  readAttributionCookie,
  resolveAttributionSource,
} from '../attribution';

describe('Atribución · códigos', () => {
  it('acepta códigos del generador (8 chars alfanuméricos)', () => {
    expect(isValidAttributionCode('god2f7wy')).toBe(true);
    expect(isValidAttributionCode('2jwttywg')).toBe(true);
  });

  it('rechaza basura, vacíos y vectores de cabecera', () => {
    expect(isValidAttributionCode('')).toBe(false);
    expect(isValidAttributionCode('abc')).toBe(false);
    expect(isValidAttributionCode('GOD2F7WY')).toBe(false); // mayúsculas: el generador usa minúsculas
    expect(isValidAttributionCode('abc def')).toBe(false);
    expect(isValidAttributionCode('abc;drop')).toBe(false);
    expect(isValidAttributionCode(undefined)).toBe(false);
    expect(isValidAttributionCode(42)).toBe(false);
  });
});

describe('Atribución · cookie', () => {
  it('lee la cookie entre otras', () => {
    expect(readAttributionCookie(`a=1; ${ATTRIBUTION_COOKIE}=god2f7wy; b=2`)).toBe('god2f7wy');
    expect(readAttributionCookie(`${ATTRIBUTION_COOKIE}=god2f7wy`)).toBe('god2f7wy');
  });

  it('ignora valores inválidos o ausentes', () => {
    expect(readAttributionCookie(`a=1`)).toBeNull();
    expect(readAttributionCookie(`a=1; ${ATTRIBUTION_COOKIE}=;`)).toBeNull();
    expect(readAttributionCookie(`a=1; ${ATTRIBUTION_COOKIE}=<script>`)).toBeNull();
    expect(readAttributionCookie(null)).toBeNull();
  });
});

describe('Atribución · prioridad', () => {
  it('el src de la URL manda sobre la cookie', () => {
    expect(resolveAttributionSource('nuevo123', 'viejo123')).toBe('nuevo123');
  });

  it('sin src usa la cookie y sin nada devuelve null', () => {
    expect(resolveAttributionSource(undefined, 'viejo123')).toBe('viejo123');
    expect(resolveAttributionSource(null, '', 'x')).toBeNull();
  });
});

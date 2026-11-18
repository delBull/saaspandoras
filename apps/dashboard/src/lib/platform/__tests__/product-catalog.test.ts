import { describe, expect, it } from 'vitest';
import {
  getProductEntryPath,
  normalizeProductKey,
  normalizeProductList,
  pickPrimaryProduct,
  productFamilyOf,
  tenantHasProduct,
} from '@saasfly/shared';

/**
 * Catálogo de productos: normalización de alias (la DB mezcla HERMES/HERMES_OS),
 * producto primario y ruta de entrada por producto.
 */

describe('normalizeProductKey', () => {
  it('normaliza mayúsculas y alias legacy', () => {
    expect(normalizeProductKey('hermes')).toBe('HERMES');
    expect(normalizeProductKey('HERMES_OS')).toBe('HERMES');
    expect(normalizeProductKey('growth')).toBe('GROWTH_OS');
    expect(normalizeProductKey('rwa')).toBe('TOKENIZATION');
    expect(normalizeProductKey('media-co')).toBe('MEDIA_CO');
  });

  it('devuelve null para desconocidos', () => {
    expect(normalizeProductKey('nft_lab')).toBeNull();
    expect(normalizeProductKey('')).toBeNull();
    expect(normalizeProductKey(null)).toBeNull();
  });
});

describe('normalizeProductList', () => {
  it('deduplica y descarta desconocidos', () => {
    expect(normalizeProductList(['hermes', 'HERMES_OS', 'rwa', 'nft_lab'])).toEqual([
      'HERMES',
      'TOKENIZATION',
    ]);
  });

  it('lista vacía o inválida ⇒ []', () => {
    expect(normalizeProductList([])).toEqual([]);
    expect(normalizeProductList('HERMES')).toEqual([]);
    expect(normalizeProductList(undefined)).toEqual([]);
  });
});

describe('pickPrimaryProduct', () => {
  it('prefiere HERMES sobre el resto', () => {
    expect(pickPrimaryProduct(['TOKENIZATION', 'HERMES_OS'])).toBe('HERMES');
  });

  it('sin Hermes, sigue el orden del catálogo', () => {
    expect(pickPrimaryProduct(['TOKENIZATION', 'GROWTH_OS'])).toBe('GROWTH_OS');
    expect(pickPrimaryProduct(['TOKENIZATION'])).toBe('TOKENIZATION');
  });

  it('sin productos instalados cae al default', () => {
    expect(pickPrimaryProduct([])).toBe('HERMES');
  });
});

describe('getProductEntryPath', () => {
  it('cada producto tiene su entrada', () => {
    expect(getProductEntryPath('HERMES', 'forge')).toBe('/portal/forge/overview');
    expect(getProductEntryPath('GROWTH_OS', 'forge')).toBe('/portal/forge/growth');
    expect(getProductEntryPath('TOKENIZATION', 'forge')).toBe('/ecosystem/forge/capital');
    expect(getProductEntryPath('MEDIA_CO', 'forge')).toBe('/portal/forge/media');
  });
});

describe('tenantHasProduct', () => {
  it('reconoce alias legacy de la DB', () => {
    expect(tenantHasProduct(['HERMES_OS'], 'HERMES')).toBe(true);
    expect(tenantHasProduct(['HERMES'], 'TOKENIZATION')).toBe(false);
  });

  it('family declarada del registry', () => {
    expect(productFamilyOf('GROWTH_OS')).toBe('GROWTH_OS');
    expect(productFamilyOf('HERMES')).toBe('GROWTH_OS');
  });
});

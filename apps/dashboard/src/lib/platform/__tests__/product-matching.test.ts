import { describe, expect, it } from 'vitest';
import { productKeysFor } from '../product-matching';

/**
 * El match de productos instalados debe ser por `product` (con alias legacy),
 * nunca por `productFamily`: HERMES y GROWTH_OS comparten familia.
 */
describe('productKeysFor', () => {
  it('HERMES reconoce la clave legacy HERMES_OS', () => {
    expect(productKeysFor('HERMES')).toEqual(['HERMES', 'HERMES_OS']);
  });

  it('TOKENIZATION reconoce PANDORAS_RWA y RWA', () => {
    expect(productKeysFor('TOKENIZATION')).toContain('PANDORAS_RWA');
    expect(productKeysFor('TOKENIZATION')).toContain('RWA');
  });

  it('GROWTH_OS no incluye HERMES (productos distintos, misma familia)', () => {
    expect(productKeysFor('GROWTH_OS')).toEqual(['GROWTH_OS']);
    expect(productKeysFor('GROWTH_OS')).not.toContain('HERMES');
  });

  it('claves desconocidas se devuelven tal cual', () => {
    expect(productKeysFor('SOMETHING')).toEqual(['SOMETHING']);
  });
});

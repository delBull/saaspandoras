import { installedProducts } from '@saasfly/db/schema';
import { inArray } from '@saasfly/db-core';

/**
 * Identificación de productos instalados por `product` (no por `productFamily`).
 *
 * Motivo: `HERMES` y `GROWTH_OS` comparten la familia 'GROWTH_OS', así que
 * cualquier consulta por `productFamily` mezcla ambos productos (over/under-grant
 * según el sitio). Además la DB conserva claves legacy (`HERMES_OS`,
 * `PANDORAS_RWA`) que deben contar como el mismo producto.
 *
 * Regla: dentro de una consulta usa `installedProductIn(keys)` y nunca compares
 * `productFamily` contra una clave de producto.
 */

export const PRODUCT_KEY_ALIASES: Record<string, string[]> = {
  HERMES: ['HERMES', 'HERMES_OS'],
  GROWTH_OS: ['GROWTH_OS'],
  TOKENIZATION: ['TOKENIZATION', 'PANDORAS_RWA', 'RWA'],
  MEDIA_CO: ['MEDIA_CO', 'MEDIACO'],
  DEV_ACCESS: ['DEV_ACCESS'],
  NFT_LAB: ['NFT_LAB'],
};

/** Claves que representan el mismo producto (canónica + legacy). */
export function productKeysFor(product: string): string[] {
  return PRODUCT_KEY_ALIASES[product?.toUpperCase?.() ?? ''] ?? [product];
}

/** Predicado drizzle para `installed_products.product`. */
export function installedProductIn(product: string) {
  return inArray(installedProducts.product, productKeysFor(product));
}

/** Predicado drizzle para varios productos a la vez. */
export function installedProductInAny(products: string[]) {
  const keys = Array.from(new Set(products.flatMap((p) => productKeysFor(p))));
  return inArray(installedProducts.product, keys);
}

import { PRODUCT_REGISTRY, type ProductKey } from './product-registry';

/**
 * Catálogo canónico de productos y su entrada en el Portal.
 *
 * Problema que resuelve: la DB de `installed_products` tiene nombres
 * inconsistentes (`HERMES` vs `HERMES_OS`, `GROWTH_OS`, `TOKENIZATION`…), el
 * magic link fijaba `'hermes'` en minúsculas y el resolver comparaba exacto.
 * Resultado: `activeProduct` podía quedar en `null`.
 *
 * Reglas:
 *  - Un solo lugar define alias, orden de preferencia y ruta de entrada.
 *  - Nada hardcodea nombres de producto fuera de este módulo.
 */

/** Productos que un tenant puede tener instalados. */
export const PROVISIONABLE_PRODUCTS = [
  'HERMES',
  'GROWTH_OS',
  'TOKENIZATION',
  'MEDIA_CO',
] as const satisfies readonly ProductKey[];

export type ProvisionableProduct = (typeof PROVISIONABLE_PRODUCTS)[number];

/** Por defecto, si el integrador no especifica productos. */
export const DEFAULT_PROVISION_PRODUCT: ProvisionableProduct = 'HERMES';

/** Orden de preferencia para elegir el "producto primario" de una sesión. */
export const PRIMARY_PRODUCT_ORDER: readonly ProvisionableProduct[] = [
  'HERMES',
  'GROWTH_OS',
  'TOKENIZATION',
  'MEDIA_CO',
];

/**
 * Alias aceptados (legacy / nombres comerciales) → key canónica.
 * Se comparan en MAYÚSCULAS y sin espacios.
 */
const PRODUCT_ALIASES: Record<string, ProvisionableProduct> = {
  HERMES: 'HERMES',
  HERMES_OS: 'HERMES',
  HERMESOS: 'HERMES',
  GROWTH_OS: 'GROWTH_OS',
  GROWTHOS: 'GROWTH_OS',
  GROWTH: 'GROWTH_OS',
  RWA: 'TOKENIZATION',
  TOKENIZATION: 'TOKENIZATION',
  TOKENIZACION: 'TOKENIZATION',
  CAPITAL: 'TOKENIZATION',
  MEDIA_CO: 'MEDIA_CO',
  MEDIACO: 'MEDIA_CO',
  MEDIA: 'MEDIA_CO',
};

export function normalizeProductKey(input: string | null | undefined): ProvisionableProduct | null {
  if (!input || typeof input !== 'string') return null;
  const key = input.trim().toUpperCase().replace(/[\s-]+/g, '_');
  return PRODUCT_ALIASES[key] ?? null;
}

/** Normaliza una lista de productos, deduplicando y descartando desconocidos. */
export function normalizeProductList(input: unknown): ProvisionableProduct[] {
  if (!Array.isArray(input)) return [];
  const out: ProvisionableProduct[] = [];
  for (const raw of input) {
    const key = normalizeProductKey(typeof raw === 'string' ? raw : null);
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

/** Familia declarada en el registry (p. ej. HERMES → GROWTH_OS). */
export function productFamilyOf(product: ProvisionableProduct): string {
  return PRODUCT_REGISTRY[product]?.family ?? 'GROWTH_OS';
}

/**
 * Ruta de entrada de cada producto dentro del Portal/ecosistema del tenant.
 * El hub enlaza aquí; el tenant nunca necesita conocerla de antemano.
 */
export function getProductEntryPath(product: ProvisionableProduct, organizationSlug: string): string {
  const slug = encodeURIComponent(organizationSlug);
  switch (product) {
    case 'HERMES':
      return `/portal/${slug}/overview`;
    case 'GROWTH_OS':
      return `/portal/${slug}/growth`;
    case 'TOKENIZATION':
      // RWA vive en el ecosistema del tenant (capital / tokenización).
      return `/ecosystem/${slug}/capital`;
    case 'MEDIA_CO':
      return `/portal/${slug}/media`;
    default:
      return `/portal/${slug}/overview`;
  }
}

export function productDisplayName(product: ProvisionableProduct): string {
  return PRODUCT_REGISTRY[product]?.displayName ?? product;
}

/**
 * Producto primario de un tenant: el primero instalado según el orden de
 * preferencia. Se usa para el token de portal y para el `currentVertical`.
 */
export function pickPrimaryProduct(installed: Array<string | null | undefined>): ProvisionableProduct {
  const normalized = new Set(
    installed.map((p) => normalizeProductKey(typeof p === 'string' ? p : null)).filter(Boolean)
  );
  for (const candidate of PRIMARY_PRODUCT_ORDER) {
    if (normalized.has(candidate)) return candidate;
  }
  return DEFAULT_PROVISION_PRODUCT;
}

/** ¿El tenant tiene este producto instalado? (acepta alias legacy) */
export function tenantHasProduct(
  installed: Array<string | null | undefined>,
  product: ProvisionableProduct
): boolean {
  return installed.some((p) => normalizeProductKey(typeof p === 'string' ? p : null) === product);
}

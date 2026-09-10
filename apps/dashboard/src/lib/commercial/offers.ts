/**
 * 🏛️ Pandora's Commercial Offers — Single Source of Truth
 * src/lib/commercial/offers.ts
 *
 * Catálogo comercial canónico inmutable.
 * REGLA HERMES: El agente LLM NUNCA calcula ni escribe precios libres.
 * Solo puede citar y proponer un `offerId` formal de este catálogo.
 */

import type { ProductKey, PlanKey } from '@/lib/platform/product-registry';

export type FulfillmentType = 'saas_provision' | 'sow_protocol' | 'deal_room' | 'custom_ops';

export interface CommercialOffer {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  amount: string; // Decimal string con 2 decimales para compatibilidad con Viem/Neon
  currency: 'USD';
  productKey: ProductKey;
  planKey?: PlanKey;
  tier?: 'TIER_1' | 'TIER_2' | 'TIER_3';
  fulfillmentType: FulfillmentType;
  defaultMethods: ('crypto' | 'wire')[];
  category: 'growth_os' | 'infrastructure' | 'media';
  isActive: boolean;
}

export interface OfferLinkMetadata {
  offerId: string;
  source: 'hermes' | 'admin' | 'simulator' | 'api' | 'whatsapp';
  attributionRep?: string;
  fulfillmentType: FulfillmentType;
  productKey: ProductKey;
  planKey?: PlanKey;
  tier?: string;
  clientRequestedAt?: string;
  rawNotes?: string;
}

export const COMMERCIAL_OFFERS: Record<string, CommercialOffer> = {
  // ── HERMES RUNTIME & GROWTH OS ───────────────────────────────────────────
  hermes_starter_monthly: {
    id: 'hermes_starter_monthly',
    title: 'Hermes Runtime — Starter Plan (Mensual)',
    shortDescription: 'Agente conversacional 24/7 para WebChat y WhatsApp.',
    fullDescription: 'Licencia mensual de Hermes Runtime Starter: incluye WebChat, conector WhatsApp, Base de Conocimiento con Sovereign Vault K25, hasta 1,500 conversaciones/mes y soporte asistido.',
    amount: '299.00',
    currency: 'USD',
    productKey: 'HERMES',
    planKey: 'starter',
    fulfillmentType: 'saas_provision',
    defaultMethods: ['crypto', 'wire'],
    category: 'growth_os',
    isActive: true,
  },

  hermes_growth_monthly: {
    id: 'hermes_growth_monthly',
    title: 'Hermes Runtime — Growth Plan (Mensual)',
    shortDescription: 'Suite de ventas omnicanal, voz interactiva y analítica de conversión.',
    fullDescription: 'Licencia mensual de Hermes Runtime Growth: incluye WebChat, WhatsApp, integración de Voz (ElevenLabs/SignalWire), motor de intenciones de compra autónomo, journeys de seguimiento y analítica ejecutiva.',
    amount: '699.00',
    currency: 'USD',
    productKey: 'HERMES',
    planKey: 'growth',
    fulfillmentType: 'saas_provision',
    defaultMethods: ['crypto', 'wire'],
    category: 'growth_os',
    isActive: true,
  },

  hermes_setup_acceleration: {
    id: 'hermes_setup_acceleration',
    title: 'Hermes Acceleration Setup (One-time)',
    shortDescription: 'Configuración, ingestión de catálogo e indexación vectorial.',
    fullDescription: 'Aceleración técnica inicial: curaduría documental, configuración de políticas en Knowledge Vault, pruebas de prompt engineering, integración de canal WhatsApp y entrenamiento inicial.',
    amount: '490.00',
    currency: 'USD',
    productKey: 'HERMES',
    planKey: 'starter',
    fulfillmentType: 'custom_ops',
    defaultMethods: ['crypto', 'wire'],
    category: 'growth_os',
    isActive: true,
  },

  // ── TOKENIZACIÓN & CAPITAL ENGINE (SOW PROTOCOL TIERS) ───────────────────
  sow_tier_1_viability: {
    id: 'sow_tier_1_viability',
    title: 'SOW Tier 1 — Viability & Utility Definition',
    shortDescription: 'Filtro de viabilidad técnica y operativa Work-to-Earn (48-72h).',
    fullDescription: 'Evaluación técnica, dictamen de aptitud de protocolo, blueprint de roles de utilidad y definición funcional previo a arquitectura o deployment.',
    amount: '2500.00',
    currency: 'USD',
    productKey: 'TOKENIZATION',
    tier: 'TIER_1',
    fulfillmentType: 'sow_protocol',
    defaultMethods: ['crypto', 'wire'],
    category: 'infrastructure',
    isActive: true,
  },

  sow_tier_2_architecture: {
    id: 'sow_tier_2_architecture',
    title: 'SOW Tier 2 — Technical Architecture & Tokenomics',
    shortDescription: 'Diseño de contratos, lógica económica y matriz legal.',
    fullDescription: 'Especificación de smart contracts, estructura de gobernanza DAO, modelo financiero de tokenomics y preparación para auditoría.',
    amount: '7500.00',
    currency: 'USD',
    productKey: 'TOKENIZATION',
    tier: 'TIER_2',
    fulfillmentType: 'sow_protocol',
    defaultMethods: ['crypto', 'wire'],
    category: 'infrastructure',
    isActive: true,
  },

  sow_tier_3_deployment: {
    id: 'sow_tier_3_deployment',
    title: 'SOW Tier 3 — Protocol Deployment & Launch',
    shortDescription: 'Despliegue on-chain en testnet/mainnet y deal room de lanzamiento.',
    fullDescription: 'Despliegue verificado en red, interfaz whitelabel institucional, emisión inicial de certificados y soporte de lanzamiento.',
    amount: '15000.00',
    currency: 'USD',
    productKey: 'TOKENIZATION',
    tier: 'TIER_3',
    fulfillmentType: 'sow_protocol',
    defaultMethods: ['crypto', 'wire'],
    category: 'infrastructure',
    isActive: true,
  },
};

const METADATA_DELIMITER = '<!--OFFER_METADATA_JSON:';
const METADATA_END = ':OFFER_METADATA_END-->';

/**
 * Serializa los metadatos de la oferta dentro del campo description
 * de forma 100% retrocompatible y segura con el esquema actual.
 */
export function embedOfferMetadataInDescription(
  visibleDescription: string,
  metadata: OfferLinkMetadata
): string {
  const metaJson = JSON.stringify(metadata);
  return `${visibleDescription.trim()}\n\n${METADATA_DELIMITER}${metaJson}${METADATA_END}`;
}

/**
 * Extrae los metadatos de oferta del campo description si existen.
 */
export function extractOfferMetadataFromDescription(
  descriptionText?: string | null
): OfferLinkMetadata | null {
  if (!descriptionText) return null;
  const startIdx = descriptionText.indexOf(METADATA_DELIMITER);
  const endIdx = descriptionText.indexOf(METADATA_END);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return null;
  }

  try {
    const rawJson = descriptionText.slice(startIdx + METADATA_DELIMITER.length, endIdx);
    const parsed = JSON.parse(rawJson);
    if (parsed && typeof parsed === 'object' && parsed.offerId) {
      return parsed as OfferLinkMetadata;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Obtiene una oferta comercial por ID.
 */
export function getCommercialOffer(offerId: string): CommercialOffer | null {
  return COMMERCIAL_OFFERS[offerId] ?? null;
}

/**
 * Obtiene una oferta comercial obligatoria o lanza error (fail-closed).
 */
export function requireCommercialOffer(offerId: string): CommercialOffer {
  const offer = COMMERCIAL_OFFERS[offerId];
  if (!offer) {
    throw new Error(`[CommercialCatalog] Invalid or unregistered offerId: '${offerId}'`);
  }
  return offer;
}

/**
 * Lista ofertas comerciales con filtros opcionales.
 */
export function listCommercialOffers(filter?: {
  productKey?: ProductKey;
  fulfillmentType?: FulfillmentType;
  category?: 'growth_os' | 'infrastructure' | 'media';
  activeOnly?: boolean;
}): CommercialOffer[] {
  let list = Object.values(COMMERCIAL_OFFERS);

  if (filter?.activeOnly !== false) {
    list = list.filter((o) => o.isActive);
  }
  if (filter?.productKey) {
    list = list.filter((o) => o.productKey === filter.productKey);
  }
  if (filter?.fulfillmentType) {
    list = list.filter((o) => o.fulfillmentType === filter.fulfillmentType);
  }
  if (filter?.category) {
    list = list.filter((o) => o.category === filter.category);
  }

  return list;
}

import { describe, it, expect } from 'vitest';
import {
  COMMERCIAL_OFFERS,
  getCommercialOffer,
  requireCommercialOffer,
  listCommercialOffers,
  embedOfferMetadataInDescription,
  extractOfferMetadataFromDescription,
  type OfferLinkMetadata,
} from '../offers';

describe('🏛️ Canonical Commercial Catalog (COMMERCIAL_OFFERS)', () => {
  it('todas las ofertas tienen IDs unicos, montos validos en USD y descripciones', () => {
    const offers = Object.values(COMMERCIAL_OFFERS);
    expect(offers.length).toBeGreaterThanOrEqual(5);

    for (const offer of offers) {
      expect(offer.id).toBeDefined();
      expect(offer.title).toBeDefined();
      expect(offer.currency).toBe('USD');
      // El monto debe ser un string numérico válido con formato decimal (ej: "299.00")
      expect(/^\d+\.\d{2}$/.test(offer.amount)).toBe(true);
      expect(Number(offer.amount)).toBeGreaterThan(0);
      expect(['saas_provision', 'sow_protocol', 'deal_room', 'custom_ops']).toContain(
        offer.fulfillmentType
      );
      expect(offer.defaultMethods.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('getCommercialOffer resuelve ofertas existentes y retorna null para desconocidas', () => {
    const starter = getCommercialOffer('hermes_starter_monthly');
    expect(starter).not.toBeNull();
    expect(starter?.amount).toBe('299.00');
    expect(starter?.productKey).toBe('HERMES');

    const fake = getCommercialOffer('plan_ilimitado_gratis');
    expect(fake).toBeNull();
  });

  it('requireCommercialOffer es fail-closed y arroja error en oferta inexistente', () => {
    expect(() => requireCommercialOffer('hermes_starter_monthly')).not.toThrow();
    expect(() => requireCommercialOffer('hacker_fake_offer_0_usd')).toThrow(
      /Invalid or unregistered offerId/
    );
  });

  it('listCommercialOffers filtra por productKey y fulfillmentType correctamente', () => {
    const hermesOffers = listCommercialOffers({ productKey: 'HERMES' });
    expect(hermesOffers.length).toBeGreaterThan(0);
    expect(hermesOffers.every((o) => o.productKey === 'HERMES')).toBe(true);

    const sowOffers = listCommercialOffers({ fulfillmentType: 'sow_protocol' });
    expect(sowOffers.length).toBe(3);
    expect(sowOffers.every((o) => o.fulfillmentType === 'sow_protocol')).toBe(true);
  });

  it('embedOfferMetadataInDescription y extractOfferMetadataFromDescription preservan la metadata estructurada', () => {
    const visibleText = 'Este es el alcance público de la propuesta para el cliente.';
    const meta: OfferLinkMetadata = {
      offerId: 'hermes_starter_monthly',
      source: 'simulator',
      attributionRep: 'seller_carla',
      fulfillmentType: 'saas_provision',
      productKey: 'HERMES',
      planKey: 'starter',
      clientRequestedAt: '2026-09-10T14:00:00.000Z',
    };

    const embedded = embedOfferMetadataInDescription(visibleText, meta);
    expect(embedded).toContain(visibleText);
    expect(embedded).toContain('<!--OFFER_METADATA_JSON:');

    const extracted = extractOfferMetadataFromDescription(embedded);
    expect(extracted).not.toBeNull();
    expect(extracted?.offerId).toBe('hermes_starter_monthly');
    expect(extracted?.source).toBe('simulator');
    expect(extracted?.attributionRep).toBe('seller_carla');
    expect(extracted?.fulfillmentType).toBe('saas_provision');
  });

  it('extractOfferMetadataFromDescription degrada de forma segura si la descripcion es texto plano o nula', () => {
    expect(extractOfferMetadataFromDescription(null)).toBeNull();
    expect(extractOfferMetadataFromDescription(undefined)).toBeNull();
    expect(extractOfferMetadataFromDescription('Texto plano antiguo sin metadata')).toBeNull();
    expect(extractOfferMetadataFromDescription('<!--OFFER_METADATA_JSON:INVALID_JSON:OFFER_METADATA_END-->')).toBeNull();
  });
});

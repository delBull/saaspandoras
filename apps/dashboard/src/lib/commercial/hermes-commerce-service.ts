/**
 * 🏛️ Hermes Commercial Service — Proposal Engine
 * src/lib/commercial/hermes-commerce-service.ts
 *
 * Conecta las intenciones de compra detectadas por Hermes con el
 * sistema canónico de cobro (paymentLinks & clients).
 *
 * Flujo:
 * Hermes Intent / Simulator CTA -> syncLeadAsClient -> requireCommercialOffer -> paymentLinks (Draft) -> Discord Alert
 */

import { db } from '@/db';
import { paymentLinks, clients } from '@/db/schema';
import { syncLeadAsClient } from '@/actions/leads';
import {
  requireCommercialOffer,
  embedOfferMetadataInDescription,
  type OfferLinkMetadata,
} from './offers';
import { sendPaymentNotification } from '@/lib/discord/notifier';

export interface HermesProposalInput {
  offerId: string;
  email?: string;
  name?: string;
  phone?: string;
  whatsapp?: string;
  companyName?: string;
  source?: 'hermes' | 'simulator' | 'api' | 'whatsapp';
  attributionRep?: string;
  notes?: string;
  /**
   * Si es true, el link se crea activo de inmediato para cobro directo.
   * Si es false (default), se crea como borrador para aprobación HITL del admin.
   */
  autoActivate?: boolean;
}

export interface HermesProposalResult {
  success: boolean;
  linkId?: string;
  payUrl?: string;
  clientId?: string;
  offer?: {
    id: string;
    title: string;
    amount: string;
    currency: string;
  };
  error?: string;
}

export async function proposeHermesCommercialOffer(
  input: HermesProposalInput
): Promise<HermesProposalResult> {
  try {
    const {
      offerId,
      email,
      name,
      phone,
      whatsapp,
      companyName,
      source = 'hermes',
      attributionRep,
      notes,
      autoActivate = false,
    } = input;

    if (!email && !whatsapp && !phone) {
      return { success: false, error: 'Se requiere al menos un canal de contacto (email o teléfono).' };
    }

    // 1. Resolver la oferta de forma estricta (fail-closed)
    const offer = requireCommercialOffer(offerId);

    // 2. Sincronizar o crear el Cliente en la base de datos canónica
    const cleanEmail = email ? email.toLowerCase().trim() : undefined;
    const cleanPhone = phone || whatsapp;

    const syncRes = await syncLeadAsClient({
      name: name || (companyName ? `Contacto ${companyName}` : 'Prospecto Hermes'),
      email: cleanEmail,
      phone: cleanPhone,
      whatsapp: cleanPhone,
      source: `hermes_${source}`,
      notes: notes || `Propuesta creada para oferta: ${offer.title}`,
      metadata: {
        companyName,
        attributionRep,
        initialOfferId: offer.id,
      },
    });

    if (!syncRes.success) {
      return { success: false, error: syncRes.error || 'Error al sincronizar el prospecto.' };
    }

    // Buscar el client id generado/actualizado
    const clientRecord = await db.query.clients.findFirst({
      where: (c, { or, eq }) =>
        or(
          cleanEmail ? eq(c.email, cleanEmail) : undefined,
          cleanPhone ? eq(c.whatsapp, cleanPhone) : undefined
        ),
    });

    if (!clientRecord) {
      return { success: false, error: 'No se pudo resolver el registro del cliente.' };
    }

    // 3. Preparar los metadatos estructurados
    const metadata: OfferLinkMetadata = {
      offerId: offer.id,
      source,
      attributionRep,
      fulfillmentType: offer.fulfillmentType,
      productKey: offer.productKey,
      planKey: offer.planKey,
      tier: offer.tier,
      clientRequestedAt: new Date().toISOString(),
      rawNotes: notes,
    };

    const structuredDescription = embedOfferMetadataInDescription(
      offer.fullDescription,
      metadata
    );

    // 4. Crear el Payment Link formal
    const [newLink] = await db
      .insert(paymentLinks)
      .values({
        clientId: clientRecord.id,
        title: offer.title,
        description: structuredDescription,
        amount: offer.amount,
        currency: offer.currency,
        methods: offer.defaultMethods,
        isActive: autoActivate,
        createdBy: attributionRep ? `rep:${attributionRep}` : 'hermes_agent',
      })
      .returning();

    if (!newLink) {
      return { success: false, error: 'Error al persistir el enlace de cobro.' };
    }

    const payUrl = `/pay/${newLink.id}`;

    // 5. Notificar a operaciones/Discord de la propuesta generada
    try {
      await sendPaymentNotification({
        type: 'payment_received',
        amount: Number(offer.amount),
        currency: offer.currency,
        method: 'wire',
        status: 'pending',
        linkId: newLink.id,
        clientId: clientRecord.id,
        metadata: {
          proposalCreated: true,
          offerId: offer.id,
          offerTitle: offer.title,
          prospectEmail: cleanEmail,
          prospectName: name,
          attributionRep: attributionRep || 'Directo',
          status: autoActivate ? 'ACTIVO_PARA_COBRO' : 'PENDIENTE_APROBACION_ADMIN',
          message: `Propuesta Hermes generada: ${offer.title} ($${offer.amount} ${offer.currency})`,
        },
      });
    } catch (discordErr) {
      console.warn('[HermesCommerce] Non-fatal notification error:', discordErr);
    }

    return {
      success: true,
      linkId: newLink.id,
      payUrl,
      clientId: clientRecord.id,
      offer: {
        id: offer.id,
        title: offer.title,
        amount: offer.amount,
        currency: offer.currency,
      },
    };
  } catch (err: any) {
    console.error('[HermesCommerce] Error proposing offer:', err);
    return {
      success: false,
      error: err.message || 'Error interno al generar la propuesta comercial.',
    };
  }
}

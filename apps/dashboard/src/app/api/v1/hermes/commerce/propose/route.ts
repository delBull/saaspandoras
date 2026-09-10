import { NextResponse } from 'next/server';
import { proposeHermesCommercialOffer } from '@/lib/commercial/hermes-commerce-service';
import { getCommercialOffer } from '@/lib/commercial/offers';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Cuerpo de solicitud inválido.' },
        { status: 400 }
      );
    }

    const {
      offerId,
      email,
      name,
      phone,
      whatsapp,
      companyName,
      source = 'simulator',
      attributionRep,
      notes,
      autoActivate = false,
    } = body;

    if (!offerId) {
      return NextResponse.json(
        { success: false, error: 'El campo offerId es obligatorio.' },
        { status: 400 }
      );
    }

    if (!email && !phone && !whatsapp) {
      return NextResponse.json(
        { success: false, error: 'Se requiere al menos un correo o teléfono de contacto.' },
        { status: 400 }
      );
    }

    const offer = getCommercialOffer(offerId);
    if (!offer) {
      return NextResponse.json(
        { success: false, error: `La oferta '${offerId}' no existe o no está activa.` },
        { status: 404 }
      );
    }

    const result = await proposeHermesCommercialOffer({
      offerId,
      email,
      name,
      phone,
      whatsapp,
      companyName,
      source,
      attributionRep,
      notes,
      autoActivate,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 422 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('[API Hermes Commerce Propose] Internal error:', err);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor al procesar la propuesta.' },
      { status: 500 }
    );
  }
}

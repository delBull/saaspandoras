import { NextResponse } from 'next/server';
import { getRoomByPublicId, publicRoomView, verifyDealToken } from "@saasfly/nexus-deals-sdk";
import { getNexusAuthContext } from '@saasfly/shared';

export const dynamic = 'force-dynamic';

/**
 * `GET /api/public/deals/[publicId][?t=<token>]`
 *
 * Devuelve la sala. **Antes entregaba todo a cualquiera**: el `publicId` es
 * `PDR-XXXXXX` (6 caracteres) y por tanto enumerable, así que cualquiera podía
 * leer el contenido de las secciones y los datos de los firmantes (wallet y
 * firma incluidas).
 *
 * Ahora hay dos niveles:
 *  - **Completo** sólo con el token del firmante (el del magic link) o con
 *    sesión de Nexus válida.
 *  - **Mínimo** para el resto: lo que se puede mostrar sin comprometer nada
 *    (tipo, contraparte, estado, si hay NDA y su versión).
 */
export async function GET(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;

  try {
    const room = await getRoomByPublicId(publicId);
    if (!room) {
      return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 });
    }

    const token = new URL(request.url).searchParams.get('t') ?? '';
    const payload = token ? verifyDealToken(token) : null;
    const hasValidToken = Boolean(payload && payload.sub === publicId);

    let hasSession = false;
    if (!hasValidToken) {
      try {
        const auth = await getNexusAuthContext(request.headers);
        hasSession = Boolean(auth.isAuthenticated);
      } catch {
        hasSession = false;
      }
    }

    if (hasValidToken || hasSession) {
      return NextResponse.json({ room: publicRoomView(room) });
    }

    // Vista mínima: sin secciones, sin firmantes, sin firmas ni wallets.
    return NextResponse.json({
      room: {
        publicId: room.publicId,
        kind: room.kind,
        counterparty: room.counterparty,
        status: room.status,
        ndaEnabled: room.ndaEnabled,
        ndaVersion: room.ndaVersion,
        pofEnabled: room.pofEnabled,
      },
      restricted: true,
      hint: 'Se requiere el enlace personal del firmante o sesión de Nexus para ver el contenido.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error interno' }, { status: 500 });
  }
}

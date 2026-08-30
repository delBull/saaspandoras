import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { verifyUnlockToken } from "@/lib/nexus-deals/tokens";
import { logger } from "./logger";

export interface AdminSession {
  userId: string;
  address: string;
  isVerified: boolean;
}

/**
 * Valida la sesión de administrador y devuelve los datos de la misma.
 * Si falla, devuelve una respuesta de error.
 */
export async function validateAdminSession(reqHeaders?: Headers): Promise<{ session?: AdminSession; errorResponse?: NextResponse }> {
  const requestId = logger.generateRequestId();
  const actualHeaders = reqHeaders || await headers();
  
  try {
    const clientWallet = actualHeaders.get('x-thirdweb-address') || 
                         actualHeaders.get('x-wallet-address') || 
                         actualHeaders.get('x-user-address') || 
                         undefined;

    const { session, isVerified } = await getAuth(actualHeaders, clientWallet);
    const address = (clientWallet && /^0x[a-fA-F0-9]{40}$/.test(clientWallet)) 
      ? clientWallet.toLowerCase() 
      : session?.address?.toLowerCase();

    if (!isVerified || !address) {
      logger.warn({
        requestId,
        event: "AUTH_UNAUTHORIZED",
        status: "error",
        metadata: { hasSession: !!session, isVerified }
      });
      return { 
        errorResponse: NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 }) 
      };
    }

    const authorized = await isAdmin(address);
    if (!authorized) {
      logger.warn({
        requestId,
        event: "AUTH_FORBIDDEN",
        status: "error",
        metadata: { address, isVerified }
      });
      return { 
        errorResponse: NextResponse.json({ error: "Forbidden", requestId }, { status: 403 }) 
      };
    }

    return { 
      session: { 
        userId: address.toLowerCase(), 
        address: address.toLowerCase(), 
        isVerified 
      } 
    };
  } catch (error) {
    logger.error({
      requestId,
      event: "AUTH_CRITICAL_ERROR",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown auth error"
    });
    return { 
      errorResponse: NextResponse.json({ error: "Internal Server Error during Auth", requestId }, { status: 500 }) 
    };
  }
}

/**
 * Autoriza la consola del Deal Room (Nivel 2).
 * Acepta sesión de administrador O token de desbloqueo HMAC
 * (enlace único del webhook de Discord, 2h de validez).
 */
export async function validateDealRoomAccess(
  request: Request
): Promise<{ session?: AdminSession; errorResponse?: NextResponse }> {
  const admin = await validateAdminSession(request.headers);
  if (admin.session) return admin;

  const url = new URL(request.url);
  const unlock = url.searchParams.get("unlock");
  if (typeof unlock === "string" && unlock && (await verifyUnlockToken(unlock))) {
    return { session: { userId: "unlock-token", address: "unlock-token", isVerified: true } };
  }

  return {
    errorResponse: NextResponse.json({ error: "Unauthorized", requestId: "unlock-or-admin-required" }, { status: 401 }),
  };
}

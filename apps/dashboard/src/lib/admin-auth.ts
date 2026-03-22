import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
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
    const { session, isVerified } = await getAuth(actualHeaders);
    const address = session?.address || session?.userId;

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

    const authorized = await isAdmin(address, isVerified);
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

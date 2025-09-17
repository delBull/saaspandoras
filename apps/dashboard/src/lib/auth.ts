import { db } from "~/db";
import { administrators } from "~/db/schema";
import { eq } from "drizzle-orm";

import { SUPER_ADMIN_WALLET } from "./constants";

export async function isAdmin(address: string | null | undefined): Promise<boolean> {
  if (!address) {
    return false;
  }
  const lowerCaseAddress = address.toLowerCase();

  // El Super Admin siempre tiene acceso.
  if (lowerCaseAddress === SUPER_ADMIN_WALLET) {
    return true;
  }

  // Consultar la base de datos para otros administradores.
  const adminRecord = await db.query.administrators.findFirst({
    where: eq(administrators.walletAddress, lowerCaseAddress),
  });

  return !!adminRecord;
}

export function getAuth(headers?: Headers) {
  // Intenta obtener wallet de Thirdweb desde cookies (si el frontend la guarda)
  let userAddress: string | null = null;
  
  const cookieString = headers?.get('cookie');
  if (cookieString) {
    const thirdwebAuthCookie = cookieString.split(';').find(c => c.trim().startsWith('thirdweb_auth_token='));
    if (thirdwebAuthCookie) {
      const token = thirdwebAuthCookie.split('=')[1];
      if (token) {
        try {
          // Decodificar el JWT (sin verificar la firma, solo para obtener el payload)
          const payloadBase64 = token.split('.')[1];
          if (payloadBase64) {
            const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
            const payload = JSON.parse(payloadJson) as { sub?: string };
            userAddress = payload.sub ?? null;
          }
        } catch (e) {
          console.warn('Could not decode thirdweb auth token:', e);
        }
      }
    }
  }
  
  // --- SOLUCIÓN: Fallback de Desarrollo ---
  // Si no se encuentra una sesión en las cookies y estamos en desarrollo,
  // se asume la wallet del Super Admin para facilitar las pruebas.
  if (!userAddress && process.env.NODE_ENV === 'development') {
    userAddress = SUPER_ADMIN_WALLET;
  }
  
  return {
    session: {
      userId: userAddress,
      address: userAddress
    }
  };
}

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
  let userAddress: string | null = null;

  // Método 1: Intentar desde cookies (desarrollo)
  const cookieString = headers?.get('cookie');
  if (cookieString) {
    const thirdwebCookie = cookieString.split(';').find(c => c.trim().startsWith('thirdweb') || c.includes('wallet'));
    if (thirdwebCookie) {
      const match = thirdwebCookie.match(/address=([^;]+)/);
      if (match?.[1]) {
        userAddress = match[1].toLowerCase();
      }
    }
  }

  // Método 2: Intentar desde headers de Thirdweb (producción - X-Thirdweb-Address)
  if (!userAddress) {
    userAddress = headers?.get('x-thirdweb-address') || null;
  }

  // Método 3: Fallback solo para desarrollo
  if (!userAddress && process.env.NODE_ENV === 'development') {
    userAddress = SUPER_ADMIN_WALLET;
  }

  // Si aún no tenemos dirección, no hay sesión
  if (!userAddress) {
    return {
      session: null
    };
  }

  return {
    session: {
      userId: userAddress,
      address: userAddress
    }
  };
}

import { db } from "~/db";
import { administrators } from "~/db/schema";
import { eq } from "drizzle-orm";
import { SUPER_ADMIN_WALLET } from "./constants";

interface MinimalHeaders {
  get(name: string): string | null;
}
// ------------------------------------------

export async function isAdmin(address: string | null | undefined): Promise<boolean> {
  if (!address) {
    console.log('isAdmin: No address provided');
    return false;
  }
  const lowerCaseAddress = address.toLowerCase();
  console.log('isAdmin: Checking address', lowerCaseAddress);
  console.log('isAdmin: SUPER_ADMIN_WALLET', SUPER_ADMIN_WALLET);

  // El Super Admin siempre tiene acceso.
  if (lowerCaseAddress === SUPER_ADMIN_WALLET) {
    console.log('isAdmin: SUPER_ADMIN match');
    return true;
  }

  // Consultar la base de datos para otros administradores.
  const adminRecord = await db.query.administrators.findFirst({
    where: eq(administrators.walletAddress, lowerCaseAddress),
  });
  console.log('isAdmin: DB admin record', adminRecord);

  return !!adminRecord;
}

export function getAuth(headers?: MinimalHeaders) {
  console.log('🔍 getAuth: Starting authentication check');
  let userAddress: string | null = null;

  // Método 1: Intentar desde cookies (desarrollo)
  const cookieString = headers?.get('cookie');
  console.log('🍪 getAuth: Cookie string:', cookieString);

  if (cookieString) {
    const thirdwebCookie = cookieString.split(';').find((c: string) => c.trim().startsWith('thirdweb') || c.includes('wallet'));
    console.log('🎯 getAuth: Thirdweb cookie found:', thirdwebCookie);

    if (thirdwebCookie) {
      const match = thirdwebCookie.match(/address=([^;]+)/);
      console.log('📋 getAuth: Cookie address match:', match?.[1]);

      if (match?.[1]) {
        userAddress = match[1].toLowerCase();
        console.log('✅ getAuth: Address from cookies:', userAddress);
      }
    }
  }

  // Método 2: Intentar desde headers de Thirdweb (producción)
  if (!userAddress) {
    // Headers comunes que Thirdweb podría usar
    const headerSources = {
      'x-thirdweb-address': headers?.get('x-thirdweb-address'),
      'wallet-address': headers?.get('wallet-address'),
      'x-wallet-address': headers?.get('x-wallet-address'),
      'account': headers?.get('account'),
      'address': headers?.get('address'),
    };

    // Mostrar todos los posibles headers
    console.log('📡 getAuth: Available headers:', Object.entries(headerSources).filter(([_key, value]) => value).map(([key, value]) => `${key}: ${value}`));

    // Intentar encontrar una dirección en cualquier header
    userAddress = headerSources['x-thirdweb-address'] ??
                  headerSources['wallet-address'] ??
                  headerSources['x-wallet-address'] ??
                  headerSources.account ??
                  headerSources.address ??
                  null;

    if (userAddress) {
      userAddress = userAddress.toLowerCase();
      console.log('✅ getAuth: Address found in headers:', userAddress);

      // Verificar si es la SUPER_ADMIN
      if (userAddress === SUPER_ADMIN_WALLET) {
        console.log('🎯 getAuth: SUPER_ADMIN wallet detected!');
      }
    }
  }

  // Método 3: SOLO fallback para desarrollo - JAMÁS permitir en producción
  if (!userAddress && process.env.NODE_ENV === 'development') {
    console.log('⚠️ getAuth: Development mode - using SUPER_ADMIN fallback');
    userAddress = SUPER_ADMIN_WALLET;
  }

  // Si aún no tenemos dirección, no hay sesión
  if (!userAddress) {
    console.log('❌ getAuth: No address found, returning null session');
    return {
      session: null
    };
  }

  console.log('🎉 getAuth: Success - Session:', {
    userId: userAddress,
    address: userAddress
  });

  return {
    session: {
      userId: userAddress,
      address: userAddress
    }
  };
}

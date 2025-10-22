import { db } from "~/db";
import { administrators } from "~/db/schema";
import { eq } from "drizzle-orm";
import { SUPER_ADMIN_WALLET } from "./constants";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { sanitizeLogData } from "./security-utils";

interface JWTPayload {
  userId?: string;
  sub?: string;
  username?: string;
  avatar?: string;
  ownerId?: string;
  aud?: string;
  iat?: number;
  exp?: number;
}

/**
 * Comprueba si una dirección es admin o super admin.
 */
export async function isAdmin(address?: string | null): Promise<boolean> {
  if (!address) {
    // Only log in development and reduce verbosity
    if (process.env.NODE_ENV === 'development') {
      console.log("🛑 isAdmin: No address provided");
    }
    return false;
  }

  const lower = address.toLowerCase();

  // 📍 Step 1: Check if super admin
  const isSuperAdminCheck = lower === SUPER_ADMIN_WALLET.toLowerCase();

  if (isSuperAdminCheck) {
    if (process.env.NODE_ENV === 'development') {
      console.log("🎉 isAdmin: ✅ SUPER ADMIN CONFIRMED");
    }
    return true;
  }

  try {
    // 📍 Step 2: Database check for regular admin
    const result = await db
      .select()
      .from(administrators)
      .where(eq(administrators.walletAddress, lower));

    const isAdmin = result.length > 0;

    // Only log in development and only for important cases
    if (process.env.NODE_ENV === 'development' && isAdmin) {
      console.log("✅ isAdmin: Regular admin confirmed");
    }

    return isAdmin;
  } catch (error) {
    console.error("💥 isAdmin: Database query FAILED:", error);
    // If database query fails, fall back to super admin check only
    return isSuperAdminCheck;
  }
}

interface MinimalHeaders {
  get(name: string): string | null;
  has(name: string): boolean;
  entries(): IterableIterator<[string, string]>;
}

/**
 * Obtiene la sesión autenticada del usuario en Thirdweb v5.
 * En producción, lee desde headers primero, luego cookies.
 */
export async function getAuth(headers?: MinimalHeaders, userAddress?: string) {
  let address: string | null = userAddress ?? null;

  // Primero intentar desde headers (para server-side auth)
  if (headers) {
    try {
      // Basic headers access - compatible with both Node.js and Edge runtime
      // Try multiple header names in case Vercel filters some
      const headerAddress = headers.get('x-thirdweb-address') ??
                          headers.get('x-wallet-address') ??
                          headers.get('x-user-address') ??
                          headers.get('x-address');
      if (headerAddress) {
        address = headerAddress;
        console.log('✅ [Auth] Found address in headers:', address.substring(0, 10) + '...');
      }
    } catch (error) {
      console.error('Error accessing headers:', error);
      // Continue to cookie fallback
    }
  }

  // Si no se encontro en headers, intentar cookies
  if (!address) {
    try {
      // Intentar obtener desde cookies - this works in both runtimes
      const cookieStore = await cookies();

      // First try the simple wallet-address cookie
      address = cookieStore.get('wallet-address')?.value ?? null;

      // If not found, try ThirdWeb specific cookies
      if (!address) {
        address = cookieStore.get('thirdweb:wallet-address')?.value ?? null;
      }

      // If not found, try other possible cookie names
      if (!address) {
        const allCookies = cookieStore.getAll();
        const walletCookie = allCookies.find(cookie =>
          cookie.name.includes('wallet') &&
          cookie.name.includes('address') &&
          cookie.value &&
          cookie.value.startsWith('0x') &&
          cookie.value.length === 42
        );
        if (walletCookie) {
          address = walletCookie.value;
        }
      }

      // If not found, try to decode the JWT token
      if (!address) {
        const jwtToken = cookieStore.get('_vercel_jwt')?.value;
        if (jwtToken) {
          try {
            console.log('🔍 [Auth] Attempting to decode JWT token');
            const decoded = jwt.decode(jwtToken) as JWTPayload | null;
            if (decoded) {
              console.log('🔍 [Auth] JWT decoded payload:', sanitizeLogData({
                userId: decoded.userId?.substring(0, 10) + '...',
                sub: decoded.sub?.substring(0, 10) + '...',
                username: decoded.username
              }));

              // The userId in the JWT is NOT the wallet address - it's an internal Thirdweb identifier
              // We need to find the actual wallet address associated with this user
              // For now, return null and let the application handle this case
              console.log('❌ [Auth] JWT userId is not a wallet address:', decoded.userId);
              address = null;

              if (address) {
                console.log('✅ [Auth] Successfully extracted address from JWT:', address);
              } else {
                console.log('❌ [Auth] No address found in JWT payload');
              }
            } else {
              console.log('❌ [Auth] Failed to decode JWT token');
            }
          } catch (jwtError) {
            console.error('❌ [Auth] Error decoding JWT:', jwtError);
          }
        } else {
          // Only log in development and reduce frequency
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ [Auth] No JWT token found in cookies');
          }
        }
      }

      if (address) {
        console.log('✅ [Auth] Found address in cookies:', address.substring(0, 10) + '...');
      }
    } catch (error) {
      console.error('Error accessing cookies:', error);
    }
  }

  // Log final result for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('🏠 [Auth] Final session result:', {
      hasAddress: !!address,
      address: address ? address.substring(0, 10) + '...' : null,
      userId: address ? address.toLowerCase().substring(0, 10) + '...' : null
    });
  }

  return {
    session: {
      userId: address ? address.toLowerCase() : null,
      address: address ? address.toLowerCase() : null,
    },
  };
}

/**
 * Función helper para validar direcciones de wallet desde el cliente
 * Esta debe ser llamada desde componentes del cliente
 */
export function validateWalletAddress(address: string | undefined | null): boolean {
  if (!address) return false;

  // Validar que sea una dirección Ethereum válida
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

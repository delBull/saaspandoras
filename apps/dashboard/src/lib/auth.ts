import { db } from "~/db";
import { administrators } from "~/db/schema";
import { eq } from "drizzle-orm";
import { SUPER_ADMIN_WALLET } from "./constants";
import { cookies } from "next/headers";

/**
 * Comprueba si una dirección es admin o super admin.
 */
export async function isAdmin(address?: string | null): Promise<boolean> {
  if (!address) {
    if (process.env.NODE_ENV === "development") {
      console.log("isAdmin: No address provided");
    }
    return false;
  }

  const lower = address.toLowerCase();
  if (process.env.NODE_ENV === "development") {
    console.log("isAdmin: Checking", lower);
  }

  if (lower === SUPER_ADMIN_WALLET.toLowerCase()) return true;

  try {
    console.log("isAdmin: Querying database for address:", lower);
    const result = await db
      .select()
      .from(administrators)
      .where(eq(administrators.walletAddress, lower));

    console.log("isAdmin: Database result:", result.length, "rows found");
    return result.length > 0;
  } catch (error) {
    console.error("isAdmin: Database query failed:", error);
    // If database query fails, fall back to false
    return false;
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
    const headerAddress = headers.get('x-thirdweb-address');
    if (headerAddress) {
      address = headerAddress;
    }
  }

  // Si no se encontro en headers, intentar cookies
  if (!address) {
    try {
      // Intentar obtener desde cookies
      const cookieStore = await cookies();
      address = cookieStore.get('wallet-address')?.value ?? null;
    } catch {
      // Silently ignore cookie access errors
    }
  }

  return {
    session: {
      userId: address,
      address: address,
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

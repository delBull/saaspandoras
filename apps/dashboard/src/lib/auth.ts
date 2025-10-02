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
    console.log("🛑 isAdmin DEBUG: No address provided");
    return false;
  }

  const lower = address.toLowerCase();
  console.log("🔍 isAdmin DEBUG: Checking address:", lower.substring(0, 10) + "...");

  // 📍 Step 1: Check if super admin
  const isSuperAdminCheck = lower === SUPER_ADMIN_WALLET.toLowerCase();
  console.log("👑 isAdmin DEBUG: Super admin check result:", isSuperAdminCheck);

  if (isSuperAdminCheck) {
    console.log("🎉 isAdmin DEBUG: ✅ SUPER ADMIN CONFIRMED");
    return true;
  }

  console.log("🔍 isAdmin DEBUG: Checking database for regular admin");

  try {
    // 📍 Step 2: Database check for regular admin
    const result = await db
      .select()
      .from(administrators)
      .where(eq(administrators.walletAddress, lower));

    const isAdmin = result.length > 0;
    console.log("📊 isAdmin DEBUG: Database result:", result.length, "admin records found");
    console.log("✅ isAdmin DEBUG: FINAL RESULT:", isAdmin, "(super admin:", isSuperAdminCheck, ")");

    return isAdmin;
  } catch (error) {
    console.error("💥 isAdmin DEBUG: Database query FAILED:", error);
    // If database query fails, fall back to false
    console.log("🚫 isAdmin DEBUG: FALLBACK to false due to database error");
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
    try {
      // Basic headers access - compatible with both Node.js and Edge runtime
      const headerAddress = headers.get('x-thirdweb-address');
      if (headerAddress) {
        address = headerAddress;
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
      address = cookieStore.get('wallet-address')?.value ?? null;
    } catch (error) {
      console.error('Error accessing cookies:', error);
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

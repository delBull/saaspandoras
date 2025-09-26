import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "~/db";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { administrators } from "~/db/schema";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

  // Super admins hardcodeados que aparecen en la UI
  const SUPER_ADMINS = [
    {
      id: 999,
      wallet_address: SUPER_ADMIN_WALLET.toLowerCase(),
      alias: "Super Admin",
      role: "admin",
      added_by: "system",
      created_at: new Date("2024-01-01T00:00:00.000Z"),
      updated_at: new Date("2024-01-01T00:00:00.000Z")
    }
  ];

const addAdminSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección de wallet inválida."),
  alias: z.string().max(100, "El alias no puede tener más de 100 caracteres.").optional(),
});

export async function GET() {
  const { session } = await getAuth(await headers());

  if (!await isAdmin(session?.userId)) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const dbAdmins = await db.query.administrators.findMany();
  // Combinar admins de BD con super admins hardcodeados
  const allAdmins = [...SUPER_ADMINS, ...dbAdmins];
  return NextResponse.json(allAdmins);
}

/**
 * POST /api/admin/administrators
 * Añade un nuevo administrador.
 * Solo accesible por el Super Admin.
 */
export async function POST(request: Request) {
  const { session } = await getAuth(await headers());

  if (session?.userId?.toLowerCase() !== SUPER_ADMIN_WALLET) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  // Verificación de seguridad para asegurar que la sesión es válida
  if (!session.userId) {
    return NextResponse.json({ message: "Sesión no válida" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const validation = addAdminSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ message: "Datos inválidos", errors: validation.error.flatten() }, { status: 400 });
  }

  const newAddress = validation.data.walletAddress.toLowerCase();

  try {
    const [newAdmin] = await db.insert(administrators).values({
      walletAddress: newAddress,
      alias: validation.data.alias?.trim() ?? null, // Save the alias, trimmed or null
      addedBy: session.userId, // Guardamos quién lo añadió
    }).returning();

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error) {
    console.error("Error al añadir administrador:", error);
    // Manejar error de duplicado (código 23505 en PostgreSQL para unique_violation)
    return NextResponse.json({ message: "Esta wallet ya es un administrador o hubo un error." }, { status: 409 });
  }
}

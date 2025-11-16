import { db } from "~/db";
import { NextResponse } from "next/server";
import { z } from "zod";
import { administrators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSuperAdminWallet } from "@/lib/constants";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";

// Database connection helper - only used at runtime

const updateAliasSchema = z.object({
  alias: z.string().max(100, "El alias no puede tener más de 100 caracteres.").optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const contextParams = await params;
  const { session } = await getAuth(await headers());

  if (session?.userId?.toLowerCase() !== getSuperAdminWallet()) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const adminId = parseInt(contextParams.id, 10);
  if (isNaN(adminId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  const body: unknown = await request.json();
  const validation = updateAliasSchema.safeParse(body);

  if (!validation.success) {
    return NextResponse.json({ message: "Datos inválidos", errors: validation.error.flatten() }, { status: 400 });
  }

  try {
    const [updatedAdmin] = await db.update(administrators)
      .set({ alias: validation.data.alias?.trim() ?? null })
      .where(eq(administrators.id, adminId))
      .returning();

    if (!updatedAdmin) {
      return NextResponse.json({ message: "Administrador no encontrado" }, { status: 404 });
    }

    return NextResponse.json(updatedAdmin);
  } catch (error) {
    console.error("Error al actualizar alias:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const contextParams = await params;
  const { session } = await getAuth(await headers());

  if (session?.userId?.toLowerCase() !== getSuperAdminWallet()) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const adminId = parseInt(contextParams.id, 10);
  if (isNaN(adminId)) {
    return NextResponse.json({ message: "ID inválido" }, { status: 400 });
  }

  // --- AÑADIDO: Verificación de seguridad para no eliminar al Super Admin ---
  const adminToDelete = await db.query.administrators.findFirst({
    where: eq(administrators.id, adminId),
  });

  if (adminToDelete?.walletAddress.toLowerCase() === getSuperAdminWallet()) {
    return NextResponse.json(
      { message: "No se puede eliminar al Super Administrador." },
      { status: 403 }
    );
  }

  const [deletedAdmin] = await db.delete(administrators).where(eq(administrators.id, adminId)).returning();

  if (!deletedAdmin) {
    return NextResponse.json({ message: "Administrador no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ message: "Administrador eliminado exitosamente" });
}


import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "~/db";
import { administrators } from "~/db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const contextParams = await params;
  const headersList = await headers();
  const { session } = getAuth(await headersList);

  if (session?.userId?.toLowerCase() !== SUPER_ADMIN_WALLET) {
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

  if (adminToDelete?.walletAddress.toLowerCase() === SUPER_ADMIN_WALLET) {
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

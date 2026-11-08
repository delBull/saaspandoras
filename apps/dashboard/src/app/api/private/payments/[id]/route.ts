import { NextRequest, NextResponse } from "next/server";
import { db } from "@saasfly/db-core";
import { privatePaymentLinks } from "@saasfly/db-core";
import { eq } from "@saasfly/db-core";
import { resolvePrivateAdmin } from "@/lib/private-admin";

export const runtime = "nodejs";

/**
 * DELETE /api/private/payments/[id]
 *
 * Elimina un link de cobro de la Terminal Privada (limpieza de enlaces que
 * quedaron sin acción).
 *
 * Reglas (fail-closed):
 *  - Sólo SUPER_ADMIN/ADMIN (misma autoridad que la creación).
 *  - NUNCA se elimina un cobro `completed`: es evidencia de un pago real.
 *  - Idempotente desde el punto de vista del usuario: si ya no existe → 404 claro.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await resolvePrivateAdmin(req);
  if (errorResponse) return errorResponse;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing link ID" }, { status: 400 });
  }

  try {
    const [link] = await db
      .select({ id: privatePaymentLinks.id, status: privatePaymentLinks.status })
      .from(privatePaymentLinks)
      .where(eq(privatePaymentLinks.id, id))
      .limit(1);

    if (!link) {
      return NextResponse.json({ error: "El link ya no existe." }, { status: 404 });
    }

    if (link.status === "completed") {
      return NextResponse.json(
        {
          error:
            "No se puede eliminar un cobro pagado: es evidencia contable. Sólo se pueden borrar links sin pago completado.",
          code: "PAID_LINK_PROTECTED",
        },
        { status: 409 }
      );
    }

    await db.delete(privatePaymentLinks).where(eq(privatePaymentLinks.id, id));

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: unknown) {
    console.error("[PrivatePayments API] Error deleting link:", error);
    return NextResponse.json({ error: "No se pudo eliminar el link." }, { status: 500 });
  }
}

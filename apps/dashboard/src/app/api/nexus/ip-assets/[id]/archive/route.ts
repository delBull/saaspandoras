import { NextRequest, NextResponse } from "next/server";
import { checkNexusPermission, getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db";
import { nexusIpAssets } from "@saasfly/db/schema";
import { and, eq, isNull } from "@saasfly/db-core";
import { UUID_REGEX } from "@/lib/nexus/ip-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `POST /api/nexus/ip-assets/[id]/archive` — borrado lógico.
 *
 * No existe DELETE: un activo archivado conserva su historial (expediente,
 * riesgo, notas). Se puede volver a listar con `?includeArchived=true`.
 * Autoridad: sesión + capability/rol, y `canonical_org_id` desde la sesión.
 */

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return fail(400, "INVALID_ID", "El identificador del activo no es válido.");
  }

  try {
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated) return fail(401, "UNAUTHORIZED", "Sesión de Nexus requerida.");
    const orgId = auth.canonicalOrgId;
    if (!orgId) return fail(409, "ORG_UNRESOLVED", "Tu identidad no tiene una organización asignada.");
    const allowed =
      ADMIN_ROLES.has(String(auth.role ?? "")) || checkNexusPermission(auth, "nexus.manage");
    if (!allowed) return fail(403, "MISSING_CAPABILITY", "Requiere nexus.manage o rol de administración.");

    const [archived] = await db
      .update(nexusIpAssets)
      .set({ archivedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(nexusIpAssets.id, id),
          eq(nexusIpAssets.canonicalOrgId, orgId),
          isNull(nexusIpAssets.archivedAt)
        )
      )
      .returning({ id: nexusIpAssets.id, archivedAt: nexusIpAssets.archivedAt });

    if (!archived) return fail(404, "NOT_FOUND", "Activo no encontrado o ya archivado.");

    return NextResponse.json({ archived: true, asset: archived });
  } catch (error) {
    console.error("[IpAssets] archive error:", error);
    return fail(500, "INTERNAL", "No se pudo archivar el activo.");
  }
}

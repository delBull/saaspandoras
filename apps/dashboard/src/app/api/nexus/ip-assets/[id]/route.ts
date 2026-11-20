import { NextRequest, NextResponse } from "next/server";
import { checkNexusPermission, getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db";
import { nexusIpAssets } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import {
  IP_ASSET_LIMITS,
  IP_PRIORITIES,
  IP_RISKS,
  IP_STATUSES,
  UUID_REGEX,
  normalizeString,
  pickEnum,
} from "@/lib/nexus/ip-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `PATCH /api/nexus/ip-assets/[id]` — actualiza un activo de la organización.
 *
 * - Solo campos permitidos (nunca `canonical_org_id`, `created_by` ni `id`).
 * - Filtra por org + id: un id de otra organización devuelve 404.
 * - No borra: para eso existe `/archive` (borrado lógico).
 */

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return fail(400, "INVALID_ID", "El identificador del activo no es válido.");
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "INVALID_BODY", "El cuerpo no es JSON válido.");
  }

  try {
    const auth = await getNexusAuthContext(req.headers);
    if (!auth.isAuthenticated) return fail(401, "UNAUTHORIZED", "Sesión de Nexus requerida.");
    const orgId = auth.canonicalOrgId;
    if (!orgId) return fail(409, "ORG_UNRESOLVED", "Tu identidad no tiene una organización asignada.");
    const allowed =
      ADMIN_ROLES.has(String(auth.role ?? "")) || checkNexusPermission(auth, "nexus.manage");
    if (!allowed) return fail(403, "MISSING_CAPABILITY", "Requiere nexus.manage o rol de administración.");

    const patch: Record<string, unknown> = { updatedAt: new Date() };

    if (typeof body.name === "string") {
      const name = normalizeString(body.name, IP_ASSET_LIMITS.name);
      if (!name) return fail(400, "INVALID_NAME", "El nombre no puede quedar vacío.");
      patch.name = name;
    }
    const category = normalizeString(body.category, IP_ASSET_LIMITS.category);
    if (category) patch.category = category;
    const classes = normalizeString(body.classes, IP_ASSET_LIMITS.classes);
    if (classes !== null) patch.classes = classes;
    const jurisdiction = normalizeString(body.jurisdiction, IP_ASSET_LIMITS.jurisdiction);
    if (jurisdiction) patch.jurisdiction = jurisdiction;
    const status = pickEnum(body.status, IP_STATUSES);
    if (status) patch.status = status;
    const priority = pickEnum(body.priority, IP_PRIORITIES);
    if (priority) patch.priority = priority;
    const risk = pickEnum(body.risk, IP_RISKS);
    if (risk) patch.risk = risk;
    const riskNotes = normalizeString(body.riskNotes, IP_ASSET_LIMITS.riskNotes);
    if (riskNotes !== null) patch.riskNotes = riskNotes;
    const registryRef = normalizeString(body.registryRef, IP_ASSET_LIMITS.registryRef);
    if (registryRef !== null) patch.registryRef = registryRef;
    const nextAction = normalizeString(body.nextAction, IP_ASSET_LIMITS.nextAction);
    if (nextAction !== null) patch.nextAction = nextAction;

    if (Object.keys(patch).length === 1) {
      return fail(400, "NOTHING_TO_UPDATE", "No hay campos válidos para actualizar.");
    }

    const [updated] = await db
      .update(nexusIpAssets)
      .set(patch)
      .where(and(eq(nexusIpAssets.id, id), eq(nexusIpAssets.canonicalOrgId, orgId)))
      .returning();

    if (!updated) return fail(404, "NOT_FOUND", "Activo no encontrado.");

    return NextResponse.json({ asset: updated });
  } catch (error) {
    console.error("[IpAssets] PATCH error:", error);
    return fail(500, "INTERNAL", "No se pudo actualizar el activo.");
  }
}

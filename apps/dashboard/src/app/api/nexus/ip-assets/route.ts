import { NextRequest, NextResponse } from "next/server";
import { checkNexusPermission, getNexusAuthContext } from "@saasfly/shared";
import { db } from "@saasfly/db";
import { nexusIpAssets } from "@saasfly/db/schema";
import { and, desc, eq, isNull } from "@saasfly/db-core";
import {
  IP_ASSET_LIMITS,
  IP_PRIORITIES,
  IP_RISKS,
  IP_STATUSES,
  normalizeString,
  pickEnum,
} from "@/lib/nexus/ip-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 🏛️ ARCHITECTURE NOTE — Registro de Activos IP
 * =============================================
 * `GET  /api/nexus/ip-assets`  → lista los activos de la organización
 * `POST /api/nexus/ip-assets`  → crea un activo
 *
 * Autoridad (nunca desde el body):
 *   - Sesión Nexus válida (`getNexusAuthContext`).
 *   - Capability `nexus.manage` o rol ADMIN/SUPER_ADMIN.
 *   - `canonical_org_id` **solo** desde la sesión; si falta → 409 (nunca un default).
 *   - `created_by` / `owner_collaborator_id` desde la sesión.
 *
 * Aislamiento: toda consulta filtra por `canonical_org_id`. Un id de otra org
 * devuelve 404 (no se revela su existencia).
 */

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

interface AssetBody {
  name?: unknown;
  category?: unknown;
  classes?: unknown;
  jurisdiction?: unknown;
  status?: unknown;
  priority?: unknown;
  risk?: unknown;
  riskNotes?: unknown;
  registryRef?: unknown;
  nextAction?: unknown;
  ownerCollaboratorId?: unknown;
}

function fail(status: number, code: string, message: string) {
  return NextResponse.json({ error: message, code }, { status });
}

async function authorize(req: NextRequest) {
  const auth = await getNexusAuthContext(req.headers);
  if (!auth.isAuthenticated) {
    return { error: fail(401, "UNAUTHORIZED", "Sesión de Nexus requerida.") };
  }
  const orgId = auth.canonicalOrgId;
  if (!orgId) {
    return { error: fail(409, "ORG_UNRESOLVED", "Tu identidad no tiene una organización asignada.") };
  }
  const allowed =
    ADMIN_ROLES.has(String(auth.role ?? "")) || checkNexusPermission(auth, "nexus.manage");
  if (!allowed) {
    return { error: fail(403, "MISSING_CAPABILITY", "Requiere nexus.manage o rol de administración.") };
  }
  return { auth, orgId };
}

export async function GET(req: NextRequest) {
  try {
    const { error, auth, orgId } = await authorize(req);
    if (error) return error;

    const includeArchived = new URL(req.url).searchParams.get("includeArchived") === "true";

    const rows = await db
      .select()
      .from(nexusIpAssets)
      .where(
        includeArchived
          ? eq(nexusIpAssets.canonicalOrgId, orgId!)
          : and(eq(nexusIpAssets.canonicalOrgId, orgId!), isNull(nexusIpAssets.archivedAt))
      )
      .orderBy(desc(nexusIpAssets.createdAt));

    return NextResponse.json({ assets: rows });
  } catch (error) {
    console.error("[IpAssets] GET error:", error);
    return fail(500, "INTERNAL", "No se pudieron cargar los activos.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, auth, orgId } = await authorize(req);
    if (error) return error;

    let body: AssetBody;
    try {
      body = (await req.json()) as AssetBody;
    } catch {
      return fail(400, "INVALID_BODY", "El cuerpo no es JSON válido.");
    }

    const name = normalizeString(body.name, IP_ASSET_LIMITS.name);
    if (!name) {
      return fail(400, "INVALID_NAME", "El nombre del activo es obligatorio.");
    }

    const status = pickEnum(body.status, IP_STATUSES);
    const risk = pickEnum(body.risk, IP_RISKS);
    const priority = pickEnum(body.priority, IP_PRIORITIES);

    const [created] = await db
      .insert(nexusIpAssets)
      .values({
        canonicalOrgId: orgId!,
        name,
        category: normalizeString(body.category, IP_ASSET_LIMITS.category) ?? "Marca Denominativa",
        classes: normalizeString(body.classes, IP_ASSET_LIMITS.classes),
        jurisdiction: normalizeString(body.jurisdiction, IP_ASSET_LIMITS.jurisdiction) ?? "IMPI (México)",
        status: status ?? "PLANNED",
        priority: priority ?? "MEDIUM",
        risk: risk ?? "LOW",
        riskNotes: normalizeString(body.riskNotes, IP_ASSET_LIMITS.riskNotes),
        registryRef: normalizeString(body.registryRef, IP_ASSET_LIMITS.registryRef),
        nextAction: normalizeString(body.nextAction, IP_ASSET_LIMITS.nextAction),
        createdBy: typeof auth!.collaboratorId === "number" ? auth!.collaboratorId : null,
      })
      .returning();

    return NextResponse.json({ asset: created }, { status: 201 });
  } catch (error) {
    console.error("[IpAssets] POST error:", error);
    return fail(500, "INTERNAL", "No se pudo crear el activo.");
  }
}

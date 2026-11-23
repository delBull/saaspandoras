import { db } from "@saasfly/db";
import { nexusDealPods, nexusOutreachLinks } from "@saasfly/db/schema";
import { and, eq } from "@saasfly/db-core";
import { normalizeCode } from "./pod-auth";

/**
 * Creación de semillas del radar (`/l/<code>`).
 *
 * Fuente única para: alta manual desde el Deal Pod y aprobación de un prospecto
 * recolectado. La autorización NO vive aquí: el llamador ya resolvió identidad y
 * organización; esta función sólo verifica que el pod pertenezca a esa org.
 */

export const OUTREACH_DOORS = new Set([
  "CONSOLIDATOR",
  "BROKER",
  "PATIENT_CAPITAL",
  "SOVEREIGN",
  "MX_FAMILY",
]);

export function radarBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "https://nexus.pandoras.finance").replace(/\/$/, "");
}

export interface CreateOutreachLinkInput {
  podId: string;
  orgId: string;
  targetLabel: string;
  targetOrg?: string | null;
  targetRole?: string | null;
  door?: string | null;
  code?: string | null;
}

export type CreateOutreachLinkResult =
  | { ok: true; link: typeof nexusOutreachLinks.$inferSelect; url: string }
  | { ok: false; status: number; error: string };

function clean(value: unknown, max = 255): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function createOutreachLink(
  input: CreateOutreachLinkInput,
): Promise<CreateOutreachLinkResult> {
  const [pod] = await db
    .select({ id: nexusDealPods.id })
    .from(nexusDealPods)
    .where(and(eq(nexusDealPods.id, input.podId), eq(nexusDealPods.canonicalOrgId, input.orgId)))
    .limit(1);

  if (!pod) return { ok: false, status: 404, error: "Pod no encontrado." };

  const targetLabel = clean(input.targetLabel);
  if (!targetLabel) return { ok: false, status: 400, error: "El objetivo es obligatorio." };

  const code = normalizeCode(input.code) ?? normalizeCode(targetLabel);
  if (!code) return { ok: false, status: 400, error: "No se pudo derivar un código válido." };

  const door = input.door && OUTREACH_DOORS.has(input.door) ? input.door : null;

  try {
    const [link] = await db
      .insert(nexusOutreachLinks)
      .values({
        podId: pod.id,
        code,
        door,
        targetLabel,
        targetOrg: clean(input.targetOrg),
        targetRole: clean(input.targetRole),
      })
      .returning();

    if (!link) return { ok: false, status: 500, error: "No se pudo crear la semilla." };
    return { ok: true, link, url: `${radarBaseUrl()}/l/${link.code}` };
  } catch (error) {
    if (String((error as { code?: string }).code) === "23505") {
      return { ok: false, status: 409, error: "Ese código de link ya existe." };
    }
    console.error("[outreach] no se pudo crear el link:", error);
    return { ok: false, status: 500, error: "No se pudo crear la semilla." };
  }
}

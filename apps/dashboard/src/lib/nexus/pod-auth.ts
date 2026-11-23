import { NextResponse } from "next/server";
import { getNexusAuthContext } from "@saasfly/shared";

/**
 * Autoridad de los Deal Pods.
 *
 * El pod no es un tenant: se aísla por `pod_id` y por `canonical_org_id` de la
 * sesión. Solo el propietario (OWNER), SUPER_ADMIN o quien tenga `permissions.all`
 * puede crear o modificar pods.
 *
 * Este módulo es deliberadamente independiente para poder reutilizarlo desde una
 * API externa (otro tenant o un worker) sin duplicar la regla.
 */
export type PodActor = {
  collaboratorId: string | null;
  email: string | null;
  canonicalOrgId: string;
  isOwner: boolean;
};

export async function requirePodActor(): Promise<
  { actor: PodActor; error?: undefined } | { actor?: undefined; error: NextResponse }
> {
  const auth = await getNexusAuthContext();
  if (!auth.isAuthenticated) {
    return { error: NextResponse.json({ error: "Sesión de Nexus requerida." }, { status: 401 }) };
  }

  const permissions = (auth.permissions ?? {}) as unknown as Record<string, unknown>;
  const role = String(auth.role ?? "");
  const isOwner = role === "SUPER_ADMIN" || role === "OWNER" || permissions.all === true;
  if (!isOwner) {
    return { error: NextResponse.json({ error: "Solo el propietario o SUPER_ADMIN." }, { status: 403 }) };
  }

  return {
    actor: {
      collaboratorId: auth.collaboratorId ? String(auth.collaboratorId) : null,
      email: auth.email ?? null,
      canonicalOrgId: (auth.canonicalOrgId as string) ?? "pandoras",
      isOwner,
    },
  };
}

/** Código de URL seguro: minúsculas, guiones, 3–48 caracteres. */
export function normalizeCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return code.length >= 3 ? code : null;
}

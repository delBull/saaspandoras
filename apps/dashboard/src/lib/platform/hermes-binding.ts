import { db } from "@/db";
import { installedProducts } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { HermesBindingInfo } from "@/types/admin";

/**
 * Reads the Hermes binding for a project from installed_products.
 * Source of truth for the V5.1 Binding Layer — never derive from slug.
 */
export async function getHermesBinding(projectId: number | string): Promise<HermesBindingInfo | null> {
  const pid = Number(projectId);
  if (!pid) return null;

  const rows = await db.query.installedProducts.findMany({
    where: eq(installedProducts.projectId, pid),
  });

  if (rows.length === 0) return null;

  const row =
    rows.find((r) => r.product === "HERMES") ??
    rows.find((r) => r.hermesInstanceId) ??
    rows[0];

  if (!row) return null;

  return {
    hermesInstanceId: row.hermesInstanceId ?? null,
    bindingMode: row.bindingMode ?? null,
    plan: row.plan ?? null,
  };
}

"use server";

/**
 * 🧾 Admin Provisioning Actions — approve/reject collaborator access
 * apps/dashboard/src/app/admin/collaborators/actions.ts
 *
 * Guarded server-side: only SUPER_ADMIN / ADMIN can mutate provisioning state.
 */

import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { db } from "@/db";
import { nexusCollaborators, users, type NexusProvisionStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { sendCollaboratorMagicLink } from "@/lib/nexus/collaborators-service";

export interface AdminActionResult {
  success: boolean;
  error?: string;
}

async function requireAdminOrThrow(): Promise<void> {
  const auth = await getNexusAuthContext();
  if (!auth.isAuthenticated || (auth.role !== "SUPER_ADMIN" && auth.role !== "ADMIN")) {
    throw new Error("Se requieren privilegios de SUPER_ADMIN o ADMIN.");
  }
}

/**
 * Approve a pending collaborator — grants Nexus access (status → ACTIVE).
 * Also promotes the wallet-linked `users` row to a canonical Nexus role so
 * wallet sessions resolve as an authenticated Nexus operator.
 */
export async function approveCollaboratorAction(id: number, roleOverride?: string): Promise<AdminActionResult> {
  try {
    await requireAdminOrThrow();

    const [collaborator] = await db
      .select()
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.id, id))
      .limit(1);

    if (!collaborator) {
      return { success: false, error: "Colaborador no encontrado." };
    }

    const role = roleOverride || collaborator.role || "COLLABORATOR";

    // Rotate the token so only the JUST-APPROVED state is usable, and craft a
    // fresh magic link to dispatch by email (the collaborator may have self-
    // registered without ever receiving a working link).
    const token = `nx_${crypto.randomBytes(32).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db
      .update(nexusCollaborators)
      .set({
        role,
        status: "ACTIVE" as NexusProvisionStatus,
        statusChangedAt: new Date(),
        token,
        expiresAt,
      })
      .where(eq(nexusCollaborators.id, id));

    // Unify with canonical `users` RBAC: promote the linked user (by email) to
    // a valid Nexus role so wallet-based sessions authenticate consistently.
    const [linkedUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, collaborator.email.toLowerCase()))
      .limit(1);

    if (linkedUser) {
      const canonicalRole = role.toLowerCase();
      await db
        .update(users)
        .set({ role: canonicalRole as any })
        .where(eq(users.id, linkedUser.id));
    }

    // Dispatch the magic link (non-blocking: approval succeeds even if email
    // delivery fails — the collaborator can also re-request a link).
    try {
      const base = process.env.NEXT_PUBLIC_NEXUS_URL || "https://nexus.pandoras.finance";
      const magicLink = `${base}/nexus?token=${encodeURIComponent(token)}`;
      const displayName = collaborator.name || collaborator.email.split("@")[0] || "Sovereign Actor";
      const sent = await sendCollaboratorMagicLink(displayName, collaborator.email, magicLink);
      if (!sent.ok) {
        console.warn("[Admin Provisioning] Magic link email failed:", sent.error);
      }
    } catch (linkErr) {
      console.warn("[Admin Provisioning] Magic link email error (non-blocking):", linkErr);
    }

    revalidatePath("/admin/collaborators");
    return { success: true };
  } catch (error: any) {
    console.error("[Admin Provisioning] Approve error:", error);
    return { success: false, error: error?.message || "Error al aprobar el colaborador." };
  }
}

/**
 * Reject a pending collaborator — denies Nexus access (status → REJECTED).
 */
export async function rejectCollaboratorAction(id: number): Promise<AdminActionResult> {
  try {
    await requireAdminOrThrow();

    await db
      .update(nexusCollaborators)
      .set({
        status: "REJECTED" as NexusProvisionStatus,
        statusChangedAt: new Date(),
      })
      .where(eq(nexusCollaborators.id, id));

    revalidatePath("/admin/collaborators");
    return { success: true };
  } catch (error: any) {
    console.error("[Admin Provisioning] Reject error:", error);
    return { success: false, error: error?.message || "Error al rechazar el colaborador." };
  }
}
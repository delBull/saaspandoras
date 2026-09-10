import React from "react";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { AdminAccessGate } from "../AdminAccessGate";
import { db } from "@/db";
import { nexusCollaborators } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import { CollaboratorsAdmin } from "@/components/admin/CollaboratorsAdmin";

export const dynamic = "force-dynamic";

export default async function CollaboratorsPage() {
  const auth = await getNexusAuthContext();

  if (!auth.isAuthenticated || (auth.role !== "SUPER_ADMIN" && auth.role !== "ADMIN")) {
    return (
      <AdminAccessGate
        reason={
          auth.isAuthenticated
            ? `Tu cuenta con rol '${auth.role}' no cuenta con facultades para aprobar aprovisionamientos.`
            : "Se requiere una sesión autenticada con privilegios de administrador para gestionar aprovisionamientos."
        }
      />
    );
  }

  const collaborators = await db
    .select()
    .from(nexusCollaborators)
    .orderBy(
      // PENDING first, then by most recent
      sql`CASE ${nexusCollaborators.status} WHEN 'PENDING' THEN 0 WHEN 'ACTIVE' THEN 1 WHEN 'REJECTED' THEN 2 ELSE 3 END`,
      desc(nexusCollaborators.createdAt)
    );

  const rows = collaborators.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    whatsappPhone: c.whatsappPhone,
    role: c.role || "COLLABORATOR",
    status: (c.status || "ACTIVE") as "ACTIVE" | "PENDING" | "REJECTED" | "DISABLED",
    createdAt: c.createdAt.toISOString(),
    statusChangedAt: c.statusChangedAt?.toISOString() || null,
    lastAccessAt: c.lastAccessAt?.toISOString() || null,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Aprovisionamiento de Colaboradores</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Registros por magic link que completaron su perfil y esperan aprobación administrativa para acceder al Nexus.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-semibold">
          {rows.filter((r) => r.status === "PENDING").length} Pendientes
        </span>
      </div>

      <CollaboratorsAdmin rows={rows} />
    </div>
  );
}
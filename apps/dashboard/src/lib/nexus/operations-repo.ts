import { db } from '@saasfly/db';
import { nexusTasks, nexusApprovals, nexusIncidents, nexusCollaborators } from '@saasfly/db/schema';
import { eq, desc, and } from "@saasfly/db-core";

export async function getTasks(canonicalOrgId: string, assigneeCollaboratorId?: number) {
  const query = db
    .select({
      id: nexusTasks.id,
      canonicalOrgId: nexusTasks.canonicalOrgId,
      title: nexusTasks.title,
      description: nexusTasks.description,
      status: nexusTasks.status,
      priority: nexusTasks.priority,
      visibility: nexusTasks.visibility,
      assigneeCollaboratorId: nexusTasks.assigneeCollaboratorId,
      assigneeName: nexusCollaborators.name,
      assigneeEmail: nexusCollaborators.email,
      dueDate: nexusTasks.dueDate,
      claimedAt: nexusTasks.claimedAt,
      completedAt: nexusTasks.completedAt,
      cancelledAt: nexusTasks.cancelledAt,
      createdAt: nexusTasks.createdAt,
      updatedAt: nexusTasks.updatedAt,
    })
    .from(nexusTasks)
    .leftJoin(nexusCollaborators, eq(nexusTasks.assigneeCollaboratorId, nexusCollaborators.id))
    .where(
      assigneeCollaboratorId
        ? and(eq(nexusTasks.canonicalOrgId, canonicalOrgId), eq(nexusTasks.assigneeCollaboratorId, assigneeCollaboratorId))
        : eq(nexusTasks.canonicalOrgId, canonicalOrgId)
    )
    .orderBy(desc(nexusTasks.createdAt));

  return query;
}

export async function getApprovals(canonicalOrgId: string) {
  return db
    .select()
    .from(nexusApprovals)
    .where(eq(nexusApprovals.canonicalOrgId, canonicalOrgId))
    .orderBy(desc(nexusApprovals.createdAt));
}

export async function getIncidents(canonicalOrgId: string) {
  return db
    .select()
    .from(nexusIncidents)
    .where(eq(nexusIncidents.canonicalOrgId, canonicalOrgId))
    .orderBy(desc(nexusIncidents.createdAt));
}

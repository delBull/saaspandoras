import { db } from '@saasfly/db';
import { nexusTasks, nexusApprovals, nexusIncidents } from '@saasfly/db/schema';
import { eq, desc } from "@saasfly/db-core";

export async function getTasks(canonicalOrgId: string) {
  return db
    .select()
    .from(nexusTasks)
    .where(eq(nexusTasks.canonicalOrgId, canonicalOrgId))
    .orderBy(desc(nexusTasks.createdAt));
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

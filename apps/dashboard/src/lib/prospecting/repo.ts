import { db } from "@saasfly/db";
import { nexusProspectJobs, nexusProspects } from "@saasfly/db/schema";
import { and, desc, eq, inArray, isNull, lte, or, sql } from "@saasfly/db-core";
import type { JobSpec, Schedule, SourceType } from "./types";
import { normalizeSpec } from "./spec";

/** Próxima corrida según la frecuencia. `MANUAL` no agenda. */
export function nextRunFor(schedule: Schedule, from = new Date()): Date | null {
  const next = new Date(from.getTime());
  switch (schedule) {
    case "HOURLY":
      next.setHours(next.getHours() + 1);
      return next;
    case "DAILY":
      next.setDate(next.getDate() + 1);
      return next;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      return next;
    default:
      return null;
  }
}

export interface CreateJobInput {
  orgId: string;
  podId: string | null;
  label: string;
  mode: "SEARCH" | "TEXT";
  query: string;
  spec: JobSpec;
  schedule: Schedule;
  createdBy: string | null;
}

export async function createJob(input: CreateJobInput) {
  const [created] = await db
    .insert(nexusProspectJobs)
    .values({
      podId: input.podId,
      canonicalOrgId: input.orgId,
      label: input.label,
      mode: input.mode,
      query: input.query,
      spec: input.spec as unknown as Record<string, unknown>,
      schedule: input.schedule,
      maxAgeDays: input.spec.rules.maxAgeDays,
      minConfidence: input.spec.rules.minConfidence,
      nextRunAt: nextRunFor(input.schedule),
      createdBy: input.createdBy,
      status: "QUEUED",
    })
    .returning();
  return created ?? null;
}

export async function listJobs(orgId: string) {
  return db
    .select()
    .from(nexusProspectJobs)
    .where(eq(nexusProspectJobs.canonicalOrgId, orgId))
    .orderBy(desc(nexusProspectJobs.createdAt))
    .limit(50);
}

export async function getJob(orgId: string, jobId: string) {
  const [job] = await db
    .select()
    .from(nexusProspectJobs)
    .where(and(eq(nexusProspectJobs.id, jobId), eq(nexusProspectJobs.canonicalOrgId, orgId)))
    .limit(1);
  return job ?? null;
}

/** Spec del job con normalización defensiva (el jsonb pudo escribirse antes). */
export function jobSpec(job: { spec: unknown; query: string }): JobSpec {
  return normalizeSpec(job.spec, job.query);
}

export interface ProspectFilters {
  orgId: string;
  status?: string;
  door?: string;
  podId?: string;
  jobId?: string;
  minConfidence?: number;
  limit?: number;
}

export async function listProspects(filters: ProspectFilters) {
  const clauses = [eq(nexusProspects.canonicalOrgId, filters.orgId)];
  if (filters.status) clauses.push(eq(nexusProspects.status, filters.status));
  if (filters.door) clauses.push(eq(nexusProspects.door, filters.door));
  if (filters.podId) clauses.push(eq(nexusProspects.podId, filters.podId));
  if (filters.jobId) clauses.push(eq(nexusProspects.jobId, filters.jobId));
  if (typeof filters.minConfidence === "number") {
    clauses.push(sql`${nexusProspects.confidence} >= ${filters.minConfidence}`);
  }

  return db
    .select()
    .from(nexusProspects)
    .where(and(...clauses))
    .orderBy(desc(nexusProspects.confidence), desc(nexusProspects.fetchedAt))
    .limit(Math.min(filters.limit ?? 100, 200));
}

/** Conteo por estado para el tablero de la bandeja. */
export async function prospectCounts(orgId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ status: nexusProspects.status, total: sql<number>`count(*)::int` })
    .from(nexusProspects)
    .where(eq(nexusProspects.canonicalOrgId, orgId))
    .groupBy(nexusProspects.status);
  const out: Record<string, number> = { NEW: 0, APPROVED: 0, REJECTED: 0, CONTACTED: 0 };
  for (const row of rows) out[row.status] = Number(row.total);
  return out;
}

/** Jobs que ya cumplieron su próxima corrida (cron). */
export async function dueJobs(limit = 3) {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 15 * 60 * 1000);
  return db
    .select()
    .from(nexusProspectJobs)
    .where(
      and(
        or(
          inArray(nexusProspectJobs.status, ["QUEUED", "DONE"]),
          // Una corrida que quedó en RUNNING (timeout del servidor) se reintenta.
          sql`(${nexusProspectJobs.status} = 'RUNNING' AND ${nexusProspectJobs.lastRunAt} <= ${staleBefore})`,
        ),
        sql`${nexusProspectJobs.schedule} <> 'MANUAL'`,
        or(isNull(nexusProspectJobs.nextRunAt), lte(nexusProspectJobs.nextRunAt, now)),
      ),
    )
    .orderBy(nexusProspectJobs.nextRunAt)
    .limit(limit);
}

/** Fuentes efectivas del job (para mostrar en la UI). */
export function jobSources(spec: JobSpec): SourceType[] {
  return spec.sources;
}

import { db } from "@saasfly/db";
import { nexusProspectJobs, nexusProspects } from "@saasfly/db/schema";
import { and, eq, sql } from "@saasfly/db-core";
import { collectFromSource, sourcesInOrder } from "./sources";
import { dedupeKey, extractCandidate, llmAvailable } from "./extract";
import { getJob, jobSpec, nextRunFor } from "./repo";
import type { JobSpec, RawCandidate, RunSummary, SourceResult } from "./types";
import { asSchedule } from "./spec";

/**
 * Runner del módulo de prospección.
 *
 * Ejecuta UN job con presupuesto de tiempo (serverless) y devuelve un resumen
 * verificable. Reglas que no se negocian:
 *  - sin `source_url` no hay prospecto;
 *  - sin evidencia literal no hay correo ni nombre;
 *  - los fallos de una fuente se reportan (`warnings`), no se convierten en 0
 *    silencioso; si TODAS fallan, el job queda `FAILED` con `last_error`.
 */

const DEFAULT_BUDGET_MS = 45_000;

function excludedByRules(candidate: RawCandidate, spec: JobSpec): string | null {
  const haystack = `${candidate.sourceTitle ?? ""}\n${candidate.text ?? ""}`.toLowerCase();
  for (const keyword of spec.rules.excludeKeywords) {
    if (keyword && haystack.includes(keyword.toLowerCase())) return `palabra excluida: ${keyword}`;
  }
  for (const domain of spec.rules.excludeDomains) {
    if (!domain) continue;
    try {
      const host = new URL(candidate.sourceUrl).hostname.toLowerCase();
      if (host === domain || host.endsWith(`.${domain}`)) return `dominio excluido: ${domain}`;
    } catch {
      // URL inválida: el candidato no debería existir; se descarta por seguridad.
      return "URL inválida";
    }
  }
  return null;
}

function tooOld(candidate: RawCandidate, spec: JobSpec, now: Date): boolean {
  if (spec.rules.maxAgeDays <= 0) return false;
  if (!candidate.publishedAt) return false;
  const published = new Date(candidate.publishedAt).getTime();
  if (!Number.isFinite(published)) return false;
  return now.getTime() - published > spec.rules.maxAgeDays * 86_400_000;
}

export interface RunJobArgs {
  jobId: string;
  orgId: string;
  budgetMs?: number;
}

export async function runProspectJob(args: RunJobArgs): Promise<RunSummary> {
  const started = Date.now();
  const deadline = started + (args.budgetMs ?? DEFAULT_BUDGET_MS);
  const job = await getJob(args.orgId, args.jobId);

  if (!job) {
    return {
      jobId: args.jobId,
      status: "FAILED",
      candidates: 0,
      extracted: 0,
      inserted: 0,
      skipped: 0,
      warnings: ["job no encontrado para esta organización"],
      perSource: [],
      ms: 0,
    };
  }

  if (job.status === "PAUSED") {
    return {
      jobId: job.id,
      status: "PAUSED",
      candidates: 0,
      extracted: 0,
      inserted: 0,
      skipped: 0,
      warnings: ["job pausado: no se ejecuta hasta reactivarlo"],
      perSource: [],
      ms: 0,
    };
  }

  await db
    .update(nexusProspectJobs)
    .set({ status: "RUNNING", lastRunAt: new Date(), updatedAt: new Date() })
    .where(eq(nexusProspectJobs.id, job.id));

  const baseSpec = jobSpec(job);
  const spec: JobSpec = {
    ...baseSpec,
    rules: {
      ...baseSpec.rules,
      maxAgeDays: job.maxAgeDays ?? baseSpec.rules.maxAgeDays,
      minConfidence: job.minConfidence ?? baseSpec.rules.minConfidence,
    },
  };

  const warnings: string[] = [];
  const perSource: RunSummary["perSource"] = [];
  let candidateCount = 0;
  let extractedCount = 0;
  let inserted = 0;
  let skipped = 0;
  let sourcesSucceeded = 0;
  const now = new Date();

  for (const source of sourcesInOrder(spec)) {
    if (Date.now() > deadline) {
      warnings.push(`presupuesto de tiempo agotado antes de ${source}`);
      break;
    }

    let result: SourceResult;
    try {
      result = await collectFromSource(source, spec, spec.maxItemsPerSource);
    } catch (error) {
      result = {
        source,
        candidates: [],
        warning: `${source}: ${(error as Error).message ?? "error inesperado"}`,
        ms: 0,
      };
    }

    perSource.push({
      source,
      found: result.candidates.length,
      warning: result.warning,
      ms: result.ms,
    });
    if (result.warning) warnings.push(result.warning);
    if (result.candidates.length > 0 || !result.warning) sourcesSucceeded += 1;
    candidateCount += result.candidates.length;

    // Dedupe dentro de la misma corrida (varias fuentes pueden traer lo mismo).
    const seen = new Set<string>();

    for (const candidate of result.candidates) {
      if (Date.now() > deadline) {
        warnings.push(`presupuesto de tiempo agotado procesando ${source}`);
        break;
      }
      if (!candidate.sourceUrl) {
        skipped += 1;
        continue;
      }
      if (tooOld(candidate, spec, now)) {
        skipped += 1;
        continue;
      }
      const excluded = excludedByRules(candidate, spec);
      if (excluded) {
        skipped += 1;
        continue;
      }

      const extracted = await extractCandidate({ candidate, spec, now });
      extractedCount += 1;

      if (spec.rules.requireEmail && !extracted.email) {
        skipped += 1;
        continue;
      }
      if (extracted.confidence < spec.rules.minConfidence) {
        skipped += 1;
        continue;
      }

      const key = dedupeKey({
        email: extracted.email,
        company: extracted.company,
        personName: extracted.personName,
        role: extracted.role,
        sourceUrl: candidate.sourceUrl,
      });
      if (seen.has(key)) {
        skipped += 1;
        continue;
      }
      seen.add(key);

      try {
        const rows = await db
          .insert(nexusProspects)
          .values({
            jobId: job.id,
            podId: job.podId,
            canonicalOrgId: job.canonicalOrgId,
            company: extracted.company,
            personName: extracted.personName,
            role: extracted.role,
            email: extracted.email,
            door: extracted.door,
            sourceType: candidate.sourceType,
            sourceUrl: candidate.sourceUrl,
            sourceTitle: candidate.sourceTitle,
            publisher: candidate.publisher ?? null,
            publishedAt: candidate.publishedAt ? new Date(candidate.publishedAt) : null,
            confidence: extracted.confidence,
            extraction: extracted.extraction,
            dedupeKey: key,
            raw: {
              evidence: extracted.evidence,
              note: candidate.note ?? null,
              query: spec.query,
            },
          })
          .onConflictDoNothing({
            target: [nexusProspects.canonicalOrgId, nexusProspects.dedupeKey],
          })
          .returning({ id: nexusProspects.id });

        if (rows.length > 0) inserted += 1;
        else skipped += 1;
      } catch (error) {
        warnings.push(`no se pudo guardar ${candidate.sourceUrl}: ${(error as Error).message ?? "error"}`);
        skipped += 1;
      }
    }
  }

  const allFailed = sourcesSucceeded === 0 && warnings.length > 0;
  const status: RunSummary["status"] = allFailed ? "FAILED" : "DONE";
  const schedule = asSchedule(job.schedule);

  await db
    .update(nexusProspectJobs)
    .set({
      status,
      runs: sql`${nexusProspectJobs.runs} + 1`,
      lastRunAt: new Date(),
      nextRunAt: nextRunFor(schedule),
      lastError: allFailed ? warnings.join(" · ").slice(0, 2000) : null,
      stats: {
        lastRun: {
          at: new Date().toISOString(),
          candidates: candidateCount,
          extracted: extractedCount,
          inserted,
          skipped,
          llm: llmAvailable(),
          perSource,
        },
      },
      updatedAt: new Date(),
    })
    .where(and(eq(nexusProspectJobs.id, job.id), eq(nexusProspectJobs.canonicalOrgId, args.orgId)));

  return {
    jobId: job.id,
    status,
    candidates: candidateCount,
    extracted: extractedCount,
    inserted,
    skipped,
    warnings,
    perSource,
    ms: Date.now() - started,
  };
}

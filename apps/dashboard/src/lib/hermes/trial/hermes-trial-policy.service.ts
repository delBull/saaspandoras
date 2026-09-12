/**
 * 🛡️ HERMES GOVERNED TRIAL POLICY SERVICE (GATES 3, 5, 6 & 7)
 * src/lib/hermes/trial/hermes-trial-policy.service.ts
 *
 * Enforces server-side constraints, quotas, capacity costs, and 72-hour expiration
 * on Hermes Experience Trial Tenants.
 *
 * Core Principles:
 * - "Hermes Experience is not a demo of Hermes. Hermes Experience is Hermes,
 *   instantiated as a governed Trial Tenant."
 * - Server-side mutation gate: Expired trials are strictly read-only (Preserved State).
 * - "Software gratis ≠ sin límites": Economic circuit breakers on LLM, knowledge,
 *   campaigns, and real distribution.
 */

import { db } from '@/db';
import { projects, hermesTrialCredits } from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';

// ── 1. Capacities & Costs (Gate 6) ──────────────────────────────────────────
export const MEDIA_CAPABILITY_CREDIT_COST: Record<string, number> = {
  'media.image.generate': 1,      // Flux / SDXL image generation
  'media.voice.synthesize': 1,    // Voice synthesis
  'media.video.short': 3,         // Short video generation (RunPod)
  'media.video.upscale': 2,       // Video upscale / super-resolution
};

export function getMediaCreditCost(capability: string): number {
  return MEDIA_CAPABILITY_CREDIT_COST[capability] ?? 1;
}

// ── 2. Trial Quotas (Gate 3 & Gate 5) ───────────────────────────────────────
export const TRIAL_QUOTAS = {
  DURATION_HOURS: 72,
  MAX_KNOWLEDGE_SOURCES: 5,
  MAX_KNOWLEDGE_STORAGE_MB: 15,
  MAX_STRATEGY_RUNS_PER_HOUR: 5,
  MAX_ACTIVE_CAMPAIGNS: 3,
  MAX_EXTERNAL_PUBLICATIONS: 5, // Gate 5: Controlled test send limit
  LLM_TOKENS_PER_HOUR: 100_000, // Circuit breaker
};

export type TrialTier = 'SOFTWARE_ONLY' | 'MEDIA_ENABLED' | 'FOUNDER';

export const TRIAL_TIER_CREDITS: Record<TrialTier, number> = {
  SOFTWARE_ONLY: 0,
  MEDIA_ENABLED: 3,
  FOUNDER: 10,
};

// ── 3. Structured Errors ───────────────────────────────────────────────────
export class HermesTrialExpiredError extends Error {
  public readonly code = 'TRIAL_EXPIRED';
  constructor(
    message: string = 'El periodo de prueba de 72 horas ha finalizado. Tu organización y base de conocimiento permanecen 100% preservadas en el Sovereign Vault. Selecciona un plan para continuar operando.'
  ) {
    super(message);
    this.name = 'HermesTrialExpiredError';
  }
}

export class HermesTrialQuotaExceededError extends Error {
  public readonly code = 'TRIAL_QUOTA_EXCEEDED';
  constructor(public readonly quotaType: string, message: string) {
    super(message);
    this.name = 'HermesTrialQuotaExceededError';
  }
}

// ── 4. In-Memory Tenant Cache for Hot Paths ────────────────────────────────
interface CachedTrialState {
  tenantType: string;
  trialTier: TrialTier;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  trialStatus: string;
  cachedAt: number;
}

const trialStateCache = new Map<string, CachedTrialState>();
const CACHE_TTL_MS = 10_000; // 10s TTL

// ── 5. Service Implementation ──────────────────────────────────────────────
export class HermesTrialPolicyService {
  /**
   * Clears in-memory cache for deterministic testing.
   */
  public static clearCacheForTesting(): void {
    trialStateCache.clear();
  }

  /**
   * Resolves the trial lifecycle state of a tenant.
   */
  public static async getTenantTrialState(tenantId: string): Promise<{
    isTrial: boolean;
    tenantType: string;
    trialTier: TrialTier;
    trialStartedAt: Date | null;
    trialEndsAt: Date | null;
    trialStatus: string;
    isExpired: boolean;
    remainingMs: number;
  }> {
    const normalized = tenantId.toLowerCase().trim();
    const now = Date.now();

    const cached = trialStateCache.get(normalized);
    if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
      const isTrial = cached.tenantType === 'TRIAL';
      const isExpired = isTrial && Boolean(cached.trialEndsAt && cached.trialEndsAt.getTime() <= now);
      const remainingMs = isTrial && cached.trialEndsAt ? Math.max(0, cached.trialEndsAt.getTime() - now) : 0;
      return {
        isTrial,
        tenantType: cached.tenantType,
        trialTier: cached.trialTier,
        trialStartedAt: cached.trialStartedAt,
        trialEndsAt: cached.trialEndsAt,
        trialStatus: isExpired ? 'EXPIRED' : cached.trialStatus,
        isExpired,
        remainingMs,
      };
    }

    let projectRow: any = null;
    if (db) {
      try {
        const [row] = await db
          .select({
            tenantType: projects.tenantType,
            trialTier: projects.trialTier,
            trialStartedAt: projects.trialStartedAt,
            trialEndsAt: projects.trialEndsAt,
            trialStatus: projects.trialStatus,
          })
          .from(projects)
          .where(
            or(
              eq(projects.slug, normalized),
              eq(sql`CAST(${projects.organizationId} AS text)`, normalized),
              eq(sql`CAST(${projects.id} AS text)`, normalized)
            )
          )
          .limit(1);
        projectRow = row;
      } catch (err) {
        console.warn(`[HermesTrialPolicy] Notice fetching project for ${normalized}:`, err);
      }
    }

    const tenantType = projectRow?.tenantType || 'PRODUCTION';
    const trialTier = (projectRow?.trialTier as TrialTier) || 'SOFTWARE_ONLY';
    const trialStartedAt = projectRow?.trialStartedAt ? new Date(projectRow.trialStartedAt) : null;
    const trialEndsAt = projectRow?.trialEndsAt ? new Date(projectRow.trialEndsAt) : null;
    const trialStatus = projectRow?.trialStatus || 'ACTIVE';

    trialStateCache.set(normalized, {
      tenantType,
      trialTier,
      trialStartedAt,
      trialEndsAt,
      trialStatus,
      cachedAt: now,
    });

    const isTrial = tenantType === 'TRIAL';
    const isExpired = isTrial && Boolean(trialEndsAt && trialEndsAt.getTime() <= now);
    const remainingMs = isTrial && trialEndsAt ? Math.max(0, trialEndsAt.getTime() - now) : 0;

    return {
      isTrial,
      tenantType,
      trialTier,
      trialStartedAt,
      trialEndsAt,
      trialStatus: isExpired ? 'EXPIRED' : trialStatus,
      isExpired,
      remainingMs,
    };
  }

  /**
   * Gate 7: Server-side mutation barrier.
   * If trial has expired (72h), blocks all mutating operations while preserving read/audit access.
   */
  public static async assertTrialMutationAllowed(tenantId: string, actionName: string = 'mutation'): Promise<void> {
    const state = await this.getTenantTrialState(tenantId);
    if (!state.isTrial) return; // Production & Sandbox tenants proceed unblocked

    if (state.isExpired) {
      throw new HermesTrialExpiredError(
        `[HermesTrialPolicy] Operación '${actionName}' denegada: El periodo de prueba de 72 horas ha expirado. Todos tus datos y conocimientos permanecen preservados.`
      );
    }
  }

  /**
   * Gate 3 & Gate 5: Circuit breaker verification on software, knowledge and distribution.
   */
  public static async checkSoftwareQuota(
    tenantId: string,
    resource: 'knowledge' | 'strategy' | 'campaign' | 'distribution',
    currentUsage: number
  ): Promise<{ allowed: boolean; limit: number; remaining: number }> {
    const state = await this.getTenantTrialState(tenantId);
    if (!state.isTrial) {
      return { allowed: true, limit: Infinity, remaining: Infinity };
    }

    // Must not be expired
    if (state.isExpired) {
      throw new HermesTrialExpiredError();
    }

    let limit = Infinity;
    switch (resource) {
      case 'knowledge':
        limit = TRIAL_QUOTAS.MAX_KNOWLEDGE_SOURCES;
        break;
      case 'strategy':
        limit = TRIAL_QUOTAS.MAX_STRATEGY_RUNS_PER_HOUR;
        break;
      case 'campaign':
        limit = TRIAL_QUOTAS.MAX_ACTIVE_CAMPAIGNS;
        break;
      case 'distribution':
        limit = TRIAL_QUOTAS.MAX_EXTERNAL_PUBLICATIONS;
        break;
    }

    if (currentUsage >= limit) {
      throw new HermesTrialQuotaExceededError(
        resource,
        `Has alcanzado la cuota de prueba para ${resource} (${currentUsage}/${limit}). Actualiza a un plan de producción para operaciones ilimitadas.`
      );
    }

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - currentUsage),
    };
  }

  // ── Concurrency & Atomic Quota Locks (Mandatory Adjustment #2) ───────────
  private static quotaLocks = new Map<string, Promise<void>>();
  private static activeReservations = new Map<string, number>();
  private static confirmedUsage = new Map<string, number>();

  /**
   * Serializes execution for a specific tenant and resource to prevent concurrent race conditions.
   */
  public static async withSoftwareQuotaLock<T>(
    tenantId: string,
    resource: 'knowledge' | 'strategy' | 'campaign' | 'distribution',
    fn: () => Promise<T>
  ): Promise<T> {
    const key = `${tenantId.toLowerCase().trim()}:${resource}`;
    const prevLock = this.quotaLocks.get(key) || Promise.resolve();
    let releaseLock: () => void = () => {};
    const currentLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.quotaLocks.set(key, prevLock.then(() => currentLock).catch(() => currentLock));

    await prevLock.catch(() => {});
    try {
      return await fn();
    } finally {
      releaseLock();
      if (this.quotaLocks.get(key) === currentLock) {
        this.quotaLocks.delete(key);
      }
    }
  }

  /**
   * Atomic Check + Reserve + Mutate = Single Atomic Authority.
   * Prevents two concurrent requests from both seeing limit-1 and exceeding the quota.
   */
  public static async atomicCheckAndReserveQuota<T>(
    tenantId: string,
    resource: 'knowledge' | 'strategy' | 'campaign' | 'distribution',
    currentUsageProvider: () => Promise<number>,
    mutation: () => Promise<T>
  ): Promise<T> {
    return this.withSoftwareQuotaLock(tenantId, resource, async () => {
      const normalized = tenantId.toLowerCase().trim();
      const resKey = `${normalized}:${resource}`;
      const current = await currentUsageProvider();
      const reserved = this.activeReservations.get(resKey) || 0;
      const totalEffective = current + reserved;

      await this.checkSoftwareQuota(tenantId, resource, totalEffective);

      // Reserve 1 slot atomically during mutation execution
      this.activeReservations.set(resKey, reserved + 1);
      try {
        const result = await mutation();
        return result;
      } finally {
        const remaining = (this.activeReservations.get(resKey) || 1) - 1;
        if (remaining <= 0) {
          this.activeReservations.delete(resKey);
        } else {
          this.activeReservations.set(resKey, remaining);
        }
      }
    });
  }

  /**
   * Distribution quota side-effect tracking (Acceptance Criterion C):
   * Only confirmed successful publications consume quota; UNKNOWN or timeouts do not.
   */
  public static getConfirmedDistributionCount(tenantId: string): number {
    return this.confirmedUsage.get(`${tenantId.toLowerCase().trim()}:distribution`) || 0;
  }

  public static recordConfirmedDistribution(tenantId: string): void {
    const key = `${tenantId.toLowerCase().trim()}:distribution`;
    const current = this.confirmedUsage.get(key) || 0;
    this.confirmedUsage.set(key, current + 1);
  }

  /**
   * Sets trial state directly in cache for testing.
   */
  public static setMockTrialState(tenantId: string, state: Partial<CachedTrialState>): void {
    const normalized = tenantId.toLowerCase().trim();
    trialStateCache.set(normalized, {
      tenantType: state.tenantType || 'TRIAL',
      trialTier: state.trialTier || 'MEDIA_ENABLED',
      trialStartedAt: state.trialStartedAt || new Date(),
      trialEndsAt: state.trialEndsAt || new Date(Date.now() + 72 * 3600 * 1000),
      trialStatus: state.trialStatus || 'ACTIVE',
      cachedAt: Date.now(),
    });
  }

  /**
   * Resets in-memory quota tracking (useful between test runs).
   */
  public static resetQuotaAccounting(): void {
    this.quotaLocks.clear();
    this.activeReservations.clear();
    this.confirmedUsage.clear();
  }
}

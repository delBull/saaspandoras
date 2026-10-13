import { checkRateLimit, getRateLimitStatus, RateLimitResult } from "@/lib/deal-signing/rate-limit";

export interface QuotaCheckResult {
  allowed: boolean;
  quotaType: "rate_limit" | "monthly_events";
  limit: number;
  remaining: number;
  resetMs: number;
  retryAfterSeconds: number;
  reason?: string;
}

export interface MeteringContext {
  clientId: string;
  projectId: number | null;
  environment: "staging" | "production";
  plan?: "sandbox" | "starter" | "growth" | "enterprise";
}

/**
 * 🔒 Dev Access Quota & Metering Service (Phase 3)
 * Enforza cuotas deterministas de consumo y rate limits con fail-closed:
 * 
 * Reglas de Cuota:
 * - Sandbox / Staging: 120 req/min, 10,000 eventos/mes
 * - Starter: 300 req/min, 50,000 eventos/mes
 * - Growth: 1,200 req/min, 500,000 eventos/mes
 * - Enterprise: 5,000 req/min, Ilimitado
 */
export class QuotaMeteringService {
  /**
   * Resuelve el límite de eventos por minuto según el plan y entorno
   */
  static getRateLimitPerMinute(plan: string = "sandbox", env: string = "staging"): number {
    if (env === "staging") return 120;
    switch (plan) {
      case "starter": return 300;
      case "growth": return 1200;
      case "enterprise": return 5000;
      default: return 120;
    }
  }

  /**
   * Resuelve el límite mensual de eventos según el plan
   */
  static getMonthlyEventQuota(plan: string = "sandbox", env: string = "staging"): number {
    if (env === "staging") return 10000;
    switch (plan) {
      case "starter": return 50000;
      case "growth": return 500000;
      case "enterprise": return Number.MAX_SAFE_INTEGER;
      default: return 10000;
    }
  }

  /**
   * Valida y descuenta una unidad de cuota para una petición de ingestión de eventos.
   * Ejecuta evaluación doble:
   * 1. Rate limit por minuto (sliding window).
   * 2. Cuota mensual acumulada.
   */
  static async checkEventQuota(ctx: MeteringContext): Promise<QuotaCheckResult> {
    const plan = ctx.plan || (ctx.environment === "production" ? "starter" : "sandbox");
    
    // 1. Verificación de Rate Limit por minuto
    const rateLimit = this.getRateLimitPerMinute(plan, ctx.environment);
    const minuteKey = `meter:rl:${ctx.clientId}:${Math.floor(Date.now() / 60000)}`;
    const minuteResult = await checkRateLimit(minuteKey, rateLimit, 60000, { failClosed: true });

    if (!minuteResult.allowed) {
      const retryAfterSec = Math.max(1, Math.ceil(minuteResult.retryAfterMs / 1000));
      return {
        allowed: false,
        quotaType: "rate_limit",
        limit: rateLimit,
        remaining: 0,
        resetMs: minuteResult.resetMs,
        retryAfterSeconds: retryAfterSec,
        reason: `Excedido límite de peticiones por minuto (${rateLimit} req/min). Reintente en ${retryAfterSec}s.`,
      };
    }

    // 2. Verificación de Cuota Mensual
    const monthlyLimit = this.getMonthlyEventQuota(plan, ctx.environment);
    if (monthlyLimit < Number.MAX_SAFE_INTEGER) {
      const currentYearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
      const monthlyKey = `meter:quota:${ctx.clientId}:${currentYearMonth}`;
      // Window de 31 días en ms: 31 * 24 * 3600 * 1000
      const monthWindowMs = 31 * 24 * 3600 * 1000;
      const monthResult = await checkRateLimit(monthlyKey, monthlyLimit, monthWindowMs, { failClosed: true });

      if (!monthResult.allowed) {
        return {
          allowed: false,
          quotaType: "monthly_events",
          limit: monthlyLimit,
          remaining: 0,
          resetMs: monthResult.resetMs,
          retryAfterSeconds: Math.ceil(monthResult.retryAfterMs / 1000),
          reason: `Excedida cuota mensual de eventos (${monthlyLimit} eventos/mes para plan '${plan}'). Contacte a soporte o actualice a Growth.`,
        };
      }
    }

    return {
      allowed: true,
      quotaType: "rate_limit",
      limit: rateLimit,
      remaining: minuteResult.remaining,
      resetMs: minuteResult.resetMs,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Consulta las métricas de consumo actuales sin alterar contadores.
   */
  static async getUsageMetrics(ctx: MeteringContext): Promise<{
    plan: string;
    environment: string;
    monthlyEvents: {
      used: number;
      limit: number;
      remaining: number;
      resetDate: string;
    };
    rateLimit: {
      used: number;
      limit: number;
      remaining: number;
      resetSeconds: number;
    };
  }> {
    const plan = ctx.plan || (ctx.environment === "production" ? "starter" : "sandbox");
    const rateLimit = this.getRateLimitPerMinute(plan, ctx.environment);
    const minuteKey = `meter:rl:${ctx.clientId}:${Math.floor(Date.now() / 60000)}`;
    const minuteStatus = await getRateLimitStatus(minuteKey, rateLimit, 60000);

    const monthlyLimit = this.getMonthlyEventQuota(plan, ctx.environment);
    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const monthlyKey = `meter:quota:${ctx.clientId}:${currentYearMonth}`;
    const monthWindowMs = 31 * 24 * 3600 * 1000;
    const monthlyStatus = await getRateLimitStatus(monthlyKey, monthlyLimit, monthWindowMs);

    // Calcular fecha aproximada de reset fin de mes
    const now = new Date();
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    return {
      plan,
      environment: ctx.environment,
      monthlyEvents: {
        used: monthlyStatus.count,
        limit: monthlyLimit === Number.MAX_SAFE_INTEGER ? -1 : monthlyLimit,
        remaining: monthlyLimit === Number.MAX_SAFE_INTEGER ? -1 : monthlyStatus.remaining,
        resetDate: endOfMonth.toISOString(),
      },
      rateLimit: {
        used: minuteStatus.count,
        limit: rateLimit,
        remaining: minuteStatus.remaining,
        resetSeconds: Math.ceil(minuteStatus.resetMs / 1000),
      },
    };
  }
}

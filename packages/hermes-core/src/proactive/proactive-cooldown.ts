import { ProactiveSignal } from './signal-registry';
import { ProactivePolicy } from './proactive-policy';

export class ProactiveCooldownStore {
  // In memory store for testing. In prod, this would be a Redis cache or DB table
  private static cooldowns: Map<string, Date> = new Map();

  static generateIdempotencyKey(tenantId: string, actorId: string, signalType: string): string {
    return `${tenantId}:${actorId}:${signalType}`;
  }

  static async isCooldownActive(
    tenantId: string,
    actorId: string,
    signalType: string
  ): Promise<boolean> {
    const key = this.generateIdempotencyKey(tenantId, actorId, signalType);
    const expiry = this.cooldowns.get(key);
    
    if (expiry && expiry > new Date()) {
      return true;
    }
    return false;
  }

  static async setCooldown(
    tenantId: string,
    actorId: string,
    signalType: string,
    hours: number
  ): Promise<void> {
    const key = this.generateIdempotencyKey(tenantId, actorId, signalType);
    const expiry = new Date(Date.now() + hours * 60 * 60 * 1000);
    this.cooldowns.set(key, expiry);
    console.log(`[CooldownStore] Set cooldown for ${key} until ${expiry.toISOString()}`);
  }

  static async evaluateQuietHours(policy: ProactivePolicy, timezone: string = 'America/Mexico_City'): Promise<boolean> {
    const qh = policy.quietHours;
    if (!qh) return false;

    // Simplified timezone/quiet hours logic for architectural representation
    const now = new Date();
    // Assuming naive UTC comparison for test, real impl uses date-fns-tz
    const currentHour = now.getUTCHours() - 6; // Rough CDT approx
    
    const start = parseInt(qh.start.split(':')[0] || '0', 10);
    const end = parseInt(qh.end.split(':')[0] || '0', 10);

    // If quiet hours cross midnight (e.g. 21:00 to 09:00)
    if (start > end) {
      if (currentHour >= start || currentHour < end) return true;
    } else {
      if (currentHour >= start && currentHour < end) return true;
    }

    return false;
  }
}

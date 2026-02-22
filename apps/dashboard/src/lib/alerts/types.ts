/**
 * Telegram Bridge Alert Engine — Core Types
 *
 * Defines alert severities, rules, states, and the metric snapshot
 * that the evaluator receives to test conditions against.
 */

// ── Severity & Windows ────────────────────────────────────────────────────

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertWindow = '5m' | '15m' | '1h' | '24h' | 'realtime';

// ── Metric Snapshot (passed to each rule condition) ───────────────────────

export interface BridgeMetricsSnapshot {
    // Event pipeline
    events_received_5m: number;
    events_accepted_5m: number;
    events_accepted_1h: number;
    events_accepted_24h: number;

    // Latency (P95 of gamification record execution, ms)
    latency_p95_ms: number;

    // Economy
    pbox_earned_total: number;
    pbox_reserved_total: number;
    pbox_claimed_total: number;
    pbox_earned_24h: number;

    // Claims
    claims_pending: number; // reserved but not yet on-chain

    // Webhooks
    webhook_success_1h: number;
    webhook_failed_1h: number;
    webhook_success_rate_15m: number; // % (100 = perfect)
    webhook_pending: number;

    // System
    gamification_enabled: boolean;
    claims_enabled: boolean;
    paranoia_mode: boolean;

    // Config drift detection
    economy_params_changed_1h: boolean; // true if any economy param changed in last 1h
}

// ── Alert Rule ─────────────────────────────────────────────────────────────

export interface AlertRule {
    id: string;
    severity: AlertSeverity;
    window: AlertWindow;
    /** Human-readable title shown in Discord embed and Admin UI */
    title: string;
    /** Long description of what this alert means */
    description: (metrics: BridgeMetricsSnapshot) => string;
    /** Return true when alert should fire */
    condition: (metrics: BridgeMetricsSnapshot) => boolean;
    /** Recommended playbook id */
    playbook?: string;
    /** Short human-readable action label shown prominently in Discord as CTA */
    suggestedAction?: string;
    /** Emoji prefix for the Discord embed */
    emoji: string;
    /** Minutes before re-alerting if condition persists */
    cooldownMinutes: number;
}

// ── Alert State (persisted in DB) ─────────────────────────────────────────

export type AlertStatus = 'active' | 'resolved';

export interface AlertState {
    alertId: string;
    status: AlertStatus;
    lastTriggeredAt: Date | null;
    lastResolvedAt: Date | null;
    triggerCount: number;
    // Trend memory (v2)
    firstSeenAt: Date | null;
    timesFired24h: number;
}

// ── Fired Alert (runtime object for notifier) ─────────────────────────────

export interface FiredAlert {
    rule: AlertRule;
    metrics: BridgeMetricsSnapshot;
    firedAt: Date;
    isNew: boolean; // false → still active (no cooldown yet)
}

// ── Discord color codes ───────────────────────────────────────────────────
export const DISCORD_COLORS: Record<AlertSeverity, number> = {
    critical: 0xE74C3C, // red
    warning: 0xE67E22, // orange
    info: 0x3498DB, // blue
};

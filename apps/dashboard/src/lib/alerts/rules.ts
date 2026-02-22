/**
 * Telegram Bridge Alert Rules — v2
 *
 * Hardcoded rule set. Each rule is stateless and pure:
 * receives a BridgeMetricsSnapshot, returns boolean.
 *
 * v2 additions:
 *   - suggestedAction: prominent CTA in Discord embed
 *   - W4_HIGH_LATENCY: P95 execution latency alert
 *   - I2_ECONOMY_CONFIG_DRIFT: rapid config change detection
 *
 * Rule IDs must match alert_states.alert_id in the DB.
 */
import type { AlertRule, BridgeMetricsSnapshot } from './types';

export const ALERT_RULES: AlertRule[] = [
    // ────────────────────────────────────────────────
    // 🔴 CRITICAL
    // ────────────────────────────────────────────────

    {
        id: 'A1_ACCEPTANCE_RATE',
        severity: 'critical',
        window: '5m',
        emoji: '🚨',
        title: 'Event Acceptance Rate Collapsed',
        description: (m) =>
            `Acceptance rate dropped to ${m.events_received_5m > 0
                ? Math.round((m.events_accepted_5m / m.events_received_5m) * 100)
                : 0}% (threshold: 80%) over the last 5 minutes. ` +
            `Received: ${m.events_received_5m}, Accepted: ${m.events_accepted_5m}.`,
        condition: (m: BridgeMetricsSnapshot) =>
            m.events_received_5m > 5 &&
            m.events_accepted_5m / m.events_received_5m < 0.8,
        playbook: 'disable-gamification',
        suggestedAction: 'Disable Gamification',
        cooldownMinutes: 30,
    },

    {
        id: 'A2_PBOX_INVARIANT',
        severity: 'critical',
        window: 'realtime',
        emoji: '🚨',
        title: 'PBOX Invariant Violation',
        description: (m) =>
            `PBOX reserved (${m.pbox_reserved_total}) exceeds earned (${m.pbox_earned_total}). ` +
            `This invariant MUST hold: earned ≥ reserved ≥ claimed. Possible double-spend or accounting bug.`,
        condition: (m: BridgeMetricsSnapshot) =>
            m.pbox_reserved_total > m.pbox_earned_total,
        playbook: 'disable-claims',
        suggestedAction: 'Disable Claims immediately',
        cooldownMinutes: 30,
    },

    {
        id: 'A3_CLAIM_PIPELINE_STUCK',
        severity: 'critical',
        window: '1h',
        emoji: '🚨',
        title: 'Claim Pipeline Stuck',
        description: (m) =>
            `${m.claims_pending} claims are reserved but not settled on-chain for > 1 hour. ` +
            `May indicate chain instability or signing service failure.`,
        condition: (m: BridgeMetricsSnapshot) =>
            m.claims_pending > 10,
        playbook: 'disable-claims',
        suggestedAction: 'Disable Claims + investigate chain',
        cooldownMinutes: 30,
    },

    {
        id: 'A4_WEBHOOK_FAILURE',
        severity: 'critical',
        window: '15m',
        emoji: '🚨',
        title: 'Webhook Delivery Degradation',
        description: (m) =>
            `Webhook success rate is ${m.webhook_success_rate_15m.toFixed(1)}% (threshold: 90%) over last 15m. ` +
            `${m.webhook_pending} events pending in queue. ` +
            `Telegram App users will see stale UI state.`,
        playbook: 'webhook-failure',
        suggestedAction: 'Check Telegram webhook URL + secret',
        cooldownMinutes: 30,
        condition: (m: BridgeMetricsSnapshot) => {
            const total = m.webhook_success_1h + m.webhook_failed_1h;
            return total > 3 && m.webhook_success_rate_15m < 90;
        },
    },

    // ────────────────────────────────────────────────
    // 🟠 WARNING
    // ────────────────────────────────────────────────

    {
        id: 'W1_WEBHOOK_QUEUE_BUILDING',
        severity: 'warning',
        window: '15m',
        emoji: '⚠️',
        title: 'Webhook Queue Growing',
        description: (m) =>
            `Webhook pending queue has ${m.webhook_pending} events. ` +
            `This may indicate the Telegram endpoint is slow or down.`,
        suggestedAction: 'Check Telegram endpoint health',
        cooldownMinutes: 60,
        condition: (m: BridgeMetricsSnapshot) => m.webhook_pending > 20,
    },

    {
        id: 'W2_EVENT_VOLUME_ZERO',
        severity: 'warning',
        window: '1h',
        emoji: '⚠️',
        title: 'No Events Received (1h)',
        description: (m) =>
            `Zero events accepted in the last hour. ` +
            `This may indicate a Telegram App outage, binding loss, or silent configuration issue. ` +
            `Gamification enabled: ${m.gamification_enabled}.`,
        suggestedAction: 'Verify Telegram App connectivity and bindings',
        cooldownMinutes: 60,
        condition: (m: BridgeMetricsSnapshot) =>
            m.gamification_enabled && m.events_accepted_1h === 0,
    },

    {
        id: 'W3_CLAIM_RESERVATION_HIGH',
        severity: 'warning',
        window: 'realtime',
        emoji: '⚠️',
        title: 'High Claim Reservation Rate',
        description: (m) =>
            `${m.pbox_reserved_total} PBOX reserved vs ${m.pbox_earned_total} earned ` +
            `(${m.pbox_earned_total > 0 ? Math.round((m.pbox_reserved_total / m.pbox_earned_total) * 100) : 0}%). ` +
            `Reserve ratio above 80% may signal claim batching or settlement lag.`,
        cooldownMinutes: 60,
        condition: (m: BridgeMetricsSnapshot) =>
            m.pbox_earned_total > 0 &&
            m.pbox_reserved_total / m.pbox_earned_total > 0.8 &&
            // don't fire A2 and W3 simultaneously — A2 is the critical version
            m.pbox_reserved_total <= m.pbox_earned_total,
    },

    {
        id: 'W4_HIGH_LATENCY',
        severity: 'warning',
        window: '5m',
        emoji: '⚠️',
        title: 'High Execution Latency (P95)',
        description: (m) =>
            `Gamification record P95 latency is ${m.latency_p95_ms}ms (threshold: 500ms). ` +
            `Users may experience delays in points/PBOX feedback. ` +
            `Check DB connection pool and query performance.`,
        suggestedAction: 'Check DB connection + query performance',
        cooldownMinutes: 30,
        condition: (m: BridgeMetricsSnapshot) =>
            m.latency_p95_ms > 500 && m.latency_p95_ms > 0,
    },

    // ────────────────────────────────────────────────
    // 🟢 INFO / AUDIT
    // ────────────────────────────────────────────────

    {
        id: 'I1_PARANOIA_MODE_ACTIVE',
        severity: 'info',
        window: 'realtime',
        emoji: '🛡️',
        title: 'Paranoia Mode Activated',
        description: (_) =>
            `Bridge is operating in Paranoia Mode. Rate limits are tightened, ` +
            `economy is read-only. This is expected during incidents or audits.`,
        cooldownMinutes: 0, // always notify when paranoia turns on
        condition: (m: BridgeMetricsSnapshot) => m.paranoia_mode,
    },

    {
        id: 'I2_ECONOMY_CONFIG_DRIFT',
        severity: 'info',
        window: '1h',
        emoji: '⚙️',
        title: 'Economy Config Changed Recently',
        description: (_) =>
            `An economy parameter was modified in the last hour. ` +
            `Verify the conversionVersion was bumped and the change was intentional. ` +
            `This alert is purely informational — auto-resolves after 1h.`,
        suggestedAction: 'Verify conversionVersion was bumped',
        cooldownMinutes: 60,
        condition: (m: BridgeMetricsSnapshot) => m.economy_params_changed_1h,
    },
];

// ── Playbook link map (for Discord CTA and Admin UI) ─────────────────────
export const PLAYBOOK_LINKS: Record<string, string> = {
    'disable-gamification': '/admin/telegram-bridge?tab=playbooks#disable-gamification',
    'disable-claims': '/admin/telegram-bridge?tab=playbooks#disable-claims',
    'webhook-failure': '/admin/telegram-bridge?tab=playbooks#webhook-failure',
    'paranoia-mode': '/admin/telegram-bridge?tab=playbooks#paranoia-mode',
};

// ── IDs to seed in alert_states DB ───────────────────────────────────────
export const ALL_ALERT_IDS = ALERT_RULES.map(r => r.id);

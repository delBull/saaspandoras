# Ops Metrics v2 - Specification

> **Production Monitoring for Real Traffic**  
> Purpose: Detect incidents before users, enable data-driven operations

---

## Principles

**Ops Metrics ≠ Business Analytics**

These metrics exist to:
- Detect incidents before users report them
- Make operational decisions (kill switch, replay, scale)
- Support audits with objective data

**Rules**:
- ✅ Metrics must be objective (no human interpretation)
- ✅ Measurable programmatically
- ✅ Comparable over time (establish baseline)

---

## Metrics Layers

### Layer 1: System Health (Always On)

**Question**: "Is the platform alive and stable?"

| Metric            | Source           | Query/Check                           | Alert Threshold |
|-------------------|------------------|---------------------------------------|-----------------|
| API Uptime (%)    | Health endpoint  | `curl /health` response time          | < 99.9%         |
| Error rate (5xx)  | Application logs | 5xx responses / total requests        | > 1% / 5 min    |
| P95 latency       | API Gateway      | 95th percentile response time         | > 2s            |
| Worker heartbeat  | DB / Redis       | Last `updated_at` on worker process   | Missing > 30s   |

**Implementation**:
- Health endpoint: `/api/health` (lightweight DB ping)
- Logs: Vercel/Next.js structured logging
- Latency: Vercel Analytics

---

### Layer 2: Webhooks & Integrations (Core Business Logic)

**Question**: "Are we communicating correctly with external systems?"

| Metric              | Source          | SQL Query                                           | Alert Threshold         |
|---------------------|-----------------|-----------------------------------------------------|-------------------------|
| Webhooks sent/min   | `webhook_events`| `count(*) WHERE created_at > now() - interval '1 min'` | Spike/drop ±50% |
| Success ratio       | `webhook_events`| `count(status='sent') / count(*)`                   | < 98%                   |
| Retry count avg     | `webhook_events`| `avg(attempt)` WHERE status != 'pending'            | > 1.5                   |
| DLQ size            | `webhook_events`| `count(*) WHERE status='failed'`                    | > 0 (warn), >10 (crit)  |
| Replay frequency    | `audit_logs`    | `count(*) WHERE action='replay_event'`              | Anomalous               |

**SQL Queries**:

```sql
-- Webhook Success Ratio (Last Hour)
SELECT
  count(*) FILTER (WHERE status = 'sent')::float / count(*) AS success_ratio
FROM webhook_events
WHERE created_at > now() - interval '1 hour';

-- DLQ Size
SELECT count(*) AS dlq_size
FROM webhook_events
WHERE status = 'failed';

-- Average Retry Count
SELECT avg(attempt)::float AS avg_retries
FROM webhook_events
WHERE status != 'pending'
  AND created_at > now() - interval '1 hour';

-- Recent Error Rate
SELECT
  count(*) FILTER (WHERE status = 'failed')::float / count(*) AS error_rate
FROM webhook_events
WHERE created_at > now() - interval '15 minutes';
```

**Baseline (Steady State)**:
- DLQ = 0
- Retries = rare (< 0.5 avg)
- Replay = manual and occasional

---

### Layer 3: Security & Abuse Detection

**Question**: "Is someone trying something suspicious?"

| Metric                 | Source               | Detection Logic                        | Signal              |
|------------------------|----------------------|----------------------------------------|---------------------|
| Invalid signature count| Guard middleware logs| Failed HMAC verifications per hour     | Potential attack or key desync |
| Rejected timestamps    | Guard logs           | Requests outside ±5 min window         | Replay attack attempt |
| Invalid API key hits   | IntegrationGuard     | 401 responses with API key header      | Leaked/compromised key |
| Kill switch toggles    | `audit_logs`         | `action='toggle_kill_switch'` frequency| Governance/incident |

**Implementation**:
- Log all guard failures with structured data
- Aggregate by client/source IP
- Alert on unusual patterns

**Example Query**:
```sql
-- Invalid Signature Attempts (Last Hour)
SELECT client_id, count(*) AS failed_verifications
FROM webhook_guard_logs
WHERE verified = false
  AND created_at > now() - interval '1 hour'
GROUP BY client_id
HAVING count(*) > 5;
```

---

### Layer 4: On-Chain Execution (Future, when scaled)

**Question**: "Did what we promised in-app actually happen on-chain?"

| Metric              | Source              | Query                                  |
|---------------------|---------------------|----------------------------------------|
| Deploy success rate | Core callbacks      | `count(deployed=true) / count(*)`      |
| Avg deploy time     | Core → Edge latency | `avg(deployed_at - triggered_at)`      |
| Failed tx reason    | RPC / logs          | `groupBy(revert_reason)`               |
| Contract pause state| Chain query         | `contract.paused()`                    |

**Not Implemented Yet** - Add when on-chain volume increases.

---

## Recommended Dashboards

### 1. Operations Dashboard (Real-Time)

**URL**: `/admin/operations`

Shows:
- Worker status
- DLQ size
- Error rate (last hour)
- Pending events

**Refresh**: 10 seconds

---

### 2. Security Dashboard (Proposed)

**URL**: `/admin/security` (future)

Shows:
- Invalid signature attempts (by client)
- Rejected timestamps (replay attempts)
- API key failures
- Kill switch history

---

### 3. Performance Dashboard (Proposed)

**URL**: `/admin/performance` (future)

Shows:
- P50/P95/P99 latency
- Request throughput
- Database query times
- Webhook delivery latency

---

## Alert Thresholds (Initial)

**Conservative approach**: Start with manual monitoring, add automated alerts after 1 month of real traffic.

| Metric          | Warning         | Critical       | Action                    |
|-----------------|-----------------|----------------|---------------------------|
| DLQ Size        | > 0             | > 10           | Investigate immediately   |
| Error Rate      | > 2%            | > 5%           | Kill switch consideration |
| Webhook Latency | > 5s (P95)      | > 10s (P95)    | Check external service    |
| Invalid Sigs    | > 5/hour        | > 20/hour      | Verify client keys        |
| API Uptime      | < 99.95%        | < 99.9%        | Infrastructure check      |

---

## Roadmap: Ops Metrics v3 (Not Now)

**Do NOT implement until you have real traffic data to inform thresholds.**

- [ ] SLOs (Service Level Objectives)
- [ ] Error budgets (monthly allowable failures)
- [ ] Alert routing (PagerDuty / Slack integration)
- [ ] User impact correlation (which users affected by incident)
- [ ] Anomaly detection (ML-based)

---

## Queries to Add to Operations Status API

**Extend** `/api/admin/operations/status` with:

```typescript
{
  // Existing
  webhooksEnabled: boolean,
  pendingEvents: number,
  failedEvents: number,
  errorRate: number,
  
  // New (Layer 2)
  webhooksSentLastHour: number,
  successRatio: number,
  avgRetries: number,
  
  // New (Layer 3)
  invalidSignaturesLastHour: number,
  rejectedTimestampsLastHour: number,
  invalidApiKeysLastHour: number
}
```

**Optional**: Add a separate `/api/admin/operations/metrics` endpoint for historical data (charts).

---

## Observability Best Practices

1. **Log Structured Data**
   - Use JSON logs with consistent fields
   - Include `client_id`, `event_id`, `timestamp`, `action`

2. **No Sensitive Data in Logs**
   - Never log secrets, API keys, or full payloads
   - Hash personally identifiable information

3. **Correlation IDs**
   - Tag requests with unique IDs across systems
   - Trace events from trigger → webhook → response

4. **Baseline First, Alerts Second**
   - Collect 2-4 weeks of data
   - Establish normal patterns
   - Set thresholds based on reality, not guesses

---

## Example: First Month Monitoring Plan

**Week 1-2**: Passive observation
- Record all metrics
- No alerts (except critical like DLQ > 50)
- Daily manual review

**Week 3-4**: Pattern analysis
- Identify daily/weekly cycles
- Detect outliers
- Document expected ranges

**Month 2**: Automated alerts
- Set thresholds based on Week 3-4 data
- Enable Slack/email notifications
- Refine based on false positives

---

**Document Owner**: Platform Team  
**Review**: After first incident or quarterly  
**Version**: 2.0 (Production Ready)

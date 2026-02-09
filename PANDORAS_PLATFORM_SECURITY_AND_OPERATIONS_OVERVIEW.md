# Pandora's Platform - Security and Operations Overview

> **Enterprise-Grade Infrastructure Reference**  
> Last Updated: February 2026  
> Version: 1.0 (Production Ready)

---

## 1. Platform Overview

### Architecture

Pandora's operates on a **three-tier architecture**:

- **Pandora Core** (Source of Truth)
  - Database: PostgreSQL with Drizzle ORM
  - Authentication: Wallet-based (thirdweb)
  - Authorization: Role-based (Super Admin, Client)

- **Edge Applications**
  - Dashboard (Next.js 15)
  - Telegram Bot
  - Public API

- **Blockchain Layer**
  - EVM-compatible chains (Sepolia, Base)
  - Immutable smart contracts
  - No hot-wallet exposure

### Source of Truth

All state originates and is validated in **Pandora Core**. External systems synchronize via webhooks.

### Separation of Concerns

| Layer      | Responsibility               | Never Does                    |
|------------|------------------------------|-------------------------------|
| Core       | State management, webhooks   | Direct blockchain interaction |
| Edge       | UI, user interaction         | State mutation               |
| Blockchain | Immutable execution          | Application logic            |

---

## 2. Security Model

### API Security

#### Authentication & Authorization

- **API Keys**: SHA-256 hashed, stored securely
- **Environment Isolation**: Strict staging/production separation
- **Permissions**: Client-scoped access (no cross-client data leakage)
- **Super Admin**: Wallet-based, immutable in production

#### Rate Limiting

- Per-client quotas (configurable)
- DDoS protection via Vercel edge network
- No public unauthenticated endpoints

---

### Webhook Security

Pandora's implements **industry-standard webhook security**:

#### HMAC Signature Verification

```typescript
HMAC-SHA256(secret_key, raw_body) === x-pandoras-signature
```

- Algorithm: HMAC-SHA256
- Input: Raw request body (pre-parse)
- Comparison: `crypto.timingSafeEqual()` (timing-attack resistant)

#### Replay Protection

- Timestamp header: `x-pandoras-timestamp`
- Validation window: ±5 minutes
- Prevents replay attacks

#### Implementation

Located in: `@pandoras/core-webhooks` package

```typescript
export class CoreWebhookGuard {
  validateRequest(secret: string, signature: string, timestamp: string, body: string): boolean
}
```

---

## 3. Operational Controls

### Kill Switches

**Scope**: Granular emergency controls per subsystem

| Kill Switch       | Scope          | Activation     | Recovery      |
|-------------------|----------------|----------------|---------------|
| `WEBHOOKS_ENABLED`| All webhooks   | Config toggle  | Same-day      |
| Feature flags     | Specific flows | Admin panel    | Immediate     |

**Guardrails**:
- ✅ Double confirmation required
- ✅ Audit logged with operator wallet
- ✅ No data deletion on pause
- ✅ Events remain in queue (zero loss)

**Location**: `/admin/operations` (Super Admin only)

---

### Dead Letter Queue (DLQ)

**Purpose**: Isolate failed events for manual review

**Flow**:
1. Event fails after `MAX_RETRIES` (5)
2. Marked as `status = 'failed'`
3. Visible in Operations dashboard
4. Manual replay via event ID

**Safety Rules**:
- ❌ Never auto-replay financial events
- ✅ Only replay idempotent operations
- ✅ Verify side-effects before replay

---

### Incident Response

**Detection → Isolation → Fix → Replay**

1. **Detection**: Metrics alerts (DLQ size, error rate)
2. **Isolation**: Kill switch activation
3. **Fix**: Code/config deployment
4. **Replay**: Manual event processing

**No Destructive Actions**:
- No database deletion in production
- Config-first rollback (not code)
- Immutable audit trail

---

## 4. Observability & Monitoring

### Real-Time Metrics Dashboard

**Location**: `/admin/operations`

**Metrics Displayed**:
- Worker Status (Active/Paused)
- DLQ Size (failed events count)
- Error Rate (last hour)
- Pending Events (queue depth)

**Auto-Refresh**: 10 seconds

---

### Operational Queries

**DLQ Size**:
```sql
SELECT count(*) FROM webhook_events WHERE status = 'failed';
```

**Webhook Success Ratio (Last Hour)**:
```sql
SELECT
  count(*) FILTER (WHERE status = 'sent')::float / count(*) AS success_ratio
FROM webhook_events
WHERE created_at > now() - interval '1 hour';
```

**Error Rate (Last 15 min)**:
```sql
SELECT count(*) FILTER (WHERE status_code >= 500)::float / count(*)
FROM webhook_events
WHERE created_at > now() - interval '15 minutes';
```

---

### Audit Trail

**Immutable Logging**:
- All admin actions logged with wallet address
- Kill switch toggles recorded
- Manual replays tracked
- No log deletion capability

**Schema**: `audit_logs` table

---

## 5. Change Management

### Deployment Process

1. **Staging Deployment**
   - Automatic from `staging` branch
   - Soak test: 24-48 hours minimum
   - Simulated incident response

2. **Production Deployment**
   - Manual approval from `main` branch
   - Rollback plan documented
   - Zero-downtime via Vercel

### Protected Assets

- ✅ `main` branch: Protected, requires review
- ✅ Production DB: No direct access
- ✅ Environment variables: Vercel-managed, version-controlled
- ✅ Secrets rotation: Manual, documented

### Configuration Changes

**Logged and Auditable**:
- Environment variable updates
- Feature flag toggles
- API key rotations

---

## 6. Blockchain Safety

### Smart Contract Architecture

- **Immutability**: Contracts cannot be upgraded
- **Pausable Mechanisms**: Emergency pause capability (where applicable)
- **No Admin Overrides**: On-chain governance only

### Deployment Security

- **Separation of Trigger and Execution**:
  - Core: Triggers deployment
  - Protocol Deployer: Executes on-chain
  - No cross-contamination

- **Private Key Management**:
  - Deployer wallet: Environment-secured
  - No hot wallets in application code
  - Rotation via infrastructure update

### Transaction Safety

- RPC fallback with retry logic
- Explicit gas estimation
- Failure handling with detailed logs

---

## 7. Data Integrity & Privacy

### What We Store

- ✅ Project metadata (public)
- ✅ Webhook events (payload + status)
- ✅ API keys (hashed)
- ✅ User wallets (addresses only)

### What We DON'T Store

- ❌ Private keys
- ❌ Sensitive user data
- ❌ Plain-text secrets
- ❌ Full webhook payloads in logs

### Secret Management

- **Environment Variables**: Vercel-managed
- **API Keys**: SHA-256 hashed
- **Webhook Secrets**: Per-client, rotatable
- **Rotation Policy**: Manual, on-demand

---

## 8. Security Controls Summary

### What We DON'T Do (By Design)

| ❌ Never                         | ✅ Instead                        |
|----------------------------------|-----------------------------------|
| Manual contract mutation         | Immutable deployment only         |
| Unsigned webhooks                | HMAC + timestamp verification     |
| Shared staging/prod environments | Strict isolation                  |
| Silent retries without DLQ       | Failed → DLQ → Manual review      |
| Admin actions without audit      | All ops logged with wallet        |

---

## 9. Partner Integration - TL;DR

> **Pandora's implements industry-standard webhook security (HMAC + replay protection), strict environment isolation, immutable audit logs, and operator kill switches. All integrations are asynchronous, idempotent, and observable.**

### Integration Checklist for Partners

- [ ] Verify webhook signature on all incoming requests
- [ ] Implement idempotent event processing
- [ ] Monitor DLQ for failed deliveries
- [ ] Test replay scenarios in staging
- [ ] Document webhook endpoints and expected payloads

---

## 10. Compliance & Audit Support

### Available Documentation

1. **Technical Architecture**: This document
2. **Deployment Guide**: `DEPLOY.md`
3. **Webhook Specification**: `WEBHOOK_SPEC.md`
4. **API Documentation**: `/docs` (internal)

### Audit Artifacts

- Database schema dumps (sanitized)
- Webhook event logs (anonymized)
- Deployment history (Git commits)
- Incident response playbooks

### Contact for Security Review

**Incident Commander**: [Define User]  
**Technical Lead**: [Define User]  
**Chain Guardian**: [Define Wallet]

---

## Appendix A: Metrics Baseline (Steady State)

| Metric              | Expected Value    | Alert Threshold |
|---------------------|-------------------|-----------------|
| API Uptime          | 99.9%+            | < 99.9%         |
| Webhook Success     | 98%+              | < 98%           |
| DLQ Size            | 0                 | > 0 (warn), >10 (critical) |
| Average Retries     | < 0.5             | > 1.5           |
| P95 API Latency     | < 500ms           | > 2s            |
| Invalid Signatures  | 0                 | > 5/hour        |

---

## Appendix B: Incident Response Roles

| Role               | Responsibility                          | Authority                  |
|--------------------|-----------------------------------------|----------------------------|
| Incident Commander | Lead response, decide kill switch      | Full operational control   |
| On-Call Engineer   | First responder, diagnosis              | Read/investigate           |
| Chain Guardian     | Multisig/contract access                | On-chain emergency actions |

---

**Document Maintained By**: Pandora's Platform Team  
**Review Cycle**: Quarterly or after major incidents  
**Version Control**: GitHub repository `delBull/saaspandoras`

---

*This document is intended for auditors, partners, institutional integrators, and security review teams. For internal operational procedures, refer to `DEPLOY.md`.*

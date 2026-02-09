# Pandora's Core - Deployment & Rollback Guide

## 🚀 Deployment Strategy

### Staging (Sepolia)
- **Branch**: `staging`
- **URL**: `staging.saaspandoras.com`
- **Env Params**: `NODE_ENV=staging`, `CORE_ENV=staging`, plus Staging Keys.

### Production (Base Mainnet)
- **Branch**: `main`
- **URL**: `saaspandoras.com`
- **Env Params**: `NODE_ENV=production`, `CORE_ENV=production`, plus Production Keys.
- **Protection**: `main` branch should be protected (Code Freeze).

---

## � Incident Ownership (Production)

Define these roles clearly before Go-Live to avoid chaos.

| Role | Responsibility | Contact |
|------|----------------|---------|
| **Incident Commander** | Lead response, communication, and final decisions. | `[Define User]` |
| **On-Call Engineer** | First responder, investigation, mitigation execution. | `[Define User]` |
| **Chain Guardian** | Holds keys/multisig access to pause contracts/funds. | `[Define Wallet/User]` |

---

## 📊 Observability (Primary Signals)

In case of issues, check these metrics first:

1.  **Webhook Error Rate**: `SELECT count(*) FROM webhook_events WHERE status = 'failed' AND updated_at > NOW() - INTERVAL '1 hour'`
2.  **DLQ Size**: Total count of `status = 'failed'` events.
3.  **Deployment Latency**: Time between `created_at` and `updated_at` (sent) for successful events.
4.  **Failed by Client**: Group failures by `client_id` to identify specific integration breakages.

---

## ⚠️ Replay Safety Rules

> **Replay Rule**: Only replay **idempotent** events. Never replay events with financial or on-chain side-effects without manual verification of the state.

---

## �🚨 Rollback Plan (Emergency Procedures)

If a critical issue occurs in Production (especially with Core/Webhooks), follow these steps in order.

### Level 1: Isolate Damage (Kill Switch)
**Goal**: Stop outgoing events instantly without killing the app.
1. Go to Vercel/Railway Dashboard -> Environment Variables.
2. Set `WEBHOOKS_ENABLED=false`.
3. Redeploy (or restart service if possible without full build).
   - *Result*: `WebhookProcessor` will log warnings and skip all processing. Events stay `pending` in DB.

### Level 2: Pause Worker
**Goal**: Stop the background worker specifically.
- If using Vercel Cron: Disable the Cron Job in Vercel Dashboard project settings.
- If using external worker: Scale worker container to 0.

### Level 3: Version Rollback
**Goal**: Revert code to stable state.
1. `git revert <bad_commit_hash>` to create a new safe commit.
2. Push to `main`.
3. Wait for deployment.
   - *Note*: **DO NOT** manually rollback the database schema unless absolutely necessary (high risk).

### Level 4: On-Chain Safety (Extremely Critical)
If a smart contract bug is found:
1. **Pause UI**: Put the frontend in maintenance mode or hide specific actions.
2. **Contact Multisig/Owner**: Use the DAO/Multisig to pause contracts if Pausable.
3. **DO NOT Redeploy Contracts**: Contracts are immutable. You must deploy *new* ones and migrate (complex).

---

## 🔄 Recovery (Post-Fix)

After the fix is deployed:
1. **Re-enable Webhooks**: Set `WEBHOOKS_ENABLED=true`.
2. **Check DLQ**: Look for events with status `failed`.
3. **Replay**: Use the admin API to replay specific fixed events:
   ```bash
   POST /api/admin/webhooks/:eventId/replay
   ```
4. **Monitor**: Watch logs for "Successfully sent event".

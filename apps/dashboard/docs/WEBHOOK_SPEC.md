# Pandora Core – Webhook Specification

## 1. Overview
This document specifies the standard for asynchronous communication between **Pandora Core** and external Integration Clients (Edge Apps like Telegram bots, Mobile Apps, etc.).

**Version:** 1.0  
**Payload Version:** v1

## 2. Security (HMAC)
All webhooks are signed using `HMAC-SHA256`.

### Signature Generation
1. **Input:** The raw HTTP request body (UTF-8 bytes). **Do not** sign parsed objects.
2. **Secret:** The `callbackSecret` generated for the client.
3. **Algorithm:** `sha256`.
4. **Format:** Hexadecimal digest.

### HTTP Headers
| Header | Description |
| :--- | :--- |
| `Content-Type` | `application/json` |
| `x-core-signature` | The calculated HMAC-SHA256 signature (hex) |
| `x-core-event-id` | The unique UUID/ULID of the event |
| `x-core-version` | `v1` |
| `x-core-timestamp` | Unix timestamp (seconds) of the event |

### Verification Steps (Golden Path)
Clients **MUST** follow this order to prevent Replay Attacks and CPU exhaustion:

1. **Verify Timestamp First**: 
   - Check `x-core-timestamp`.
   - If older than 5 minutes (300s), **REJECT immediately**.
   - Do NOT compute HMAC yet.

2. **Verify Signature**:
   - Only if timestamp is valid.
   - Compute HMAC using the **Raw Body Buffer**.
   - Compare with `x-core-signature`.

### Example: Validation Implementation
```typescript
const TOLERANCE = 300; // 5 minutes

function verifyWebhook(req) {
  const timestamp = parseInt(req.headers['x-core-timestamp']);
  const now = Math.floor(Date.now() / 1000);

  // 1. Timestamp Check
  if (Math.abs(now - timestamp) > TOLERANCE) {
    throw new Error('Timestamp out of tolerance'); // Reject
  }

  // 2. Signature Check
  const signature = req.headers['x-core-signature'];
  const expected = crypto
    .createHmac('sha256', clientSecret)
    .update(req.rawBody) // Critical: Raw Buffer
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
     throw new Error('Invalid Signature');
  }
}
```

## 4. Golden Path Example: `deployment.completed`

1. **Trigger**: Protocol deployed on-chain.
2. **Core**:
   - Creates event `evt_123`.
   - Payload: `{ protocolId: "p_1", contract: "0x..." }`.
   - Signs `Buffer.from(payload)`.
   - Sends POST to `https://client.com/webhook`.
3. **Edge (Client)**:
   - Receives POST.
   - Checks `x-core-timestamp` (is it fresh?).
   - Checks `x-core-signature` (is it valid?).
   - **Action**: Updates local DB `isDeployed: true` & Notifies user on Telegram.
   - Responds `200 OK`.
4. **Core**:
   - Receives `200`.
   - Updates `webhook_events` status to `sent`.
   - Logs success in `audit_logs`.

## 5. Retry Policy & Dead Letter Queue (DLQ)

```typescript
interface PandoraWebhookEvent<T = unknown> {
  id: string;          // Unique Event ID (UUID)
  type: string;        // domain.action (e.g., 'deployment.completed')
  version: 'v1';       // Payload version
  timestamp: number;   // Unit timestamp (seconds)
  data: T;             // Event-specific data
}
```

### Supported Events
| Event Type | Description | Data Payload |
| :--- | :--- | :--- |
| `deployment.queued` | Protocol deployment queued | `{ protocolId: string }` |
| `deployment.completed` | Protocol successfully deployed | `{ protocolId: string, contractAddress: string, transactionHash: string }` |
| `deployment.failed` | Deployment failed | `{ protocolId: string, reason: string }` |
| `investment.created` | New investment recorded | `{ investmentId: string, amount: string, phaseId: string }` |

## 4. Retry Policy & Dead Letter Queue (DLQ)

Pandora Core guarantees **at-least-once** delivery with the following retry strategy (Exponential Backoff):

| Attempt | Delay |
| :--- | :--- |
| 1 | Immediate |
| 2 | +30s |
| 3 | +2m |
| 4 | +10m |
| 5 | +1h |
| 6 | **Moved to Dead Letter Queue (DLQ)** |

### Dead Letter Queue
Events that fail 5 retry attempts are marked as `dead`. They:
1. Are NOT retried automatically.
2. Require manual intervention via Admin API to retry.
3. Are explicitly flagged in Audit Logs.

## 5. Client Responsibilities
1. **Idempotency:** Clients MUST handle duplicate events using `id`.
2. **Signature Verification:** Clients MUST verify `x-core-signature` before processing.
3. **Status Codes:**
    - `2xx`: Acknowledged (stops retries).
    - `4xx/5xx`: Failure (triggers retry).

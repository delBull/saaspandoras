# Webhook Specification

> **Pandora's Core Webhook Protocol**  
> Version: v1 (Active)  
> Last Updated: February 2026

---

## Overview

Pandora's Core sends webhooks to registered integration clients when significant events occur (e.g., protocol deployment, NFT minting, phase transitions). This document specifies the technical contract for webhook delivery and verification.

---

## Event Versioning

| Version | Status | Release Date | Notes                      | Breaking Changes |
|---------|--------|--------------|----------------------------|------------------|
| v1      | Active | 2026-02     | Initial production version | N/A              |

**Version Policy**:
- Backwards-compatible changes (new fields) do not increment version
- Breaking changes (removed fields, changed types) require new version
- Version is included in webhook headers for client routing

---

## Webhook Delivery

### HTTP Request

```
POST {client_webhook_url}
Content-Type: application/json
x-pandoras-signature: {hmac_signature}
x-pandoras-timestamp: {unix_timestamp}
x-pandoras-version: v1
```

### Signature Verification

**Algorithm**: HMAC-SHA256

**Input**:
```
HMAC-SHA256(secret_key, raw_request_body)
```

**Comparison**: Use `crypto.timingSafeEqual()` to prevent timing attacks

**Example (Node.js)**:
```typescript
import crypto from 'crypto';

function verifyWebhook(secret: string, signature: string, body: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  
  if (signatureBuffer.length !== expectedBuffer.length) {
    return false;
  }
  
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}
```

---

### Replay Protection

**Timestamp Header**: `x-pandoras-timestamp` (Unix seconds)

**Validation Window**: ±5 minutes

**Logic**:
```typescript
const timestamp = parseInt(req.headers['x-pandoras-timestamp']);
const now = Math.floor(Date.now() / 1000);
const diff = Math.abs(now - timestamp);

if (diff > 300) { // 5 minutes
  throw new Error('Timestamp outside valid window');
}
```

---

## Base Payload Format

All events share this base structure:

```json
{
  "event": "event.type",
  "version": "v1",
  "id": "evt_uuid",
  "timestamp": 1706841600,
  "isSandbox": false,
  "data": { ... }
}
```

---

## Event Types

### `protocol.deployed`

Triggered when a full protocol is successfully deployed on-chain (V1 or V2).

**Payload**:
```json
{
  "event": "protocol.deployed",
  "version": "v1",
  "data": {
    "projectId": "uuid",
    "projectName": "Example DAO",
    "chainId": 11155111,
    "protocolVersion": 2,
    "pageLayoutType": "Access",
    "contracts": {
      "token": "0x...",
      "governor": "0x...",
      "loom": "0x...",
      "timelock": "0x...",
      "registry": "0x..." 
    },
    "artifacts": [
      { "name": "Access Pass", "address": "0x...", "symbol": "VHORA" }
    ],
    "deployer": "0x..."
  }
}
```

---

### `project.application_submitted`

Triggered when a new project application is submitted by a user.

**Payload**:
```json
{
  "event": "project.application_submitted",
  "version": "v1",
  "data": {
    "projectId": "uuid",
    "title": "New Green Tech",
    "category": "environmental",
    "applicantWallet": "0x...",
    "targetAmount": "50000"
  }
}
```

---

### `nft.minted`

Triggered when an NFT access pass is minted.

**Payload**:
```json
{
  "event": "nft.minted",
  "version": "v1",
  "data": {
    "projectId": "uuid",
    "contractAddress": "0x...",
    "tokenId": 1,
    "recipient": "0x...",
    "phaseId": "uuid"
  }
}
```

---

### `gamification.event`

Triggered when a user earns points or a badge within the Pandora ecosystem.

**Payload**:
```json
{
  "event": "gamification.event",
  "version": "v1",
  "data": {
    "userWallet": "0x...",
    "eventType": "protocol_deployed",
    "pointsEarned": 500,
    "metadata": {
      "projectId": "uuid",
      "projectTitle": "Example DAO"
    }
  }
}
```

---

## Retry Policy

**Attempts**: Up to 5 retries

**Backoff**: Exponential (2^attempt seconds)
- Attempt 1: Immediate
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4: 8 seconds
- Attempt 5: 16 seconds

**Failure Criteria**:
- Non-2xx HTTP response
- Timeout (30 seconds)
- Network error

**Dead Letter Queue (DLQ)**:
- After 5 failed attempts, event marked as `status='failed'`
- Visible in Operations dashboard
- Manual replay available via `/admin/operations`

---

## Idempotency

**Critical**: Clients MUST implement idempotent event processing.

**Reasons for Duplicate Delivery**:
- Network retries
- Manual replay by operators
- Infrastructure failover

**Recommended Approach**:
```typescript
// Use event ID + timestamp as deduplication key
const eventKey = `${event.event}:${event.timestamp}:${event.data.projectId}`;

if (await cache.exists(eventKey)) {
  return; // Already processed
}

await processEvent(event);
await cache.set(eventKey, true, { ttl: 86400 }); // 24h
```

---

## Security Best Practices

### For Integration Clients

1. **Always verify signature** before processing
2. **Validate timestamp** to prevent replay attacks
3. **Use HTTPS** for webhook URLs
4. **Implement rate limiting** on your endpoint
5. **Log all webhook attempts** for audit

### For Pandora Core

1. **Never log secret keys**
2. **Use HTTPS only** for delivery
3. **Rotate secrets** on client request
4. **Monitor DLQ size** for systemic issues

---

## Testing

### Staging Environment

**Webhook URL**: Register test endpoint in Staging dashboard

**Test Events**: Available via Admin panel → Send Test Webhook

### Signature Verification Test

Use this test secret and payload:

```
Secret: test_secret_key_12345
Payload: {"event":"protocol.deployed","version":"v1","timestamp":1706841600,"data":{}}
Expected Signature: 8f3e9d2c1a4b5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z
```

---

## Error Handling

### Client Response Codes

| Code | Meaning | Pandora Action |
|------|---------|----------------|
| 200  | Success | Mark as sent |
| 429  | Rate limit | Retry with backoff |
| 500-599 | Server error | Retry with backoff |
| 401  | Invalid signature | Alert (potential key issue) |
| 404  | Endpoint not found | Alert (config issue) |

---

## Support

**For Integration Issues**:
- Verify signature implementation
- Check timestamp validation
- Review DLQ in Operations dashboard

**For Webhook Failures**:
- Check client endpoint HTTPS certificate
- Verify firewall allows Pandora's IP ranges
- Test with manual replay in `/admin/operations`

---

**Specification Version**: v1  
**Maintained By**: Pandora's Platform Team  
**Review Cycle**: Quarterly or when adding new event types

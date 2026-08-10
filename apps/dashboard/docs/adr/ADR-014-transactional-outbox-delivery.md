# ADR-014 — Transactional Outbox Delivery Semantics

**Status:** Accepted  
**Date:** 2026-08-08  
**Decision Type:** Architectural  
**Scope:** Event-Driven Architecture / Delivery Guarantees / Background Processing  
**Depends On:** ADR-013, ADR-011  
**Sprint:** 25  

---

## 1. Context

Pandora's Growth OS relies heavily on deterministic transitions and organizational governance. When a user approves an `OperationalIntent`, a `PostgresApprovalTransaction` updates three things atomically in PostgreSQL:
1. The `OperationalIntent` status.
2. The `governance_events` log (Audit Trail).
3. The `outbox_events` table.

This creates the guarantee that *an event is reliably stored exactly when the domain state changes*. However, storing the event is only half the battle. We must now **deliver** the event to consumers (e.g., Execution OS, Webhooks, Campaign Managers). 

The system currently lacks a processor to read the `outbox_events` table and hand off these events to consumers safely without duplicates being inappropriately handled or failing silently.

## 2. Decision

We will implement a **PostgreSQL-native Transactional Outbox Processor** with **At-Least-Once Delivery** semantics and **Idempotent Consumers**. 

We explicitly **REJECT** the introduction of external message brokers (Kafka, RabbitMQ, SQS, Redis Pub/Sub) for Sprint 25. The complexity, maintenance overhead, and networking partitioning risks of these tools are unwarranted at our current scale, where Postgres `FOR UPDATE SKIP LOCKED` can easily handle thousands of concurrent outbox polls.

### 2.1 Semantics of Delivery Guarantee

- **At-Least-Once Delivery:** The processor guarantees it will invoke the consumer *at least once* for every pending outbox event.
- **Idempotency Requirement:** Because the delivery is at-least-once, a crash *after* consumer execution but *before* the outbox row is marked `processed` will result in a retry. All downstream consumers **must** be idempotent.
- **No Exactly-Once:** Attempting exactly-once distributed messaging is theoretically impossible or practically expensive. We embrace idempotency instead.

### 2.2 Event Lifecycle & Statuses

Events in `outbox_events` will cycle through the following states:

1. **`pending`**: Event was inserted by the domain transaction and is waiting to be processed.
2. **`processing`**: A worker has claimed the event (leasing) and is currently executing it.
3. **`processed`**: The consumer executed successfully. The event is kept for history/audit but is ignored by workers.
4. **`failed`**: The consumer failed permanently (after max retries) or threw a non-retryable error. The event requires manual intervention.

### 2.3 Atomic Claiming (Leasing)

Workers will claim events using standard PostgreSQL row-level locks:
```sql
UPDATE outbox_events
SET status = 'processing', locked_at = NOW(), locked_by = $1, attempts = attempts + 1
WHERE id IN (
  SELECT id FROM outbox_events 
  WHERE status = 'pending' 
     OR (status = 'processing' AND locked_at < NOW() - INTERVAL '5 minutes') -- Dead worker recovery
  ORDER BY created_at ASC 
  FOR UPDATE SKIP LOCKED 
  LIMIT $2
)
RETURNING *;
```
- `SKIP LOCKED` guarantees that concurrent workers do not block each other and never claim the same row.
- `locked_at < NOW() - INTERVAL 'X'` acts as a timeout recovery mechanism in case a worker node dies mid-processing.

### 2.4 Retry Policy & Dead Letters

- Workers will capture consumer exceptions.
- If an exception is thrown, the event reverts to `pending` with `last_error` populated.
- Exponential backoff can be applied based on the `attempts` count (e.g., `created_at + (2^attempts) minutes`).
- If `attempts` exceeds a threshold (e.g., 5), the event transitions to `failed` (Dead Letter Queue logic), generating an alert for human intervention.

## 3. Architectural Invariants

1. **PostgreSQL as Source of Truth:** No other queuing systems are permitted yet.
2. **Atomic Commits:** The initial insertion into the outbox *must* share a transaction with the domain mutation.
3. **Idempotent Handlers:** Any function handling an outbox event must safely tolerate being called twice with the same payload.
4. **No Infinite Loops:** Max retries must always be enforced.

## 4. Consequences

**Positive:**
- Extremely robust delivery without adding new infrastructure layers (Redis/Kafka).
- Perfect transactional integrity; zero risk of "dual-write" anomalies.
- Simpler local development (only Postgres required).

**Negative:**
- Requires careful discipline when writing consumer logic to ensure idempotency.
- Database polling adds slight latency compared to push-based pub/sub, which is acceptable for background execution.
- If volume scales to tens of thousands of events per second, database CPU for polling locks could become a bottleneck (at which point we would swap the adapter for Kafka).

**ADR-014 remains ACCEPTED.**

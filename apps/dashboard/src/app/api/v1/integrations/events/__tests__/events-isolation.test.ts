import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";
import { IntegrationKeyService } from "@/lib/integrations/auth";
import { db } from "@saasfly/db-core";

vi.mock("@/lib/integrations/auth", () => ({
  IntegrationKeyService: {
    validateKey: vi.fn(),
  },
}));

vi.mock("@saasfly/db-core", () => ({
  db: {
    query: {
      platformEvents: {
        findFirst: vi.fn(),
      },
      marketingIdentities: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 1, canonicalId: "canon_1", primaryEmail: "user@tenant-a.com" }]),
      }),
    }),
  },
  platformEvents: { id: "id", idempotencyKey: "idempotencyKey" },
  canonicalIdentities: { id: "id", canonicalId: "canonicalId" },
  marketingIdentities: { id: "id", phone: "phone", email: "email", fingerprint: "fingerprint" },
  users: { id: "id" },
  eq: vi.fn((a, b) => ({ a, b })),
  or: vi.fn((...conds) => conds),
}));

describe("POST /api/v1/integrations/events - Strict Tenant Scope Isolation (P0)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects with 403 when event.projectId does not match authorized client's projectId", async () => {
    (IntegrationKeyService.validateKey as any).mockResolvedValue({
      id: "client-uuid-1",
      name: "Tenant A Client",
      projectId: 101, // Bound to Project 101
      environment: "production",
      isActive: true,
      permissions: ["events:write"],
    });

    const maliciousPayload = {
      eventId: "evt_hijack_123",
      eventType: "lead.new",
      source: { system: "external_crm" },
      occurredAt: new Date().toISOString(),
      correlationId: "corr_123",
      projectId: "999", // Attempting to publish to Project 999
      payload: { email: "attacker@target.com" },
    };

    const req = new NextRequest("http://localhost:3000/api/v1/integrations/events", {
      method: "POST",
      headers: {
        Authorization: "Bearer sk_live_testkey123",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(maliciousPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe("FORBIDDEN_RESOURCE_SCOPE");
    expect(data.message).toContain("cannot publish events for project 999");

    // Ensure NO events were inserted into database
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("accepts event and binds projectId when matching authorized client", async () => {
    (IntegrationKeyService.validateKey as any).mockResolvedValue({
      id: "client-uuid-1",
      name: "Tenant A Client",
      projectId: 101,
      environment: "production",
      isActive: true,
      permissions: ["events:write"],
    });

    (db.query.platformEvents.findFirst as any).mockResolvedValue(null);

    const validPayload = {
      eventId: "evt_legit_456",
      eventType: "lead.new",
      source: { system: "external_crm" },
      occurredAt: new Date().toISOString(),
      correlationId: "corr_456",
      projectId: "101",
      payload: { email: "user@tenant-a.com" },
    };

    const req = new NextRequest("http://localhost:3000/api/v1/integrations/events", {
      method: "POST",
      headers: {
        Authorization: "Bearer sk_live_testkey123",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe("success");
    expect(data.eventId).toBe("evt_legit_456");
  });
});

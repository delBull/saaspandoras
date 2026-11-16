import { describe, it, expect } from "vitest";
import { POST } from "../route";
import { NextRequest } from "next/server";

describe("Hermes Ask x402 Route", () => {
  it("challenges anonymous agents with HTTP 402 and $0.05 USDC price terms", async () => {
    const req = new NextRequest("https://dash.pandoras.finance/api/v1/hermes/ask", {
      method: "POST",
      body: JSON.stringify({ prompt: "Analyze the fractional yield of S'Narai" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(402);

    const paymentHeader = res.headers.get("PAYMENT-REQUIRED");
    expect(paymentHeader).toBeTruthy();

    const decoded = JSON.parse(Buffer.from(paymentHeader!, "base64").toString("utf-8"));
    expect(decoded.amountUsd).toBe(0.05);
    expect(decoded.currency).toBe("USDC");
    expect(decoded.network).toBe("eip155:84532");
  });
});

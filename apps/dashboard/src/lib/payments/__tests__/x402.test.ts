import { describe, it, expect } from "vitest";
import {
  buildX402Challenge,
  extractX402Payment,
  attachX402Receipt,
  type X402PaymentConfig,
  type X402ChallengeTerms,
} from "../x402";
import { NextRequest, NextResponse } from "next/server";

describe("x402 Protocol Engine", () => {
  const dummyConfig: X402PaymentConfig = {
    priceUsd: 0.01,
    description: "Test Agora NAV Endpoint",
    chainId: 84532,
    treasuryWallet: "0xc52bb6f53c91ff7134e7508b102e5a22ba415954",
  };

  it("buildX402Challenge returns HTTP 402 with base64 PAYMENT-REQUIRED header and terms", async () => {
    const res = buildX402Challenge(dummyConfig);
    expect(res.status).toBe(402);

    const paymentRequiredHeader = res.headers.get("PAYMENT-REQUIRED");
    expect(paymentRequiredHeader).toBeTruthy();

    const decoded = JSON.parse(
      Buffer.from(paymentRequiredHeader!, "base64").toString("utf-8")
    ) as X402ChallengeTerms;

    expect(decoded.x402Version).toBe("2.0");
    expect(decoded.scheme).toBe("exact");
    expect(decoded.amountUsd).toBe(0.01);
    expect(decoded.currency).toBe("USDC");
    expect(decoded.network).toBe("eip155:84532");
    expect(decoded.payTo).toBe("0xc52bb6f53c91ff7134e7508b102e5a22ba415954");

    const body = (await res.json()) as {
      error: string;
      statusCode: number;
      x402: X402ChallengeTerms;
    };
    expect(body.error).toBe("PAYMENT_REQUIRED");
    expect(body.statusCode).toBe(402);
    expect(body.x402.amountUsd).toBe(0.01);
  });

  it("extractX402Payment handles direct txHash from PAYMENT-SIGNATURE", () => {
    const validHash =
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const req = new NextRequest("https://example.com/api/test", {
      headers: { "PAYMENT-SIGNATURE": validHash },
    });

    const proof = extractX402Payment(req);
    expect(proof).not.toBeNull();
    expect(proof?.txHash).toBe(validHash as `0x${string}`);
  });

  it("extractX402Payment handles x-payment header with json payload", () => {
    const validHash =
      "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const payload = JSON.stringify({ txHash: validHash, chainId: 8453 });
    const req = new NextRequest("https://example.com/api/test", {
      headers: { "x-payment": payload },
    });

    const proof = extractX402Payment(req);
    expect(proof).not.toBeNull();
    expect(proof?.txHash).toBe(validHash as `0x${string}`);
    expect(proof?.chainId).toBe(8453);
  });

  it("extractX402Payment handles Authorization: x402 <base64>", () => {
    const validHash =
      "0x9999567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const encoded = Buffer.from(JSON.stringify({ txHash: validHash })).toString("base64");
    const req = new NextRequest("https://example.com/api/test", {
      headers: { Authorization: `x402 ${encoded}` },
    });

    const proof = extractX402Payment(req);
    expect(proof).not.toBeNull();
    expect(proof?.txHash).toBe(validHash as `0x${string}`);
  });

  it("extractX402Payment returns null when no payment proof provided", () => {
    const req = new NextRequest("https://example.com/api/test");
    const proof = extractX402Payment(req);
    expect(proof).toBeNull();
  });

  it("attachX402Receipt sets base64 PAYMENT-RESPONSE header", () => {
    const res = NextResponse.json({ success: true });
    const receipt = {
      txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" as `0x${string}`,
      amountUsd: 0.01,
    };

    const updated = attachX402Receipt(res, receipt);
    const receiptHeader = updated.headers.get("PAYMENT-RESPONSE");
    expect(receiptHeader).toBeTruthy();

    const decoded = JSON.parse(
      Buffer.from(receiptHeader!, "base64").toString("utf-8")
    ) as {
      settled: boolean;
      amountUsd: number;
      txHash: string;
    };
    expect(decoded.settled).toBe(true);
    expect(decoded.amountUsd).toBe(0.01);
    expect(decoded.txHash).toBe(receipt.txHash);
  });
});

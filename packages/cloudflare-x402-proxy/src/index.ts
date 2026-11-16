/**
 * Cloudflare Worker: x402 Scraper Monetization Proxy for Pandoras & Narai.
 *
 * Intercepts AI crawlers and bots (GPTBot, ClaudeBot, PerplexityBot, Bytespider, etc.)
 * and requires a $0.001 USDC micropayment per page render/scrape via the x402 protocol,
 * while allowing normal human browser traffic to pass through freely.
 */

export interface Env {
  ORIGIN_URL: string;
  PAY_TO: string;
  NETWORK: string;
  SCRAPER_PRICE: string;
  FACILITATOR_URL: string;
}

// Known autonomous AI crawlers and scrapers
const AI_CRAWLER_USER_AGENTS = [
  "gptbot",
  "chatgpt-user",
  "claudebot",
  "anthropic-ai",
  "perplexitybot",
  "bytespider",
  "applebot-extended",
  "ccbot",
  "cohere-ai",
  "diffbot",
  "omgili",
  "facebookexternalhit",
  "google-extended",
];

function isAiCrawler(userAgent: string | null): boolean {
  if (!userAgent) return true; // Anonymous requests treated as bot crawlers
  const ua = userAgent.toLowerCase();
  return AI_CRAWLER_USER_AGENTS.some((bot) => ua.includes(bot));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const userAgent = request.headers.get("user-agent");

    // Allow static assets, favicon, and discovery manifests freely
    if (
      url.pathname.startsWith("/.well-known/") ||
      url.pathname === "/llms.txt" ||
      url.pathname.endsWith(".ico") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".css") ||
      url.pathname.endsWith(".js")
    ) {
      return fetch(new Request(new URL(url.pathname + url.search, env.ORIGIN_URL), request));
    }

    // 1. If human user, pass through directly to origin
    if (!isAiCrawler(userAgent)) {
      return fetch(new Request(new URL(url.pathname + url.search, env.ORIGIN_URL), request));
    }

    // 2. AI Crawler detected — check x402 Payment Header
    const paymentSig =
      request.headers.get("PAYMENT-SIGNATURE") ||
      request.headers.get("payment-signature") ||
      request.headers.get("x-payment") ||
      request.headers.get("X-Payment");

    if (!paymentSig) {
      // 3. Challenge with HTTP 402 Payment Required
      const terms = {
        x402Version: "2.0",
        scheme: "exact",
        price: env.SCRAPER_PRICE,
        currency: "USDC",
        network: env.NETWORK,
        payTo: env.PAY_TO,
        facilitator: env.FACILITATOR_URL,
        description: `Autonomous Scrape Access for ${url.pathname}`,
        instructions: `Send ${env.SCRAPER_PRICE} USDC on Base to ${env.PAY_TO}, then retry with header 'PAYMENT-SIGNATURE: <txHash>'`,
      };

      const encodedTerms = btoa(JSON.stringify(terms));

      return new Response(
        JSON.stringify({
          error: "PAYMENT_REQUIRED",
          statusCode: 402,
          message: "AI crawler detected. Programmatic access requires x402 micropayment.",
          x402: terms,
        }),
        {
          status: 402,
          headers: {
            "Content-Type": "application/json",
            "PAYMENT-REQUIRED": encodedTerms,
            "x402-version": "2.0",
          },
        }
      );
    }

    // 4. Verify payment proof with Facilitator
    try {
      const facilitatorVerifyUrl = `${env.FACILITATOR_URL}/verify`;
      const verifyRes = await fetch(facilitatorVerifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentSignature: paymentSig,
          payTo: env.PAY_TO,
          network: env.NETWORK,
        }),
      });

      if (verifyRes.ok) {
        // Proxy to origin with payment confirmed
        const originReq = new Request(new URL(url.pathname + url.search, env.ORIGIN_URL), request);
        const originRes = await fetch(originReq);
        const modifiedRes = new Response(originRes.body, originRes);
        modifiedRes.headers.set("PAYMENT-RESPONSE", btoa(JSON.stringify({ settled: true })));
        return modifiedRes;
      }
    } catch {
      // If facilitator is temporarily down, fail-closed with 402 challenge
    }

    // Payment verification failed
    return new Response(
      JSON.stringify({
        error: "PAYMENT_VERIFICATION_FAILED",
        statusCode: 402,
        message: "Invalid or expired payment signature provided.",
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  },
};

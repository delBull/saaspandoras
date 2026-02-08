import { NextRequest, NextResponse } from "next/server";
import { IntegrationKeyService } from "./auth";

/**
 * Integration Guard Logic
 * - Rate Limiting (TODO: use Redis/Upstash)
 * - Environment Enforcement
 * - Auth Validation
 */
export async function integrationGuard(req: NextRequest) {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { error: "Unauthorized", status: 401 };
    }

    const key = authHeader.split(" ")[1] || "";
    const client = await IntegrationKeyService.validateKey(key);

    if (!client) {
        return { error: "Invalid Key", status: 401 };
    }

    // Environment Check (Header match)
    const envHeader = req.headers.get("X-Pandora-Environment");
    if (envHeader && envHeader !== client.environment) {
        return {
            error: `Environment Mismatch: Key is for '${client.environment}' but header says '${envHeader}'`,
            status: 400
        };
    }

    // Rate Limit Check (Mock for now)
    // const rateLimitResult = await rateLimiter.limit(client.id);
    // if (!rateLimitResult.success) return { error: "Rate Limit Exceeded", status: 429 };

    return { client };
}

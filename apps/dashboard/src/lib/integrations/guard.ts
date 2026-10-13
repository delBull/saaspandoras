import type { NextRequest } from "next/server";
import { IntegrationKeyService } from "./auth";

export interface IntegrationGuardOptions {
    requiredCapability?: string;
    targetProjectId?: number | string;
    allowedEnvironments?: ('staging' | 'production')[];
}

export interface IntegrationGuardSuccess {
    client: NonNullable<Awaited<ReturnType<typeof IntegrationKeyService.validateKey>>>;
    authorizedProjectId: number | null;
    environment: 'staging' | 'production';
}

export type IntegrationGuardResult =
    | { ok: true; client: IntegrationGuardSuccess['client'] }
    | { ok: false; error: string; status: number };

/**
 * Universal Integration Guard Logic (FC-001 / FC-003 / FC-006)
 * Pipeline: Auth → Identity → Capability Check → Resource Scope Gate → Environment Enforcement
 */
export async function integrationGuard(
    req: NextRequest | Request,
    options: IntegrationGuardOptions = {}
): Promise<IntegrationGuardResult> {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        return { ok: false, error: "Missing or malformed Authorization header. Expected 'Bearer <key>'", status: 401 };
    }

    const key = authHeader.replace("Bearer ", "").trim();
    const client = await IntegrationKeyService.validateKey(key);

    if (!client) {
        return { ok: false, error: "Invalid, revoked or inactive integration API Key", status: 401 };
    }

    // 1. Environment Enforcement
    const envHeader = req.headers.get("X-Pandora-Environment");
    if (envHeader && envHeader !== client.environment) {
        return {
            ok: false,
            error: `Environment Mismatch: Key is for '${client.environment}' but request declared '${envHeader}'`,
            status: 400
        };
    }

    if (options.allowedEnvironments && !options.allowedEnvironments.includes(client.environment)) {
        return {
            ok: false,
            error: `Environment '${client.environment}' is not authorized for this operation.`,
            status: 403
        };
    }

    // 2. Capability Check
    if (options.requiredCapability) {
        const permissions = Array.isArray(client.permissions) ? (client.permissions as string[]) : [];
        const hasDirectCapability = permissions.includes(options.requiredCapability);
        // Fallback backward compatibility for legacy lead:write -> events:write transition
        const hasLegacyFallback = options.requiredCapability === 'events:write' && permissions.includes('lead:write');

        if (!hasDirectCapability && !hasLegacyFallback) {
            return {
                ok: false,
                error: `FORBIDDEN_CAPABILITY: Integration Key lacks required capability '${options.requiredCapability}'`,
                status: 403
            };
        }
    }

    // 3. Resource Scope Gate (FC-006)
    if (options.targetProjectId !== undefined && client.projectId !== null && client.projectId !== undefined) {
        const targetIdStr = options.targetProjectId.toString().trim();
        const clientProjectIdStr = client.projectId.toString();
        if (targetIdStr && targetIdStr !== clientProjectIdStr) {
            return {
                ok: false,
                error: `FORBIDDEN_RESOURCE_SCOPE: Integration Key is bound to project ${client.projectId} and cannot operate on project ${options.targetProjectId}.`,
                status: 403
            };
        }
    }

    return { ok: true, client };
}

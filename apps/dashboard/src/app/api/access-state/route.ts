import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users, securityEvents, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { config } from "@/config";
import { isAdmin } from "@/lib/auth";
import { AccessState } from "@/lib/access/state-machine";
import { withTimeout, accessCache, isRateLimited, dbBreaker } from "@/lib/access/resilience";
import { resolveUXConfig } from "@/lib/access/experiment-engine";

export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
    const start = Date.now();
    try {
        const { searchParams } = new URL(req.url);
        const walletParam = searchParams.get("wallet")?.toLowerCase();
        
        const headerList = await headers();
        const ip = headerList.get("x-forwarded-for") || "unknown";
        
        // 🛑 1. RATE LIMITING (Security Rule)
        if (await isRateLimited(ip, 20, 60000)) {
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("__pbox_sid")?.value || 
                      cookieStore.get("auth_token")?.value ||
                      cookieStore.get("pbox_session_v3")?.value;

        // 🛡️ 2. NO TOKEN -> Adaptive Lead UX
        if (!token) {
            const ux = await resolveUXConfig(walletParam || undefined, AccessState.NO_WALLET, false);
            return NextResponse.json({ 
                state: walletParam ? AccessState.NO_SESSION : AccessState.NO_WALLET,
                authenticated: false,
                ux
            });
        }

        // 🔐 3. HARDENED JWT VERIFICATION (Consolidated)
        const { verifyJWT } = await import("@/lib/auth");
        const payload = await verifyJWT(token);

        if (!payload) {
            console.warn(`🔒 [StripeEngine] Token Verification Failed (Consolidated)`);
            return NextResponse.json({ state: AccessState.NO_SESSION, authenticated: false }, { status: 401 });
        }

        // AUTHORITY: Address MUST come from JWT, never from searchParams.
        const address = payload.address?.toLowerCase();
        if (!address) return NextResponse.json({ state: AccessState.NO_SESSION }, { status: 401 });

        // 🧊 4. DISTRIBUTED CACHE LAYER (Eliminate SPOF)
        const cacheKey = `access:${address}`;
        const cached = await accessCache.get<any>(cacheKey);
        if (cached) {
            const ux = await resolveUXConfig(address, cached.state, cached.isAdmin);
            return NextResponse.json({ ...cached, ux });
        }

        // 🏎️ 5. DISTRIBUTED RESILIENCE (Circuit Breaker + Timeouts)
        if (dbBreaker.isOpen()) {
            console.error("🚫 [StripeEngine] Circuit Breaker: DB is OPEN. Falling back to local/error.");
            throw new Error("Service Temporarily Degraded");
        }

        try {
            const { withRetry } = await import("@/lib/database");

            const [isUserAdmin, dbUser] = await withRetry(async () => {
                return await Promise.all([
                    withTimeout(isAdmin(address), 5000, false),
                    withTimeout(
                        db.query.users.findFirst({ where: eq(users.walletAddress, address) }),
                        5000,
                        null
                    )
                ]);
            });

            const isStaging = process.env.NEXT_PUBLIC_APP_ENV === "staging";
            const userIsAdmin = !!isUserAdmin || isStaging;

            let hasNFTPermission = dbUser?.hasPandorasKey || false;
            if (userIsAdmin) hasNFTPermission = true;

            // 🛡️ 5.b FETCH GLOBAL CONFIG (Phase 89)
            // Project #15 is the Source of Truth for Global Engine Settings
            const globalProject = await withTimeout(
                db.select({ w2eConfig: projects.w2eConfig }).from(projects).where(eq(projects.id, 15)).limit(1),
                2000,
                []
            );
            const globalMetadata = (globalProject[0]?.w2eConfig as any) || {};
            
            // Dynamic flags (Database overrides Environment)
            const isBetaOpen = globalMetadata.betaOpen ?? config.betaOpen;
            const isRitualEnabled = globalMetadata.ritualEnabled ?? true;

            // 🧠 6. RESOLVE STATE & BEHAVIORAL SCORING
            let resolvedState = AccessState.WALLET_NO_ACCESS;
            
            if (userIsAdmin) {
                resolvedState = AccessState.ADMIN;
                hasNFTPermission = true; // Force access for Admin
            } else if (hasNFTPermission) {
                // If Beta is CLOSED, even NFT holders are kept in the Ritual (WALLET_NO_ACCESS)
                if (isBetaOpen) {
                    resolvedState = AccessState.HAS_ACCESS;
                } else {
                    resolvedState = AccessState.WALLET_NO_ACCESS;
                }
            }

            // If Ritual is disabled, we bypass WALLET_NO_ACCESS for anyone with NFT or Admin
            if (!isRitualEnabled && hasNFTPermission && !userIsAdmin) {
                resolvedState = AccessState.HAS_ACCESS;
            }

            // Growth Weapon: Adaptive Scarcity & Social Pressure
            const ux = await resolveUXConfig(address, resolvedState, !!userIsAdmin);
            
            // Inject dynamic scarcity if in ritual
            if (resolvedState === AccessState.WALLET_NO_ACCESS) {
                const pressureLevel = 0.65 + (Math.random() * 0.2); // Simulated pressure
                ux.scarcityHint = `Remaining: ${Math.floor(pressureLevel * 40)} keys in this sector.`;
            }

            const responseData = {
                state: resolvedState,
                authenticated: true,
                isAdmin: !!userIsAdmin,
                hasAccess: hasNFTPermission,
                betaOpen: isBetaOpen,
                ritualEnabled: isRitualEnabled,
                user: {
                    address,
                    hasAccess: hasNFTPermission || !!userIsAdmin,
                    isAdmin: !!userIsAdmin,
                    tier: dbUser?.benefitsTier || 'standard',
                    pressureLevel: resolvedState === AccessState.WALLET_NO_ACCESS ? 0.72 : 0
                },
                ux
            };

            // 💾 7. DISTRIBUTED SYNC & AUDIT
            // Non-blocking catch to ensure API response regardless of Redis/Audit health
            await accessCache.set(cacheKey, responseData, 30).catch(() => {});

            db.insert(securityEvents).values({
                userId: dbUser?.id || null,
                type: "ACCESS_CHECK",
                ip,
                userAgent: headerList.get("user-agent") || "unknown",
                metadata: { 
                    address, 
                    state: resolvedState, 
                    latency: Date.now() - start,
                    isAdmin: !!isUserAdmin 
                }
            }).catch(() => {});

            return NextResponse.json(responseData);

        } catch (e) {
            dbBreaker.recordFailure();
            console.error("🚫 [StripeEngine] Critical Resilience Failure:", e);
            throw e;
        }

    } catch (error: any) {
        console.error("🔥 [StripeEngine] Distributed Error Trace:", error);
        
        // PRINCIPAL STABILITY FIX: 
        // Return 200 with ERROR state instead of 500 Internal Server Error.
        return NextResponse.json({ 
            state: AccessState.ERROR,
            authenticated: false,
            error: error.message || "Distributed Resilience Layer Engaged",
            infrastructure: true,
            // 🛠️ DEV DIAGNOSTICS: expose raw error for local debugging
            _dev_debug: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                code: error.code,
                cause: error.cause?.message || error.cause
            } : undefined,
            latency: Date.now() - start
        }, { status: 200 }); // "Soft Error" for UI stability
    }
}

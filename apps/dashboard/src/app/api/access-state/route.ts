import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/db";
import { users, securityEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
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
        const token = cookieStore.get("auth_token")?.value;

        // 🛡️ 2. NO TOKEN -> Adaptive Lead UX
        // (Always prioritize explicit wallet context if present for UX hints)
        if (!token) {
            const ux = await resolveUXConfig(walletParam || undefined, AccessState.NO_WALLET, false);
            return NextResponse.json({ 
                state: walletParam ? AccessState.NO_SESSION : AccessState.NO_WALLET,
                authenticated: false,
                ux
            });
        }

        // 🔐 3. HARDENED JWT VERIFICATION
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("Infrastructure Security Error: Secret Missing");

        let payload: any;
        try {
            payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
        } catch (e) {
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
            const [isUserAdmin, dbUser] = await Promise.all([
                withTimeout(isAdmin(address), 300, false),
                withTimeout(
                    db.query.users.findFirst({ where: eq(users.walletAddress, address) }),
                    500,
                    null
                )
            ]);

            dbBreaker.recordSuccess();

            const hasNFTPermission = dbUser?.hasPandorasKey || false;

            // 🧠 6. RESOLVE STATE & BEHAVIORAL SCORING
            let resolvedState = AccessState.WALLET_NO_ACCESS;
            if (isUserAdmin) resolvedState = AccessState.ADMIN;
            else if (hasNFTPermission) resolvedState = AccessState.HAS_ACCESS;

            // Growth Weapon: Adaptive Scarcity & Social Pressure
            const ux = await resolveUXConfig(address, resolvedState, !!isUserAdmin);
            
            // Inject dynamic scarcity if in ritual
            if (resolvedState === AccessState.WALLET_NO_ACCESS) {
                const pressureLevel = 0.65 + (Math.random() * 0.2); // Simulated pressure
                ux.scarcityHint = `Remaining: ${Math.floor(pressureLevel * 40)} keys in this sector.`;
            }

            const responseData = {
                state: resolvedState,
                authenticated: true,
                isAdmin: !!isUserAdmin,
                hasAccess: hasNFTPermission,
                user: {
                    address,
                    hasAccess: hasNFTPermission,
                    isAdmin: !!isUserAdmin,
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
        // This prevents the SPA from crashing and allows for graceful UI retries.
        return NextResponse.json({ 
            state: AccessState.ERROR,
            authenticated: false,
            error: error.message || "Distributed Resilience Layer Engaged",
            infrastructure: true,
            latency: Date.now() - start
        }, { status: 200 }); // "Soft Error" for UI stability
    }
}

import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { db } from "@/db";
import { users, securityEvents, projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { config } from "@/config";
import { isAdmin } from "@/lib/auth";
import { AccessState } from "@/lib/access/state-machine";
import { accessCache, isRateLimited, dbBreaker } from "@/lib/access/resilience";
import { resolveUXConfig } from "@/lib/access/experiment-engine";
import { unstable_cache } from "next/cache";

export const runtime = "nodejs";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// ✅ CACHED GLOBAL CONFIG (Project #15)
// This stores the ritual status and beta flags in Vercel memory for 5 mins.
const getCachedGlobalConfig = unstable_cache(
    async () => {
        try {
            const globalProject = await db.select({ w2eConfig: projects.w2eConfig })
                .from(projects)
                .where(eq(projects.id, 15))
                .limit(1);
            return (globalProject[0]?.w2eConfig as any) || {};
        } catch (err) {
            console.error("❌ Failed to fetch global config:", err);
            return {};
        }
    },
    ["global-ritual-config-v2"],
    { revalidate: 300 } // 🕒 5 Minutes
);

export async function GET(req: Request): Promise<NextResponse> {
    const start = Date.now();
    try {
        const { searchParams } = new URL(req.url);
        const walletParam = searchParams.get("wallet")?.toLowerCase();
        const projectSlug = searchParams.get("project")?.toLowerCase() || "pandoras";
        
        const headerList = await headers();
        const ip = headerList.get("x-forwarded-for") || "unknown";
        
        // 🛑 1. RATE LIMITING
        if (await isRateLimited(ip, 30, 60000)) { 
            return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: corsHeaders });
        }

        const cookieStore = await cookies();
        const token = cookieStore.get("__pbox_sid")?.value || 
                      cookieStore.get("auth_token")?.value ||
                      cookieStore.get("pbox_session_v3")?.value;

        // 🛡️ 2. NO TOKEN
        if (!token) {
            const ux = await resolveUXConfig(walletParam || undefined, AccessState.NO_WALLET, false, projectSlug);
            return NextResponse.json({ 
                state: walletParam ? AccessState.NO_SESSION : AccessState.NO_WALLET,
                authenticated: false,
                ux
            }, { headers: corsHeaders });
        }

        // 🔐 3. VERIFICATION
        const { verifyJWT } = await import("@/lib/auth");
        const payload = await verifyJWT(token);

        if (!payload) {
            return NextResponse.json({ state: AccessState.NO_SESSION, authenticated: false }, { status: 401, headers: corsHeaders });
        }

        const address = payload.address?.toLowerCase();
        if (!address) return NextResponse.json({ state: AccessState.NO_SESSION }, { status: 401, headers: corsHeaders });

        // 🧊 4. CACHE LAYER (60s Lifetime for individual state)
        const cacheKey = `access:${address}`;
        const cached = await accessCache.get<any>(cacheKey);
        if (cached) {
            const ux = await resolveUXConfig(address, cached.state, cached.isAdmin, projectSlug);
            return NextResponse.json({ ...cached, ux }, { headers: corsHeaders });
        }

        if (dbBreaker.isOpen()) throw new Error("Service Temporarily Degraded");

        try {
            // 🏎️ Parallel resolution for speed & lower CPU duration
            const [isUserAdminData, dbUser, globalMetadata] = await Promise.all([
                isAdmin(address),
                db.query.users.findFirst({ where: eq(users.walletAddress, address) }),
                getCachedGlobalConfig()
            ]);

            const isStaging = process.env.NEXT_PUBLIC_APP_ENV === "staging";
            const userIsAdmin = !!isUserAdminData || isStaging;

            let hasNFTPermission = dbUser?.hasPandorasKey || false;
            
            // Dynamic flags from Cached Global Metadata
            const isBetaOpen = globalMetadata.betaOpen ?? config.betaOpen;
            const isRitualEnabled = globalMetadata.ritualEnabled ?? true;

            // 🧠 6. RESOLVE STATE
            let resolvedState = AccessState.WALLET_NO_ACCESS;
            
            if (userIsAdmin) {
                resolvedState = AccessState.ADMIN;
                hasNFTPermission = true;
            } else if (hasNFTPermission) {
                resolvedState = isBetaOpen ? AccessState.HAS_ACCESS : AccessState.WALLET_NO_ACCESS;
            }

            if (!isRitualEnabled && hasNFTPermission && !userIsAdmin) {
                resolvedState = AccessState.HAS_ACCESS;
            }

            const ux = await resolveUXConfig(address, resolvedState, !!userIsAdmin, projectSlug);
            
            if (resolvedState === AccessState.WALLET_NO_ACCESS) {
                const pressureLevel = 0.65 + (Math.random() * 0.2); 
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
                    ritualCompletedAt: dbUser?.ritualCompletedAt || null,
                },
                ux
            };

            // 💾 7. SYNC CACHE (60s Lifetime)
            await accessCache.set(cacheKey, responseData, 60).catch(() => {});

            // Non-blocking security log
            db.insert(securityEvents).values({
                userId: dbUser?.id || null,
                type: "ACCESS_CHECK",
                ip,
                userAgent: headerList.get("user-agent") || "unknown",
                metadata: { address, state: resolvedState, latency: Date.now() - start }
            }).catch(() => {});

            return NextResponse.json(responseData, { headers: corsHeaders });

        } catch (e) {
            dbBreaker.recordFailure();
            throw e;
        }

    } catch (error: any) {
        console.error("🔥 [AccessState] Error:", error);
        return NextResponse.json({ 
            state: AccessState.ERROR,
            authenticated: false,
            error: error.message,
            infrastructure: true
        }, { status: 200, headers: corsHeaders });
    }
}

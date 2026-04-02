import { headers, cookies } from "next/headers";
import { getAuth, isAdmin } from "@/lib/auth";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Get wallet from cookies (matching logic from parent layouts)
    const cookieStore = await cookies();
    let walletFromCookies = cookieStore.get('wallet-address')?.value ??
        cookieStore.get('thirdweb:wallet-address')?.value ?? null;

    if (!walletFromCookies) {
        const allCookies = cookieStore.getAll();
        const walletCookie = allCookies.find(cookie =>
            cookie.name.includes('wallet') &&
            cookie.name.includes('address') &&
            cookie.value &&
            cookie.value.startsWith('0x') &&
            cookie.value.length === 42
        );
        if (walletCookie) {
            walletFromCookies = walletCookie.value;
        }
    }

    // 2. Server-side Authentication
    const hdrs = await headers();
    const host = hdrs.get('host') || "";
    const isStaging = host.includes('staging.dash.pandoras.finance');
    const envLabel = isStaging ? 'staging' : (process.env.NODE_ENV || 'development');

    const { session } = await getAuth(undefined, walletFromCookies ?? undefined);
    const userAddress = session?.address?.toLowerCase();
    
    // 🔥 FIX: Explicit support for Marco's Admin Wallet on Staging
    const MARCO_ADMIN = "0x00c9f7EE6d1808C09B61E561Af6c787060BFE7C9".toLowerCase();
    const userIsAdmin = (await isAdmin(userAddress)) || (isStaging && userAddress === MARCO_ADMIN);

    // Check super admin fallback
    const userIsSuperAdmin = userAddress === SUPER_ADMIN_WALLET.toLowerCase() || (isStaging && userAddress === MARCO_ADMIN);

    const isAuthorized = userIsAdmin || userIsSuperAdmin;

    console.log("🔒 [AdminLayout] Auth Status:");
    console.log(`   - Host: ${host}`);
    console.log(`   - Environment: ${envLabel}`);
    console.log(`   - Super Admin (Env): ${process.env.SUPER_ADMIN_WALLET ? 'SET' : 'NOT SET'}`);
    console.log(`   - Cookie Wallet: ${walletFromCookies ? walletFromCookies.substring(0, 10) + '...' : 'NULL'}`);
    console.log(`   - User: ${userAddress ?? 'NONE'} | Admin: ${userIsAdmin} | Super: ${userIsSuperAdmin}`);
    console.log(`   - Final Access: ${isAuthorized ? 'GRANTED' : 'DENIED'}`);

    // 3. Block unauthorized access
    if (!isAuthorized) {
        const debugInfo = `[ENV: ${envLabel}] [SA: ${process.env.SUPER_ADMIN_WALLET ? 'SET' : 'MISSING'}] [Wallet: ${walletFromCookies ? 'FOUND' : 'NULL'}] [Session: ${session?.address ? 'ACTIVE' : 'NONE'}]`;
        const errorMsg = session?.address
            ? `Tu cuenta (${session.address}) no tiene permisos de administrador. ${debugInfo}`
            : `No se detectó una sesión válida. Por favor conecta tu wallet. ${debugInfo}`;

        return <UnauthorizedAccess authError={errorMsg} />;
    }

    // 4. Render dashboard if authorized
    return <TooltipProvider>{children}</TooltipProvider>;
}

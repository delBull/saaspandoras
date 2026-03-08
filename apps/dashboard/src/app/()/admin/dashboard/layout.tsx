import { headers, cookies } from "next/headers";
import { getAuth, isAdmin } from "@/lib/auth";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";

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
    // Note: We pass undefined for headers as we're explicitly using the cookie wallet logic
    // which is more reliable for our hybrid auth setup
    const { session } = await getAuth(undefined, walletFromCookies ?? undefined);
    const userIsAdmin = await isAdmin(session?.userId);

    // Check super admin fallback
    const userIsSuperAdmin = session?.userId?.toLowerCase() === SUPER_ADMIN_WALLET ||
        session?.address?.toLowerCase() === SUPER_ADMIN_WALLET;

    const isAuthorized = userIsAdmin || userIsSuperAdmin;

    console.log("🔒 [AdminLayout] Debug:");
    console.log(`   - Environment: ${process.env.NODE_ENV}`);
    console.log(`   - Super Admin Wallet: ${SUPER_ADMIN_WALLET.substring(0, 6)}... (from constants)`);
    console.log(`   - Env SUPER_ADMIN_WALLET: ${process.env.SUPER_ADMIN_WALLET ? process.env.SUPER_ADMIN_WALLET.substring(0, 6) + '...' : 'NOT SET'}`);
    console.log(`   - Cookie domain: ${process.env.COOKIE_DOMAIN || 'NOT SET'}`);
    console.log(`   - Cookie Wallet: ${walletFromCookies}`);
    console.log(`   - Session Address: ${session?.userId}`);
    console.log(`   - Is Admin: ${userIsAdmin}`);
    console.log(`   - Is Super Admin: ${userIsSuperAdmin}`);
    console.log(`   - AUTHORIZED: ${isAuthorized}`);

    // 3. Block unauthorized access
    if (!isAuthorized) {
        // If we have a session but no admin rights, showing specific error
        // If no session at all, might refer to login (but UnauthorizedAccess handles redirect)
        const debugInfo = `[ENV: ${process.env.NODE_ENV}] [SA: ${process.env.SUPER_ADMIN_WALLET ? 'SET' : 'MISSING'}] [Wallet: ${walletFromCookies ? 'FOUND' : 'NULL'}] [Session: ${session?.userId ? 'ACTIVE' : 'NONE'}]`;
        const errorMsg = session?.userId
            ? `Tu cuenta (${session.userId}) no tiene permisos de administrador. ${debugInfo}`
            : `No se detectó una sesión válida. Por favor conecta tu wallet. ${debugInfo}`;

        return <UnauthorizedAccess authError={errorMsg} />;
    }

    // 4. Render dashboard if authorized
    return <>{children}</>;
}

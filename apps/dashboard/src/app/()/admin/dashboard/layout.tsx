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

    // 3. Block unauthorized access
    if (!isAuthorized) {
        // If we have a session but no admin rights, showing specific error
        // If no session at all, might refer to login (but UnauthorizedAccess handles redirect)
        const errorMsg = session
            ? "Tu cuenta no tiene permisos de administrador."
            : "No se detectó una sesión válida. Por favor conecta tu wallet.";

        return <UnauthorizedAccess authError={errorMsg} />;
    }

    // 4. Render dashboard if authorized
    return <>{children}</>;
}

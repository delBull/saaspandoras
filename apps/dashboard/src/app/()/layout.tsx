
import { headers as _headers, cookies } from "next/headers";
import { getAuth, isAdmin } from "@/lib/auth";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { DashboardClientWrapper } from "./dashboard-client-wrapper";
import { ProjectModalProvider } from "@/contexts/ProjectModalContext";

// Force dynamic rendering - this layout uses cookies and should not be prerendered
// export const dynamic = 'force-dynamic'; // Optimization: Removed to allow caching where possible. Cookies() calls will trigger dynamic automatically.

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🏠 DashboardLayout: Starting authentication check');

  // Try to get wallet address from cookies first for better server-side detection
  const cookieStore = await cookies();
  let walletFromCookies = cookieStore.get('wallet-address')?.value ??
    cookieStore.get('thirdweb:wallet-address')?.value ?? null;

  // Also try to find wallet address in any cookie that contains it
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

  console.log('🏠 DashboardLayout: Wallet from cookies:', walletFromCookies?.substring(0, 10) + '...');

  const { session } = await getAuth(undefined, walletFromCookies ?? undefined);
  console.log('🏠 DashboardLayout: Session result:', {
    hasSession: !!session,
    userId: session?.userId,
    address: session?.address
  });

  const userIsAdmin = await isAdmin(session?.userId);
  console.log('🏠 DashboardLayout: isAdmin result:', userIsAdmin);

  // Check if user is super admin using either userId or address
  const userIsSuperAdmin = session?.userId?.toLowerCase() === SUPER_ADMIN_WALLET ||
    session?.address?.toLowerCase() === SUPER_ADMIN_WALLET;
  console.log('🏠 DashboardLayout: isSuperAdmin result:', userIsSuperAdmin);
  console.log('🏠 DashboardLayout: Expected SUPER_ADMIN:', SUPER_ADMIN_WALLET);

  console.log('🏠 DashboardLayout: Final results:', { userIsAdmin, userIsSuperAdmin });

  return (
    <ProjectModalProvider>
      <DashboardClientWrapper
        isAdmin={userIsAdmin}
        isSuperAdmin={userIsSuperAdmin}
        serverSession={session ? { address: session.address ?? undefined, hasSession: true } : null}
      >
        {children}
      </DashboardClientWrapper>
    </ProjectModalProvider>
  );
}

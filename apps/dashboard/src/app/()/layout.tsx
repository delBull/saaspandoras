
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
  // Try to get wallet address from cookies
  const cookieStore = await cookies();
  const walletFromCookies = cookieStore.get('wallet-address')?.value ??
    cookieStore.get('thirdweb:wallet-address')?.value ?? null;

  const { session } = await getAuth(undefined, walletFromCookies ?? undefined);
  const userIsAdmin = await isAdmin(session?.address);
  const userIsSuperAdmin = session?.address?.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();

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

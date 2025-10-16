
import { headers as _headers } from "next/headers";
import { getAuth, isAdmin } from "@/lib/auth";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { DashboardClientWrapper } from "./dashboard-client-wrapper";
import { ProjectModalProvider } from "@/contexts/ProjectModalContext";

// Force dynamic rendering - this layout uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🏠 DashboardLayout: Starting authentication check');

  const { session } = await getAuth();
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

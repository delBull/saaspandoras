
import { headers } from "next/headers";
import { getAuth, isAdmin } from "@/lib/auth";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { DashboardClientWrapper } from "./dashboard-client-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('🏠 DashboardLayout: Starting authentication check');

  const headersList = await headers();
  console.log('🏠 DashboardLayout: Headers obtained');

  const { session } = getAuth(headersList);
  console.log('🏠 DashboardLayout: Session result:', {
    hasSession: !!session,
    userId: session?.userId,
    address: session?.address
  });

  const userIsAdmin = await isAdmin(session?.userId);
  console.log('🏠 DashboardLayout: isAdmin result:', userIsAdmin);

  const userIsSuperAdmin = session?.userId?.toLowerCase() === SUPER_ADMIN_WALLET;
  console.log('🏠 DashboardLayout: isSuperAdmin result:', userIsSuperAdmin);
  console.log('🏠 DashboardLayout: Expected SUPER_ADMIN:', SUPER_ADMIN_WALLET);

  console.log('🏠 DashboardLayout: Final results:', { userIsAdmin, userIsSuperAdmin });

  return (
    <DashboardClientWrapper isAdmin={userIsAdmin} isSuperAdmin={userIsSuperAdmin}>
      {children}
    </DashboardClientWrapper>
  );
}

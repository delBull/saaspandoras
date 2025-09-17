// ¡SIN 'use client'! Este es un Server Component.
import { headers } from "next/headers";
import { getAuth, isAdmin } from "@/lib/auth";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { DashboardClientWrapper } from "./dashboard-client-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const headersList = await headers();
  const { session } = getAuth(headersList);
  const userIsAdmin = await isAdmin(session?.userId);
  const userIsSuperAdmin = session?.userId?.toLowerCase() === SUPER_ADMIN_WALLET;

  return (
    <DashboardClientWrapper isAdmin={userIsAdmin} isSuperAdmin={userIsSuperAdmin}>
      {children}
    </DashboardClientWrapper>
  );
}
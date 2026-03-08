// Page for managing custom shortlinks
// Separate from analytics page

import { ShortlinksManager } from '@/components/admin/ShortlinksManager';
import { AdminAuthGuard } from "@/components/admin/AdminAuthGuard";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";

export default async function ShortlinksManagementPage() {
  // 🛡️ Server-Side Check
  const { session } = await getAuth(await headers());
  if (!session?.userId || !await isAdmin(session.userId)) {
    return <UnauthorizedAccess authError="Server-Side Verification Failed" />;
  }

  return (
    <AdminAuthGuard>
      <div className="p-6 max-w-7xl mx-auto">
        <ShortlinksManager />
      </div>
    </AdminAuthGuard>
  );
}

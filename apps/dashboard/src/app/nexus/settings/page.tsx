import { redirect } from "next/navigation";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function NexusSettingsPage() {
  const auth = await getNexusAuthContext();

  // 🛡️ REGLA SOBERANA: Solo SuperAdmin puede acceder a Nexus Settings para gestionar colaboradores y entregar permisos.
  const isSuperAdmin = auth.role === "SUPER_ADMIN";
  if (!isSuperAdmin) {
    redirect("/nexus");
  }

  const operatorContext = {
    name: auth.name || "Marco",
    email: auth.email || "admin@pandoras.finance",
    whatsappPhone: auth.whatsappPhone,
    role: "SUPER_ADMIN" as const,
    permissions: (auth.permissions as unknown as Record<string, boolean | undefined>) || {},
  };

  return (
    <SettingsClient
      isUserAdmin={true}
      userRole="SUPER_ADMIN"
      operatorContext={operatorContext}
    />
  );
}

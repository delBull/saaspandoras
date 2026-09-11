import { redirect } from "next/navigation";
import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function NexusSettingsPage() {
  const auth = await getNexusAuthContext();

  // 🛡️ REGLA: Settings es accesible para todos los colaboradores autenticados del Nexus.
  // Cada módulo dentro de Settings se restringe según el rol del usuario (Team & Roles solo para SUPER_ADMIN).
  if (!auth.isAuthenticated) {
    redirect("/nexus");
  }

  const isSuperAdmin = auth.role === "SUPER_ADMIN";

  const operatorContext = {
    name: auth.name || (isSuperAdmin ? "Marco" : "Operador"),
    email: auth.email || "admin@pandoras.finance",
    whatsappPhone: auth.whatsappPhone,
    role: auth.role || "OPERATOR",
    permissions: (auth.permissions as unknown as Record<string, boolean | undefined>) || {},
  };

  return (
    <SettingsClient
      isUserAdmin={isSuperAdmin}
      userRole={auth.role || "OPERATOR"}
      operatorContext={operatorContext}
    />
  );
}

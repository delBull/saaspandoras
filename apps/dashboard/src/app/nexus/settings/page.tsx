import { redirect } from "next/navigation";
import { getNexusAuthContext } from "@saasfly/shared";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function NexusSettingsPage() {
  const hdrs = await import("next/headers").then(m => m.headers());
  const auth = await getNexusAuthContext(hdrs);

  // 🛡️ REGLA SOBERANA: Solo SuperAdmin puede acceder a Nexus Settings para gestionar colaboradores y entregar permisos.
  const isSuperAdmin = auth.role === "SUPER_ADMIN";
  if (!isSuperAdmin) {
    redirect("/nexus");
  }

  const operatorContext = {
    name: auth.name ?? "Marco",
    email: auth.email ?? "admin@pandoras.finance",
    image: auth.image ?? null,
    whatsappPhone: auth.whatsappPhone,
    role: "SUPER_ADMIN" as const,
    permissions: (auth.permissions as unknown as Record<string, boolean | undefined>) ?? {},
  };

  return (
    <SettingsClient
      isUserAdmin={true}
      userRole="SUPER_ADMIN"
      operatorContext={operatorContext}
    />
  );
}

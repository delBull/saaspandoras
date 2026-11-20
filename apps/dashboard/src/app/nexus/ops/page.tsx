import { redirect } from "next/navigation";
import { getNexusAuthContext } from "@saasfly/shared";
import { generateAcademyToken } from "@saasfly/nexus-deals-sdk";
import { NexusCommandCenter } from "../NexusCommandCenter";
import { NexusLoginGate } from "../NexusLoginGate";
import { NexusProvisioningPending } from "../NexusProvisioningPending";
import { OPS_SLUG_TABS, type Tab } from "@/components/nexus/OperationsHubModal";

export const dynamic = "force-dynamic";

/**
 * Operations Hub como PANTALLA (no modal).
 *
 * `/nexus/ops?tab=clients` → hub full screen con el tab en la URL:
 * se puede refrescar, compartir y el botón atrás funciona.
 *
 * La autorización es la misma que `/nexus`: sesión Nexus válida y provisioning
 * aprobado. El tab se valida contra la lista canónica (`OPS_SLUG_TABS`); un slug
 * desconocido cae en el tab por defecto, nunca en un estado inventado.
 */
export default async function NexusOpsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; token?: string; tour?: string; role?: string }>;
}) {
  const { tab, token, tour, role } = await searchParams;

  // Enlaces antiguos: estos dominios ahora viven en su propia pantalla.
  if (tab === "agenda") redirect("/nexus/agenda");
  if (tab === "rooms" || tab === "dataroom") redirect("/nexus/rooms");

  const { headers } = await import("next/headers");
  const reqHeaders = await headers();

  const auth = await getNexusAuthContext(reqHeaders, token, "NEXUS");

  if (!auth.isAuthenticated) {
    return <NexusLoginGate requireCompletion={false} initialAuth={null} />;
  }

  if (auth.provisionStatus === "PENDING") {
    if (!auth.name) {
      return (
        <NexusLoginGate
          requireCompletion={true}
          initialAuth={{
            address: auth.wallet ?? null,
            email: auth.email ?? null,
            whatsappPhone: auth.whatsappPhone ?? null,
          }}
        />
      );
    }
    return <NexusProvisioningPending email={auth.email} />;
  }

  if (!auth.name && !auth.wallet) {
    return (
      <NexusLoginGate
        requireCompletion={true}
        initialAuth={{
          address: auth.wallet ?? null,
          email: auth.email ?? null,
          whatsappPhone: auth.whatsappPhone ?? null,
        }}
      />
    );
  }

  const initialOpsTab: Tab = (tab && OPS_SLUG_TABS[tab]) || "WORK_ENGINE";
  const iframeToken = await generateAcademyToken(
    auth.email || "admin@pandoras.finance",
    auth.role === "SUPER_ADMIN" ? "admin" : "manager"
  );

  return (
    <NexusCommandCenter
      auth={auth}
      initialTour={tour}
      initialRole={role}
      iframeToken={iframeToken}
      token={token}
      opsRoute
      initialOpsTab={initialOpsTab}
    />
  );
}

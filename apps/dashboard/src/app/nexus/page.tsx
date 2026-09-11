import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { NexusCommandCenter } from "./NexusCommandCenter";
import { NexusLoginGate } from "./NexusLoginGate";
import { NexusProvisioningPending } from "./NexusProvisioningPending";
import { generateAcademyToken } from "@/lib/nexus-deals/tokens";

export const dynamic = "force-dynamic";

export default async function NexusRootPage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string; token?: string; tour?: string; role?: string }>;
}) {
  const { token, tour, role } = await searchParams;

  const auth = await getNexusAuthContext(null, token);

  if (auth.isAuthenticated) {
    // Provisioning gate: PENDING collaborators may complete their profile but
    // cannot enter the Command Center until an admin approves their access.
    if (auth.provisionStatus === "PENDING") {
      if (!auth.name) {
        return <NexusLoginGate requireCompletion={true} initialAuth={{ address: auth.wallet || null, email: auth.email || null }} />;
      }
      return <NexusProvisioningPending email={auth.email} />;
    }
    
    // If authenticated operator has no name and no wallet, prompt completion
    if (!auth.name && !auth.wallet) {
      return <NexusLoginGate requireCompletion={true} initialAuth={{ address: auth.wallet || null, email: auth.email || null }} />;
    }
    
    const iframeToken = await generateAcademyToken(auth.email || "admin@pandoras.finance", auth.role === "SUPER_ADMIN" ? "admin" : "manager");
    return <NexusCommandCenter auth={auth} initialTour={tour} initialRole={role} iframeToken={iframeToken} token={token} />;
  }

  return <NexusLoginGate requireCompletion={false} initialAuth={null} />;
}

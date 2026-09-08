import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { NexusCommandCenter } from "./NexusCommandCenter";
import { NexusLoginGate } from "./NexusLoginGate";
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
    if (!auth.name || !auth.whatsappPhone) {
      return <NexusLoginGate requireCompletion={true} initialAuth={{ address: auth.wallet || null, email: auth.email || null }} />;
    }
    const iframeToken = await generateAcademyToken(auth.email || "admin@pandoras.finance", auth.role === "SUPER_ADMIN" ? "admin" : "manager");
    return <NexusCommandCenter auth={auth} initialTour={tour} initialRole={role} iframeToken={iframeToken} />;
  }

  return <NexusLoginGate requireCompletion={false} initialAuth={null} />;
}

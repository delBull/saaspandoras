import { getNexusAuthContext } from "@/lib/nexus/nexus-rbac";
import { NexusCommandCenter } from "./NexusCommandCenter";
import { NexusLoginGate } from "./NexusLoginGate";

export const dynamic = "force-dynamic";

export default async function NexusRootPage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string; token?: string }>;
}) {
  const { token } = await searchParams;

  const auth = await getNexusAuthContext(null, token);

  if (auth.isAuthenticated) {
    return <NexusCommandCenter auth={auth} />;
  }

  return <NexusLoginGate />;
}

import { getAuth, isAdmin } from "@/lib/auth";
import { getCollaboratorForOperator } from "@/lib/nexus/collaborators-service";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function NexusSettingsPage() {
  const { session, isVerified } = await getAuth();

  let isUserAdmin = false;
  let operatorContext: {
    name: string;
    email: string;
    whatsappPhone?: string | null;
    role: string;
    permissions: Record<string, boolean | undefined>;
  } | null = null;

  try {
    if (isVerified && session?.address && (await isAdmin(session.address))) {
      isUserAdmin = true;
      // Resolve full collaborator identity from DB
      const collab = await getCollaboratorForOperator(session.address);
      if (collab) {
        operatorContext = {
          name: collab.name,
          email: collab.email,
          whatsappPhone: collab.whatsappPhone,
          role: collab.role,
          permissions: (collab.permissions as Record<string, boolean | undefined>) || {},
        };
      }
    }
  } catch {
    isUserAdmin = false;
  }

  return (
    <SettingsClient
      isUserAdmin={isUserAdmin}
      operatorContext={operatorContext}
    />
  );
}

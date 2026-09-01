import { getAuth, isAdmin } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function NexusSettingsPage() {
  const { session, isVerified } = await getAuth();

  let isUserAdmin = false;
  try {
    if (isVerified && session?.address && (await isAdmin(session.address))) {
      isUserAdmin = true;
    }
  } catch {
    isUserAdmin = false;
  }

  return <SettingsClient isUserAdmin={isUserAdmin} />;
}

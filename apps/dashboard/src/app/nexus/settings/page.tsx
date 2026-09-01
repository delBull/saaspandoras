import { redirect } from "next/navigation";
import { getAuth, isAdmin } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function NexusSettingsPage() {
  const { session, isVerified } = await getAuth();

  if (!isVerified || !session?.address || !(await isAdmin(session.address))) {
    redirect("/nexus/rooms");
  }

  return <SettingsClient />;
}

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function NexusSettingsRedirectPage() {
  redirect("https://dash.pandoras.finance/nexus/settings");
}

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NexusRootPage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string }>;
}) {
  const { unlock } = await searchParams;
  if (unlock) {
    redirect(`/nexus/rooms?unlock=${encodeURIComponent(unlock)}`);
  }
  redirect("/nexus/rooms");
}

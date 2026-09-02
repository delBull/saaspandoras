import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NexusRootPage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string; token?: string }>;
}) {
  const { unlock, token } = await searchParams;

  if (token) {
    const marketingBase = process.env.NEXT_PUBLIC_MARKETING_URL || "https://pandoras.finance";
    redirect(`${marketingBase}/en/nexus?token=${encodeURIComponent(token)}`);
  }

  if (unlock) {
    redirect(`/nexus/rooms?unlock=${encodeURIComponent(unlock)}`);
  }

  redirect("/nexus/rooms");
}

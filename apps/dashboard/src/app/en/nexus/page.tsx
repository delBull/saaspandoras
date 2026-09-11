import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EnNexusRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; unlock?: string }>;
}) {
  const { token, unlock } = await searchParams;
  const nexusBase = process.env.NEXT_PUBLIC_NEXUS_URL || "https://nexus.pandoras.finance";

  const queryParams = new URLSearchParams();
  if (token) queryParams.set("token", token);
  if (unlock) queryParams.set("unlock", unlock);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  redirect(`${nexusBase}/nexus${queryString}`);
}

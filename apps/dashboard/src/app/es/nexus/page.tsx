import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EsNexusRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; unlock?: string }>;
}) {
  const { token, unlock } = await searchParams;
  const marketingBase = process.env.NEXT_PUBLIC_MARKETING_URL || "https://pandoras.finance";

  const queryParams = new URLSearchParams();
  if (token) queryParams.set("token", token);
  if (unlock) queryParams.set("unlock", unlock);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  redirect(`${marketingBase}/es/nexus${queryString}`);
}

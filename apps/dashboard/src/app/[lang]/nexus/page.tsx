import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface LangNexusPageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ token?: string; unlock?: string }>;
}

export default async function LangNexusRedirectPage({
  params,
  searchParams,
}: LangNexusPageProps) {
  const { lang } = await params;
  const { token, unlock } = await searchParams;

  const marketingBase = process.env.NEXT_PUBLIC_MARKETING_URL || "https://pandoras.finance";
  const validLang = lang === "es" ? "es" : "en";

  const queryParams = new URLSearchParams();
  if (token) queryParams.set("token", token);
  if (unlock) queryParams.set("unlock", unlock);

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : "";
  redirect(`${marketingBase}/${validLang}/nexus${queryString}`);
}

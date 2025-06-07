import { notFound } from "next/navigation";
import { Locale, i18n } from "~/config/i18n-config";
import InvestClient from "./InvestClient";

interface PageProps {
  params: { lang: Locale };
}

export const metadata = {
  title: "Investment Pool",
};

export default function Page({ params }: PageProps) {
  if (!i18n.locales.includes(params.lang)) return notFound();
  return <InvestClient lang={params.lang} />;
}

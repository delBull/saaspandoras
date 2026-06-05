import PropertiesPage from "~/components/price/propertiesv2";
import type { Locale } from "~/config/i18n-config";

export const metadata = {
  title: "Properties",
};

export default async function Page(props: {
  params: Promise<{
    lang: string;
  }>;
}) {
  const params = await props.params;

  const { lang } = params;

  const supportedLangs = ["en", "es", "ja", "ko", "zh"] as const;
  const selectedLang = supportedLangs.includes(lang as any) ? lang : "en";

  return (
    <div className="flex w-full flex-col gap-16 py-8 md:py-8">
      <PropertiesPage lang={selectedLang as any} />
    </div>
  );
}

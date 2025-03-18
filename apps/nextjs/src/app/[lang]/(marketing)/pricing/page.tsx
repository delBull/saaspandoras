import PropertiesPage from "~/components/price/propertiesv2";
import type { Locale } from "~/config/i18n-config";

export const metadata = {
  title: "Properties",
};

export default function Page({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {

  const supportedLangs = ['en', 'es', 'ja', 'ko', 'zh'] as const;
  const selectedLang = supportedLangs.includes(lang) ? lang : 'en';

  return (
    <div className="flex w-full flex-col gap-16 py-8 md:py-8">
      <PropertiesPage lang={selectedLang} />
    </div>
  );
}
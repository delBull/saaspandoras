import { getDictionary } from "~/lib/get-dictionary";
import { InvestContent } from "~/components/invest-content";
import type { Locale } from "~/config/i18n-config";

export default async function Page({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dict = await getDictionary(lang);

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <InvestContent dict={dict} />
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'es' },
    { lang: 'ja' },
    { lang: 'ko' },
    { lang: 'zh' },
  ];
}
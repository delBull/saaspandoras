import Properties from "~/components/price/propertiesv2";
import { PricingFaq } from "~/components/price/pricing-faq";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";

export const metadata = {
  title: "Assets",
};

export default async function PropertiesPage({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {
  const dict = await getDictionary(lang);
  

  return (
    <div className="flex w-full flex-col gap-16 py-8 md:py-8">
      <Properties lang={lang}/>
      <hr className="container" />
      <PricingFaq params={{ lang }} dict={dict.price} />
    </div>
  );
}

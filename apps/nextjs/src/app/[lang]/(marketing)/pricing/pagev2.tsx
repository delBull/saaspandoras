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
  params: { lang: Locale; };
}) {
  try {
    const dict = await getDictionary(lang);

    if (!dict?.assets) {
      console.error("Dictionary or assets section not found");
      return null;
    }

    return (
      <div className="flex w-full flex-col min-h-screen">
        <div className="container mx-auto px-4 py-8 space-y-16">
          <Properties lang={lang} />
          <hr className="border-border" />
          <PricingFaq params={{ lang }} dict={dict.price} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in PropertiesPage:", error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Something went wrong loading the page.</p>
      </div>
    );
  }
}
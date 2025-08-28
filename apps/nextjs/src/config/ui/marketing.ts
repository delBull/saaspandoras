import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import type { MarketingConfig } from "~/types";

export const getMarketingConfig = async ({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}): Promise<MarketingConfig> => {
  const dict = await getDictionary(lang);
  return {
    mainNav: [
      {
        title: dict.marketing.main_nav_assets,
        href: `/activos`,
        external: false,
        hidden: false,
      },
      {
        title: "Whitepaper",
        href: `/whitepaper/1-introduction`,
        external: true,
        hidden: true,
      },
      {
        title: dict.marketing.main_nav_invest,
        href: `https://minter.pandoras.finance`,
        external: true,
        hidden: false,
      },
      {
        title: dict.marketing.main_nav_documentation,
        href: "#",
        disabled: true,
        tooltip: "Coming Soon",
        external: false,
        hidden: false,
      },
      {
        title: dict.marketing.main_nav_business,
        href: "#",
        disabled: true,
        tooltip: "Coming Soon",
        external: false,
        hidden: false,
      },
    ],
  };
};

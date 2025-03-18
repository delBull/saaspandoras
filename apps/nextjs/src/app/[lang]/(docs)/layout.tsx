import { Suspense } from "react";
import { getCurrentUser } from "@saasfly/auth";
import { NavBar } from "~/components/navbar";
import { SiteFooter } from "~/components/site-footer";
import type { Locale } from "~/config/i18n-config";
import { getMarketingConfig } from "~/config/ui/marketing";
import { getDictionary } from "~/lib/get-dictionary";

interface DocsLayoutProps {
  children: React.ReactNode;
  params: {
    lang: Locale;
  };
}

export default async function DocsLayout({
  children,
  params: { lang },
}: DocsLayoutProps) {
  const dict = await getDictionary(lang); // Removed type assertion
  const user = await getCurrentUser();
  const marketingConfig = await getMarketingConfig({ params: { lang } });

  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback="...">
        <NavBar
          items={marketingConfig.mainNav}
          params={{ lang }}
          scroll={true}
          user={user}
          marketing={dict.marketing}
          dropdown={dict.dropdown}
        />
      </Suspense>
      <div className="container flex-1">{children}</div>
      <SiteFooter
        className="border-t"
        params={{ lang }}
        dict={dict.common}
      />
    </div>
  );
}
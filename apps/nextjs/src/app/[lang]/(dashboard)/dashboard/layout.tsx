import { Suspense } from "react";
import { notFound } from "next/navigation";

//import { getCurrentUser } from "@saasfly/auth";

import { LocaleChange } from "~/components/locale-change";
// import { DashboardNav } from "~/components/nav";
import { UserAccountNav } from "~/components/user-account-nav";
import { i18n, type Locale } from "~/config/i18n-config";
import { getDashboardConfig } from "~/config/ui/dashboard";
import { getDictionary } from "~/lib/get-dictionary";
import { NFTGate } from "~/components/nft-gate";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    lang: Locale;
  }>;
}

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function DashboardLayout(props: DashboardLayoutProps) {
  const params = await props.params;

  const { lang } = params;

  const { children } = props;

  //const user = await getCurrentUser();
  const dict = await getDictionary(lang);

  {/*
  if (!user) {
    return notFound();
  }
  */}
  const dashboardConfig = await getDashboardConfig({ params: { lang } });

  return (
    <div className="flex top-4 right-0 fixed min-h-screen flex-col space-y-6">
      <header className="z-10">
        <div className="container flex h-12 items-center justify-end py-4">
          <div className="flex items-center space-x-3">
            <LocaleChange url={"/dashboard"} />
            {/*
            <UserAccountNav
              user={{
                name: user.name,
                image: user.image,
                email: user.email,
              }}
              params={{ lang: `${lang}` }}
              dict={dict.dropdown}
            />
            */}
          </div>
        </div>
      </header>
      <div className="container flex-1">
        <aside className="hidden w-[200px] flex-col md:flex">
          {/*  <DashboardNav
            items={dashboardConfig.sidebarNav}
            params={{ lang: `${lang}` }}
          />*/}
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          <NFTGate>
            <Suspense
              fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-8 w-[200px] bg-muted rounded" />
                  <div className="h-[400px] w-full bg-muted rounded" />
                </div>
              }
            >
              {children}
            </Suspense>
          </NFTGate>
        </main>
      </div>
    </div>
  );
}
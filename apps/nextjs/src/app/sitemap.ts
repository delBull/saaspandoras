import { MetadataRoute } from "next";

import { siteConfig } from "~/config/site";
import { i18n } from "~/config/i18n-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const { locales } = i18n;

  const routes = ["", "/pricing", "/invest"].map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date().toISOString(),
  }));

  const localizedRoutes = routes.flatMap((route) =>
    locales.map((locale) => ({
      ...route,
      url: `${siteConfig.url}/${locale}${route.url.replace(siteConfig.url, "")}`,
    }))
  );

  return [...localizedRoutes];
}
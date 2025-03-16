import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";
import { ThirdwebProvider } from "thirdweb/react";

import "~/styles/globals.css";

import { NextDevtoolsProvider } from "@next-devtools/core";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { cn } from "@saasfly/ui";
import { Toaster } from "@saasfly/ui/toaster";

import { TailwindIndicator } from "~/components/tailwind-indicator";
import { ThemeProvider } from "~/components/theme-provider";
import { i18n } from "~/config/i18n-config";
import { siteConfig } from "~/config/site";

// import { Suspense } from "react";
// import { PostHogPageview } from "~/config/providers";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Font files can be colocated inside of `pages`
const fontHeading = localFont({
  src: "../styles/fonts/CalSans-SemiBold.woff2",
  variable: "--font-heading",
});

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export const metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "tokenizacion",
    "fraccion",
    "inversiones",
    "real state",
    "bienes raices",
    "inmobiliairia",
    "propiedad",
    "venta",
     "alquiler",
     "arriendo",
     "inmueble",
     "propiedad inmobiliaria",
     "bienes raices en venta",
     "bienes raices en alquiler",
     "bienes raices en arriendo",
     "bienes raices en renta",
     "bienes raices en rentado",
     "inversión inmobiliaria",
     "inversión en bienes raices",
  ],
  authors: [
    {
      name: "Pandora's Foundation",
    },
  ],
  creator: "Pandora's",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  icons: {
    icon: "/logop.svg",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL("https://dapp.pandoras.foundation/"),
  // manifest: `${siteConfig.url}/site.webmanifest`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head />
      {/*<Suspense>*/}
      {/*  <PostHogPageview />*/}
      {/*</Suspense>*/}
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
          fontHeading.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <ThirdwebProvider>
          <NextDevtoolsProvider>{children}</NextDevtoolsProvider>
          <Analytics />
          <SpeedInsights />
          <Toaster />
          <TailwindIndicator />
          </ThirdwebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

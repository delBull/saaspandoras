import { Inter as FontSans } from "next/font/google";

import localFont from "next/font/local";
import { Dancing_Script, Shadows_Into_Light } from "next/font/google"; // Added Shadows_Into_Light

import "~/styles/globals.css";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { cn } from "@saasfly/ui";
import { Toaster } from "@saasfly/ui/toaster";

import { TailwindIndicator } from "~/components/tailwind-indicator";
import { ThemeProvider } from "~/components/theme-provider";
import { i18n } from "~/config/i18n-config";
import { siteConfig } from "~/config/site";
import { Providers } from "~/components/Providers";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontHeading = localFont({
  src: "../styles/fonts/CalSans-SemiBold.woff2",
  variable: "--font-heading",
});

const fontHandwritten = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-handwritten",
});

const shadowsIntoLight = Shadows_Into_Light({ // Added shadowsIntoLight
  subsets: ["latin"],
  weight: "400",
  variable: "--font-shadows",
});

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export const metadata = {
  metadataBase: new URL(siteConfig.url),
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
      name: "Pandora's Finance",
      url: siteConfig.url,
    },
  ],
  creator: "Pandora's",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [`${siteConfig.url}/og-image.jpg`],
    creator: "@pandoras",
  },
  icons: {
    icon: "/logop.svg",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: siteConfig.url,
    languages: {
      "es-MX": `${siteConfig.url}/es`,
      "en-US": `${siteConfig.url}/en`,
    },
  },
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
          fontHandwritten.variable,
          shadowsIntoLight.variable // Added shadowsIntoLight.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          {/*<NextDevtoolsProvider>*/}
          <Providers>{children}</Providers>
          {/*</NextDevtoolsProvider>*/}
          <Analytics />
          <SpeedInsights />
          <Toaster />
          <TailwindIndicator />
        </ThemeProvider>
      </body>
    </html>
  );
}

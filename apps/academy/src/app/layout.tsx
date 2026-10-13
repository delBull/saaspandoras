import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_ACADEMY_URL || "https://academy.pandoras.finance"),
  title: {
    default: "Pandora's Academy | Executive Clearance & Sovereign Intelligence",
    template: "%s | Pandora's Academy",
  },
  description: "Certificación Ejecutiva, Inteligencia Soberana y Reputación On-Chain para la Economía RWA y Protocolos Descentralizados.",
  keywords: [
    "Pandoras Academy",
    "RWA Certification",
    "Web3 Executive Education",
    "Sovereign Intelligence",
    "Tokenization Masterclass",
    "On-Chain Credentials",
    "Pandoras Growth OS"
  ],
  authors: [{ name: "Pandora's Directorate", url: "https://pandoras.finance" }],
  creator: "Pandora's Labs",
  publisher: "Pandora's Labs",
  openGraph: {
    type: "website",
    locale: "es_LA",
    url: "https://academy.pandoras.finance",
    title: "Pandora's Academy | Executive Clearance & Sovereign Intelligence",
    description: "Certificación Ejecutiva, Inteligencia Soberana y Reputación On-Chain para la Economía RWA y Protocolos Descentralizados.",
    siteName: "Pandora's Academy",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Pandora's Academy Institutional Crest",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pandora's Academy | Executive Clearance",
    description: "Certificación Ejecutiva y Reputación On-Chain para la Economía RWA.",
    creator: "@pandoras_w2e",
    images: ["/android-chrome-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon-16x16.png",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} bg-gradient-to-b from-zinc-950 to-black text-white antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}

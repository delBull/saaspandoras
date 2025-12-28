import "./globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Pandora's | The Premier Work-to-Earn Ecosystem",
    template: "%s | Pandora's",
  },
  description: "Launch, scale, and govern your decentralized protocol. Pandora's provides the infrastructure for next-generation Work-to-Earn economies.",
  keywords: ["Crypto", "DAO", "Work-to-Earn", "Web3", "Governance", "Tokenization", "Protocol Deployment"],
  authors: [{ name: "Pandoras Team" }],
  creator: "Pandora's Labs",
  publisher: "Pandora's Labs",
  metadataBase: new URL("https://pandoras.finance"), // Placeholder, should be env var in prod
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pandoras.finance",
    title: "Pandora's | The Premier Work-to-Earn Ecosystem",
    description: "Launch, scale, and govern your decentralized protocol. Pandora's provides the infrastructure for next-generation Work-to-Earn economies.",
    siteName: "Pandora's",
    images: [
      {
        url: "/og-image.jpg", // Needs to exist in public
        width: 1200,
        height: 630,
        alt: "Pandora's Ecosystem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pandora's | The Premier Work-to-Earn Ecosystem",
    description: "Launch, scale, and govern your decentralized protocol.",
    creator: "@pandoras_w2e",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-b from-zinc-950 to-black text-white antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

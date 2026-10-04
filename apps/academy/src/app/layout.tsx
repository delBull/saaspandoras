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
  title: {
    default: "Pandora's Academy | Executive Clearance",
    template: "%s | Pandora's Academy",
  },
  description: "Certificación Ejecutiva y Reputación On-Chain para la Economía RWA.",
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

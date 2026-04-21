import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pandoras Finance — Investment Access Platform",
  description:
    "La plataforma donde los mejores proyectos de inversión abren acceso a sus primeros inversores — antes de llegar al mercado público.",
  keywords: ["inversión", "acceso temprano", "activos reales", "pandoras finance", "protocolos de inversión"],
  openGraph: {
    title: "Pandoras Finance — Investment Access Platform",
    description: "Accede antes. Invierte en lo real. Gana con el tiempo.",
    siteName: "Pandoras Finance",
    type: "website",
  },
  robots: "index, follow",
};

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} font-[family-name:var(--font-inter)] bg-[#080808] text-white antialiased`}>
      {children}
    </div>
  );
}

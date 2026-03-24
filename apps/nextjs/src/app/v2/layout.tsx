import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "Pandora's Protocol — Acceso Privado",
  description:
    "No es una plataforma. Es un sistema donde el acceso define quién entra primero y quién captura el retorno.",
  robots: "noindex, nofollow",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${spaceGrotesk.variable} font-[family-name:var(--font-space)] bg-black text-white`}>
      {children}
    </div>
  );
}

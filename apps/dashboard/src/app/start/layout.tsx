import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Soberanía Digital | Pandora's Finance",
    description: "Para creadores que se niegan a ser inquilinos. Convierte tu audiencia en una comunidad soberana usando infraestructura verificable.",
    keywords: ["Economía de Creadores", "Soberanía Digital", "Membresía Web3", "Herramientas DAO", "Propiedad Comunitaria", "Riesgo de Plataforma"],
    openGraph: {
        title: "Soberanía Digital | No Seas un Inquilino",
        description: "Tu audiencia pertenece al algoritmo. Tu comunidad te pertenece a ti. Construye infraestructura soberana.",
        url: "https://dash.pandoras.finance/start",
        type: "website",
        images: [
            {
                url: "https://dash.pandoras.finance/images/og-start.jpg",
                width: 1200,
                height: 630,
                alt: "Pandora Soberanía Digital",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Soberanía Digital | Pandora's Finance",
        description: "Convierte tu audiencia en una comunidad soberana.",
    },
};

export default function StartLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

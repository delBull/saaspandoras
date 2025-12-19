import { Metadata } from "next";
import type { ReactNode } from 'react';

export const metadata: Metadata = {
    title: "Círculo Interno de Founders | Pandora's Finance",
    description: "Infraestructura exclusiva para founders listos para desplegar capital. Sin pitch decks. Sin ruido. Solo ventaja estructural para despliegues Web3 High-Ticket.",
    keywords: ["Venture Web3", "Infraestructura DAO", "Cripto High Ticket", "Auditoría Smart Contracts", "Diseño de Tokenomics", "Pandoras Finance"],
    openGraph: {
        title: "Círculo Interno de Founders | Ventaja Estructural",
        description: "Para founders que superaron la etapa del pitch deck. Despliega capital. Construye infraestructura. Dueño del resultado.",
        url: "https://dash.pandoras.finance/founders",
        type: "website",
        images: [
            {
                url: "https://dash.pandoras.finance/images/og-founders.jpg", // Placeholder - user can replace
                width: 1200,
                height: 630,
                alt: "Pandora Founders Inner Circle",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Círculo Interno de Founders | Pandora's Finance",
        description: "Infraestructura exclusiva para founders con capital.",
    },
};

export default function FoundersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

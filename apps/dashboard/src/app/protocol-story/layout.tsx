import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "El Origen de Pandora | Manifiesto",
    description: "La historia detrás del movimiento. Por qué construimos soberanía financiera y por qué el modelo actual de internet está roto.",
    keywords: ["Manifiesto DeFi", "Historia Cripto", "Filosofía Web3", "Soberanía Financiera", "Descentralización Real", "Movimiento Cypherpunk"],
    openGraph: {
        title: "El Origen de Pandora | Por Qué Construimos",
        description: "No es solo código. Es una declaración de independencia financiera. Descubre el origen del protocolo.",
        url: "https://dash.pandoras.finance/protocol-story",
        type: "website",
        images: [
            {
                url: "https://dash.pandoras.finance/images/og-story.jpg",
                width: 1200,
                height: 630,
                alt: "Pandora Origin Story",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "El Origen de Pandora | Manifiesto",
        description: "No es solo código. Es una declaración de independencia.",
    },
};

export default function ProtocolStoryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

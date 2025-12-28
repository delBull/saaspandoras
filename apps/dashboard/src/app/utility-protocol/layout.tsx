import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Arquitecto de Protocolos de Utilidad | Pandora's Finance",
    description: "Deja de construir hype. Empieza a construir sistemas. Arquitecturas Work-to-Earn validadas para protocolos serios.",
    keywords: ["Work-to-Earn", "Utilidad de Token", "Arquitectura de Protocolos", "Verificación On-chain", "Real Yield", "Smart Contracts"],
    openGraph: {
        title: "Arquitecto de Protocolos | Construye Sistemas, No Hype",
        description: "Si no puedes verificar la acción, no puedes recompensarla. Lógica de validación para protocolos de alto rendimiento.",
        url: "https://dash.pandoras.finance/utility-protocol",
        type: "website",
        images: [
            {
                url: "https://dash.pandoras.finance/images/og-utility.jpg",
                width: 1200,
                height: 630,
                alt: "Pandora Arquitecto de Utilidad",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Arquitecto de Protocolos de Utilidad | Pandora's Finance",
        description: "Deja de construir hype. Empieza a construir sistemas.",
    },
};

export default function UtilityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}


import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Despliegue de Protocolos | Pandora's Finance",
    description: "La infraestructura definitiva para comunidades on-chain. Lanza tokens gobernados, tesorerías automatizadas y sistemas de recompensa work-to-earn.",
    keywords: ["Despliegue DAO", "Lanzamiento Token", "Tesorería On-chain", "Gobernanza Descentralizada", "Smart Contracts Seguros", "Infraestructura DeFi"],
    openGraph: {
        title: "Despliegue de Protocolos | Infraestructura Definitiva",
        description: "Lanza tu economía digital en minutos, no meses. Gobernanza, Tesorería y Utilidad integradas en una sola suite.",
        url: "https://dash.pandoras.finance/protocol",
        type: "website",
        images: [
            {
                url: "https://dash.pandoras.finance/images/og-protocol.jpg",
                width: 1200,
                height: 630,
                alt: "Pandora Protocol Deployment",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Despliegue de Protocolos | Pandora's Finance",
        description: "Lanza tu economía digital en minutos. Infraestructura definitiva.",
    },
};

export default function ProtocolLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

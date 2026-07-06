export const mockSNaraiDeck = {
    title: "S'Narai Pitch Deck",
    slug: "pitch-deck",
    blocks: [
        {
            type: "hero",
            data: {
                title: "Reserva S'Narai",
                subtitle: "El primer hotel boutique hiper-conectado, tokenizado para generar rendimientos y acceso exclusivo a una comunidad global.",
                tagline: "Pandoras Real Estate",
                projectName: "S'Narai",
                backgroundImage: "https://snarai.aztecaz.xyz/images/hero-bg.jpg" // Using a generic path
            }
        },
        {
            type: "info",
            data: {
                sectionLabel: "Resumen Ejecutivo",
                title: "Redefiniendo la Hospitalidad",
                content: "S'Narai no es solo un hotel, es un activo productivo diseñado para optimizar rendimientos y experiencias. \n\nUbicado estratégicamente para atraer turismo de alto valor, operado mediante estándares internacionales y democratizado a través del ecosistema de Pandoras.",
                stats: [
                    { label: "Ubicación", value: "Tulum, MX" },
                    { label: "Modelo", value: "Boutique Hotel" },
                    { label: "Ticket Mínimo", value: "$460 USD" },
                    { label: "Títulos Total", value: "30,000" }
                ]
            }
        },
        {
            type: "phases",
            data: {
                title: "Estructura de Capital",
                description: "Nuestra estructura de capital está diseñada para recompensar a los primeros creyentes, incrementando el valor del título de participación en cada fase y protegiendo la dilución del patrimonio.",
                currentPhaseName: "Fase 1 (Pioneros)",
                currentPrice: "50",
                progressPercent: 10,
                soldUnits: "3,000",
                totalUnits: "30,000",
                phases: [
                    { name: "Fase 1 (Pioneros)", price: "50", description: "Acceso temprano con el mayor descuento sobre el NAV estimado. Sólo 30,000 títulos.", active: true },
                    { name: "Fase 2 (Constructores)", price: "75", description: "Durante el desarrollo de la obra gris y estructura principal.", active: false },
                    { name: "Fase 3 (Operación)", price: "100", description: "Venta a precio de mercado una vez inaugurado el desarrollo.", active: false }
                ]
            }
        },
        {
            type: "investment_example",
            data: {
                initialInvestment: "25,000",
                titlesCount: "500",
                timeline: [
                    { phase: "Fase 1 (Compra)", value: "25,000", description: "Adquisición temprana a $50 por título. Rendimiento base asegurado." },
                    { phase: "Fase 2 (Desarrollo)", value: "37,500", description: "Plusvalía latente generada al ajustar el precio de mercado a $75." },
                    { phase: "Fase 3 (Operación)", value: "50,000", description: "Valor de mercado final a $100. Ganancia de capital del 100% ($25,000 USD) inmediata." }
                ],
                conclusion: "Al entrar en Fase 1, aseguras un 100% de ganancia de capital sobre el valor de mercado proyectado para la Fase 3, además de maximizar tu % de yield anual al tener un costo de adquisición base de solo $50."
            }
        },
        {
            type: "financials",
            data: {
                title: "Rendimientos Estimados y Plusvalía",
                annualYield: "12-15%",
                capitalGain: "20%",
                irr: "32%"
            }
        }
    ]
};

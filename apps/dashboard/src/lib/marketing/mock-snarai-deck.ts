export const mockSNaraiDeck = {
    title: "S'Narai Pitch Deck",
    slug: "pitch-deck",
    blocks: [
        {
            type: "hero",
            data: {
                title: "La evolución de la Riviera.",
                subtitle: "Arquitectura orgánica y rentabilidad algorítmica en la Zona Dorada de Bucerías.",
                tagline: "Participación Estructurada",
                projectName: "S'Narai",
                backgroundImage: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=2070&auto=format&fit=crop"
            }
        },
        {
            type: "info",
            data: {
                sectionLabel: "Resumen del Proyecto",
                title: "Diseñado para los sentidos y el flujo de caja.",
                content: "S'Narai capitaliza la escasez de inventario premium en la Zona Dorada de Bucerías, un polo de alta demanda para nómadas digitales y turismo de lujo.\n\nMás que un desarrollo, es una máquina de flujo de caja que combina arquitectura de primer nivel con una gestión hotelera automatizada manos-fuera.",
                stats: [
                    { label: "Ubicación", value: "Bucerías, Nayarit" },
                    { label: "Amenidades", value: "Rooftop Pool & Wellness" },
                    { label: "Legal", value: "Fideicomiso Maestro" },
                    { label: "Suministro Total", value: "80,400 Títulos" }
                ]
            }
        },
        {
            type: "phases",
            data: {
                title: "Estructura de Capital",
                description: "Nuestra estructura de capital está diseñada para recompensar a los primeros creyentes, incrementando el valor del título de participación en cada fase y protegiendo la dilución del patrimonio.",
                currentPhaseName: "Fase Fundador",
                currentPrice: "50",
                progressPercent: 10,
                soldUnits: "3,000",
                totalUnits: "80,400",
                phases: [
                    { name: "Fase Fundador", price: "50", description: "Acceso temprano con el mayor descuento sobre el NAV estimado. Posición fundadora.", active: true },
                    { name: "Fase Estratégico", price: "75", description: "Durante el desarrollo de la obra gris y estructura principal.", active: false },
                    { name: "Fase Público", price: "100", description: "Venta a precio de mercado una vez inaugurado el desarrollo.", active: false }
                ]
            }
        },
        {
            type: "investment_example",
            data: {
                initialInvestment: "25,000",
                titlesCount: "500",
                timeline: [
                    { phase: "Fase Fundador (Compra)", value: "25,000", description: "Adquisición temprana a $50 por título. Rendimiento base asegurado." },
                    { phase: "Fase Estratégico", value: "37,500", description: "Plusvalía latente generada al ajustar el precio de mercado a $75." },
                    { phase: "Fase Público", value: "50,000", description: "Valor de mercado final a $100. Ganancia de capital del 100% ($25,000 USD) inmediata." }
                ],
                conclusion: "Al entrar en Fase Fundador, aseguras un 100% de ganancia de capital sobre el valor de mercado proyectado para la Fase Público, además de maximizar tu % de yield anual al tener un costo de adquisición base de solo $50."
            }
        },
        {
            type: "financials",
            data: {
                title: "Rendimientos Estimados y Plusvalía",
                annualYield: "10-12%",
                capitalGain: "35-40%",
                irr: "28%"
            }
        }
    ]
};

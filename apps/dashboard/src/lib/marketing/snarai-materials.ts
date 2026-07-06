export interface MarketingMaterial {
    id: string;
    title: string;
    objective: string;
    description: string;
    contentPreview: { section: string; text: string }[];
    url: string;
}

export const snaraiMaterials: MarketingMaterial[] = [
    {
        id: "project-overview",
        title: "S'Narai Project Overview",
        objective: "Entender el proyecto en menos de 5 minutos.",
        description: "El documento inicial que todo inversionista, asesor o desarrollador debe leer para entender la tesis de valor de S'Narai Bucerías.",
        url: "#overview",
        contentPreview: [
            {
                section: "Más que una inversión inmobiliaria. Una nueva forma de construir patrimonio.",
                text: "S'Narai es un desarrollo inmobiliario premium en la Zona Dorada de Bucerías, diseñado para combinar arquitectura, plusvalía (35-40% est.) y tecnología blockchain en un modelo transparente de inversión."
            },
            {
                section: "Ecosistema Digital",
                text: "Cada etapa del proyecto (desde la emisión de los 80,400 títulos hasta la entrega) está respaldada por documentación verificable (NOM-151), seguimiento en tiempo real y un Fideicomiso Maestro."
            }
        ]
    },
    {
        id: "investment-deck",
        title: "Investment Deck",
        objective: "Vender. Este es el documento comercial principal.",
        description: "La presentación comercial completa para potenciales inversores, detallando métricas, fases y beneficios financieros.",
        url: "#investment-deck",
        contentPreview: [
            {
                section: "Vive la siguiente generación de inversión inmobiliaria.",
                text: "S'Narai reúne desarrollo inmobiliario de lujo, administración hotelera profesional y tecnología para ofrecer yields operativos anuales de 10-12%."
            },
            {
                section: "Construimos confianza",
                text: "Invertir en bienes raíces nunca había sido tan transparente. Nuestro objetivo no es solamente construir un desarrollo excepcional en Riviera Nayarit; es construir confianza."
            }
        ]
    },
    {
        id: "realtor-sales-kit",
        title: "Realtor Sales Kit",
        objective: "Capacitar y apoyar a gestores inmobiliarios.",
        description: "Todo lo que necesitas para vender con confianza. Argumentos comerciales, proceso de venta y FAQs.",
        url: "#realtor-kit",
        contentPreview: [
            {
                section: "Introducción al Gestor",
                text: "Este documento fue creado para ayudarte a presentar S'Narai de manera clara y profesional. Dedica tu tiempo a generar relaciones; nosotros nos encargamos de las métricas y la tecnología."
            },
            {
                section: "¿Qué hace diferente a S'Narai?",
                text: "Arquitectura premium, ubicación estratégica en Bucerías, proceso transparente, Portal digital para inversionistas y seguimiento de obra en tiempo real."
            }
        ]
    },
    {
        id: "guia-inversionista",
        title: "Guía del Inversionista S'Narai",
        objective: "Resolver dudas y generar confianza para el cliente potencial.",
        description: "Sabemos que invertir en un desarrollo inmobiliario es una decisión importante. Esta guía acompaña al comprador de principio a fin.",
        url: "#investor-guide",
        contentPreview: [
            {
                section: "Tranquilidad Total",
                text: "Reunimos toda la información relevante en un solo lugar. Entiende cómo tu capital adquiere posiciones en las fases (Fase 1: $50 USD, Fase 2: $75 USD, Fase 3: $100 USD)."
            },
            {
                section: "Compromiso de vida",
                text: "Nuestro compromiso comienza mucho antes de la inversión y continúa durante toda la vida del proyecto en Riviera Nayarit."
            }
        ]
    },
    {
        id: "developer-kit",
        title: "Developer Kit",
        objective: "Presentar el proyecto a desarrolladores y constructoras.",
        description: "Un modelo moderno para desarrollar proyectos inmobiliarios. Exclusivo para entidades constructoras, no para programadores.",
        url: "#developer-kit",
        contentPreview: [
            {
                section: "Nuevo Estándar de Desarrollo",
                text: "S'Narai representa una nueva forma de estructurar desarrollos (como nuestro modelo en Bucerías) mediante procesos digitales, smart contracts y documentación centralizada."
            },
            {
                section: "Ecosistema Integrado",
                text: "Integra comercialización de los 80,400 títulos, seguimiento documental del fideicomiso y administración de obra en un solo motor."
            }
        ]
    },
    {
        id: "due-diligence",
        title: "Due Diligence Package",
        objective: "Validación documental para inversionistas.",
        description: "Generador de máxima confianza: el paquete técnico, legal y administrativo completo para analizar la viabilidad antes de invertir.",
        url: "#due-diligence",
        contentPreview: [
            {
                section: "Transparencia desde el primer día",
                text: "Toda inversión importante merece información clara. Revisa escrituras del terreno en Bucerías, contratos de fideicomiso y sellos NOM-151."
            },
            {
                section: "Reducción de Incertidumbre",
                text: "Organizamos licencias de construcción, manifiestos ambientales y perfiles de los desarrolladores (Aztecas) en un único expediente verificable."
            }
        ]
    },
    {
        id: "project-roadmap",
        title: "Project Roadmap",
        objective: "Mostrar el avance y cronograma.",
        description: "Del terreno a la entrega. Un documento altamente visual sobre los tiempos y fases de ejecución de S'Narai.",
        url: "#roadmap",
        contentPreview: [
            {
                section: "Hitos Verificables",
                text: "Desde la adquisición del terreno en la Zona Dorada hasta la entrega llave en mano y operación hotelera del Rooftop y Wellness center."
            },
            {
                section: "Seguimiento en Portal",
                text: "Cada fase (preventa, obra negra, obra blanca) cuenta con objetivos y avances verificables consultables en tiempo real."
            }
        ]
    },
    {
        id: "faq",
        title: "FAQ & Objeciones",
        objective: "Resolver preguntas frecuentes y apoyar el cierre de ventas.",
        description: "Todo lo que debes saber sobre S'Narai. Respuestas claras para tomar decisiones con confianza.",
        url: "#faq",
        contentPreview: [
            {
                section: "Resolución de fricción",
                text: "Respuestas a preguntas clave: ¿Soy dueño de escrituras? No, eres partícipe estructurado de las utilidades y capital del edificio respaldado por Fideicomiso."
            },
            {
                section: "Liquidez y Salida",
                text: "¿Puedo salir antes? Sí, el ecosistema cuenta con un mercado interno para cesión de derechos."
            }
        ]
    },
    {
        id: "investment-process",
        title: "Investment Process",
        objective: "Explicar el proceso de inversión paso a paso.",
        description: "¿Cómo invertir en S'Narai? Tu proceso de 8 pasos detallado.",
        url: "#investment-process",
        contentPreview: [
            {
                section: "Pasos 1 a 4",
                text: "1. Conoce el proyecto. 2. Agenda reunión. 3. Resuelve dudas. 4. Selecciona el número de Títulos (desde $50 USD en Fase 1)."
            },
            {
                section: "Pasos 5 a 8",
                text: "5. Firma documentación con NOM-151. 6. Aporta capital. 7. Entra al Portal S'Narai. 8. Sigue tu inversión en tiempo real."
            }
        ]
    },
    {
        id: "portal-guide",
        title: "Portal Guide",
        objective: "Enseñar el uso del portal del proyecto.",
        description: "Bienvenido al Portal S'Narai. Todo el proyecto en un solo lugar.",
        url: "#portal-guide",
        contentPreview: [
            {
                section: "Gestión Centralizada",
                text: "Diseñado para consultar documentos, avances, rendimientos hoteleros distribuidos y noticias, sin salir del dashboard."
            },
            {
                section: "Historial Permanente",
                text: "Tu capital y los movimientos de gobernanza (DAO) estarán siempre disponibles y actualizados para tu monitoreo financiero."
            }
        ]
    },
    {
        id: "gestores-guide",
        title: "Guía Comercial para Gestores",
        objective: "Scripts, argumentos y proceso comercial.",
        description: "Vende con seguridad. Comunica con claridad. Carpeta de ventas completa para nuestros Embajadores.",
        url: "#gestores-guide",
        contentPreview: [
            {
                section: "Pitches listos",
                text: "Incluye: Elevator Pitch (30s), Pitch (3 min) y Pitch profundo (10 min) para captar inversionistas hacia Bucerías."
            },
            {
                section: "Buenas prácticas",
                text: "Cómo presentar S'Narai frente a inmuebles tradicionales. Qué prometer, qué NO prometer, y cómo agendar citas efectivas de cierre."
            }
        ]
    }
];

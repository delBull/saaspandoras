export interface MarketingMaterial {
    metadata?: {
        audience: string;
        purpose: string;
        estimatedReadTime: string;
        salesMoment: string;
    };
    id: string;
    title: string;
    objective: string;
    description: string;
    contentPreview: { section: string; text: string }[];
    url: string;
}
export const snaraiMaterialsES: MarketingMaterial[] = [
    {
        "id": "executive-investment-brief",
        "title": "Executive Investment Brief",
        "metadata": {
            "audience": "Inversionistas Institucionales / HNWIs",
            "purpose": "Filtro inicial y resumen ejecutivo",
            "estimatedReadTime": "3 min",
            "salesMoment": "Descubrimiento inicial"
        },
        "objective": "Resumen ejecutivo de S'Narai y Pandoras.",
        "description": "S'Narai es un desarrollo inmobiliario boutique concebido para integrar arquitectura contemporánea, hospitalidad y una infraestructura operativa diseñada bajo estándares institucionales. S'Narai no busca reinventar el mercado inmobiliario; busca modernizar la forma en que los desarrollos se estructuran, administran y presentan ante inversionistas.",
        "url": "/en/institutional/executive-investment-brief",
        "contentPreview": [
            {
                "section": "Infraestructura Operativa",
                "text": "Pandoras proporciona la infraestructura tecnológica, documental y comercial que soporta el ciclo completo del proyecto bajo un modelo centralizado de Growth OS."
            },
            {
                "section": "La Oportunidad",
                "text": "Participar durante la etapa de estructuración permite acceder al proyecto antes de la preventa tradicional, acompañando el desarrollo desde sus primeras etapas."
            }
        ]
    },
    {
        "id": "project-overview",
        "title": "S'Narai Project Overview",
        "metadata": {
            "audience": "Inversionistas",
            "purpose": "Introducción rápida al proyecto",
            "estimatedReadTime": "5 min",
            "salesMoment": "Descubrimiento inicial"
        },
        "objective": "Entender el proyecto en menos de 5 minutos.",
        "description": "El documento inicial que todo inversionista, asesor o desarrollador debe leer para entender la tesis de valor de S'Narai Bucerías.",
        "url": "#overview",
        "contentPreview": [
            {
                "section": "Más que una inversión inmobiliaria. Una nueva forma de construir patrimonio.",
                "text": "S'Narai es un desarrollo inmobiliario premium en la Zona Dorada de Bucerías, diseñado para combinar arquitectura, plusvalía (35-40% est.) y tecnología blockchain en un modelo transparente de inversión."
            },
            {
                "section": "Ecosistema Digital",
                "text": "Cada etapa del proyecto (desde la emisión de los 80,400 títulos hasta la entrega) está respaldada por documentación verificable (NOM-151), seguimiento en tiempo real y un Fideicomiso Maestro."
            }
        ]
    },
    {
        "id": "investment-deck",
        "title": "Investment Deck",
        "metadata": {
            "audience": "Inversionistas",
            "purpose": "Presentación detallada de la oportunidad",
            "estimatedReadTime": "10 min",
            "salesMoment": "Reunión de ventas o seguimiento profundo"
        },
        "objective": "Visión ejecutiva del modelo de negocio.",
        "description": "El Investment Deck presenta la estructura completa del proyecto S'Narai, incluyendo la estrategia comercial, estructura de capital, calendario de ejecución y lógica de participación para inversionistas tempranos. S'Narai no busca reinventar el mercado inmobiliario; busca modernizar la forma en que los desarrollos se estructuran, administran y presentan ante inversionistas.",
        "url": "https://drive.google.com/file/d/1X42yC0R7665NfV9j_Zk5672/view?usp=sharing",
        "contentPreview": [
            {
                "section": "Founding Rounds",
                "text": "Etapa privada de estructuración previa a la comercialización. Las rondas tempranas ofrecen un menor precio de emisión debido a la participación en etapas iniciales."
            },
            {
                "section": "Proyecciones",
                "text": "Escenarios conservadores, esperados y optimistas basados en estudios de mercado y análisis financiero, sirviendo como herramienta de planeación y evaluación."
            }
        ]
    },
    {
        "id": "smart-contract-audit",
        "title": "Arquitectura Digital y Contratos Inteligentes",
        "metadata": {
            "audience": "Técnicos / Inversionistas Institucionales",
            "purpose": "Generar confianza técnica",
            "estimatedReadTime": "15 min",
            "salesMoment": "Due Diligence (Transparencia)"
        },
        "objective": "Trazabilidad y registro inmutable.",
        "description": "Pandoras utiliza contratos inteligentes como infraestructura tecnológica para establecer reglas verificables de emisión y trazabilidad. S'Narai no busca reinventar el mercado inmobiliario; busca modernizar la forma en que los desarrollos se estructuran, administran y presentan ante inversionistas.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Infraestructura Programable y Registro Inmutable",
                "text": "Operaciones registradas mediante infraestructura blockchain, proporcionando evidencia verificable y un historial resistente a alteraciones que complementa la documentación legal."
            },
            {
                "section": "Evolución de la Plataforma",
                "text": "Arquitectura diseñada para incorporar gradualmente nuevas capacidades de automatización operativa e integración con servicios financieros digitales."
            }
        ]
    },
    {
        "id": "legal-structure",
        "title": "Estructura Legal y Participación Institucional",
        "metadata": {
            "audience": "Abogados / Inversionistas",
            "purpose": "Validar la certeza jurídica",
            "estimatedReadTime": "12 min",
            "salesMoment": "Due Diligence (Cierre)"
        },
        "objective": "Comprender la arquitectura jurídica de la participación.",
        "description": "S'Narai se desarrolla mediante una estructura jurídica formal en México, respaldada por contratos de participación, documentación institucional y procesos de validación que permiten administrar el proyecto con altos estándares de transparencia. S'Narai no busca reinventar el mercado inmobiliario; busca modernizar la forma en que los desarrollos se estructuran, administran y presentan ante inversionistas.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Estructura Jurídica",
                "text": "La participación de cada inversionista queda documentada mediante instrumentos contractuales y registros internos que forman parte del ecosistema operativo de Pandoras Growth OS."
            },
            {
                "section": "Formalización y Evidencia",
                "text": "Todo el proceso de incorporación contempla validación de identidad, aceptación documental y evidencia digital de cada operación, conservada mediante mecanismos de trazabilidad."
            }
        ]
    },
    {
        "id": "market-research",
        "title": "Estudio de Mercado: Riviera Nayarit",
        "metadata": {
            "audience": "Inversionistas",
            "purpose": "Justificar la tesis geográfica",
            "estimatedReadTime": "8 min",
            "salesMoment": "Descubrimiento / Calificación"
        },
        "objective": "Validar por qué Bucerías es el mercado óptimo.",
        "description": "Análisis de datos duros sobre el boom inmobiliario en Bahía de Banderas. Incluye métricas de ocupación hotelera post-pandemia, crecimiento de tarifas (ADR) y la escasez de inventario de ultra lujo.",
        "url": "#",
        "contentPreview": [
            {
                "section": "El Efecto 'Golden Zone'",
                "text": "Por qué Bucerías absorbió la demanda de Punta Mita y Nuevo Vallarta, logrando apreciaciones anuales del 12-15% en el segmento high-end."
            },
            {
                "section": "Proyecciones Macro",
                "text": "Impacto del nuevo aeropuerto internacional, carreteras y la entrada masiva de nómadas digitales y jubilados norteamericanos."
            }
        ]
    },
    {
        "id": "partner-program",
        "title": "Growth Partner Program",
        "metadata": {
            "audience": "Brokers / Asesores Patrimoniales",
            "purpose": "Reclutar fuerza de ventas",
            "estimatedReadTime": "5 min",
            "salesMoment": "Onboarding de Gestores"
        },
        "objective": "Entender el modelo de comisiones on-chain.",
        "description": "El manual para comercializar S'Narai. Explica cómo los Gestores Patrimoniales pueden ganar comisiones líquidas (hasta 10%) en USDC de forma automatizada e inmediata, gracias a la infraestructura de Pandoras Growth OS.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Comisiones Programables",
                "text": "Olvida perseguir a los desarrolladores para cobrar. Si tu cliente invierte a través de tu enlace, el Smart Contract desvía tu comisión instantáneamente a tu wallet."
            },
            {
                "section": "Dashboard del Gestor",
                "text": "Cómo trackear tus leads, monitorear ventas en tiempo real y descargar material de marketing marca blanca."
            }
        ]
    },
    {
        "id": "financial-model",
        "title": "Modelo Financiero y Proforma",
        "metadata": {
            "audience": "Inversionistas Analíticos",
            "purpose": "Validar números",
            "estimatedReadTime": "15 min",
            "salesMoment": "Cierre profundo"
        },
        "objective": "Desglose de costos y flujos de caja.",
        "description": "Hoja de cálculo detallada y resumen en PDF con el costo de construcción por m2, gastos operativos (OPEX) proyectados, Capex, y proyecciones de flujo de caja a 5 y 10 años.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Escenarios de Estrés",
                "text": "Qué pasa con los rendimientos si la ocupación cae al 40% (pesimista) vs si se mantiene en el 75% (esperado)."
            },
            {
                "section": "Estructura de Capital",
                "text": "Uso de los fondos (Land acquisition, Soft costs, Hard costs) y la cascada de pagos."
            }
        ]
    },
    {
        "id": "architecture-dossier",
        "title": "Dossier Arquitectónico & Renders",
        "metadata": {
            "audience": "Compradores / Inversionistas",
            "purpose": "Vender el sueño (Emocional)",
            "estimatedReadTime": "4 min",
            "salesMoment": "Primer contacto / Visión"
        },
        "objective": "Inspirar a través del diseño.",
        "description": "Catálogo visual de alta resolución del proyecto. Incluye fachadas, interiores de las unidades, áreas comunes (Rooftop pool, Wellness center, Coworking) y floorplans.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Diseño Bioclimático",
                "text": "Materiales de la región integrados para reducir el consumo energético en un 25%."
            }
        ]
    },
    {
        "id": "faq",
        "title": "Preguntas Frecuentes (FAQ)",
        "metadata": {
            "audience": "Público General",
            "purpose": "Resolver objeciones rápidas",
            "estimatedReadTime": "6 min",
            "salesMoment": "Cualquier momento"
        },
        "objective": "Destruir objeciones comunes.",
        "description": "Respuestas directas a las dudas más comunes sobre la tokenización, riesgos de construcción, impuestos, uso vacacional y el proceso de venta secundaria (salida).",
        "url": "#",
        "contentPreview": [
            {
                "section": "¿Qué pasa si el desarrollador quiebra?",
                "text": "Explicación de las protecciones fiduciarias y por qué el inmueble permanece protegido."
            },
            {
                "section": "¿Tengo que pagar impuestos por las utilidades?",
                "text": "Manejo fiscal de los rendimientos (dividendos vs apreciación de capital)."
            }
        ]
    },
    {
        "id": "developer-track-record",
        "title": "Track Record del Desarrollador",
        "metadata": {
            "audience": "Inversionistas Institucionales",
            "purpose": "Generar confianza en la ejecución",
            "estimatedReadTime": "5 min",
            "salesMoment": "Due Diligence"
        },
        "objective": "Demostrar capacidad de ejecución.",
        "description": "Historia del equipo detrás de S'Narai. Proyectos anteriores completados, métricas de éxito y experiencia combinada en hospitalidad, construcción y tecnología web3.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Equipo Fundador",
                "text": "Perfiles de los arquitectos, operadores hoteleros y el equipo de ingeniería blockchain (Pandoras)."
            }
        ]
    },
    {
        "id": "tokenomics",
        "title": "Tokenomics y Mecanismos de Oferta",
        "metadata": {
            "audience": "Inversionistas Crypto-Nativos",
            "purpose": "Explicar la dinámica del token",
            "estimatedReadTime": "7 min",
            "salesMoment": "Análisis Técnico"
        },
        "objective": "Entender el supply y los incentivos.",
        "description": "Desglose de los 80,400 Títulos Participativos Inmobiliarios. Explica las fases de preventa (Seed, Private, Public), descuentos por fase, mecanismos de vesting (si aplican) y utilidades del token (gobernanza, noches gratis).",
        "url": "#",
        "contentPreview": [
            {
                "section": "Dinámica de Precios (Tranches)",
                "text": "Cómo el precio del token aumenta algorítmicamente en cada fase de levantamiento."
            }
        ]
    },
    {
        "id": "how-to-buy",
        "title": "Guía Paso a Paso: Cómo Invertir",
        "metadata": {
            "audience": "Inversionistas No-Técnicos",
            "purpose": "Facilitar el onboarding",
            "estimatedReadTime": "3 min",
            "salesMoment": "Cierre / Onboarding"
        },
        "objective": "Eliminar fricción tecnológica al pagar.",
        "description": "Manual visual muy sencillo sobre cómo crear una cuenta en el Portal S'Narai, pasar la verificación de identidad (KYC), firmar el contrato y realizar el pago (vía SPEI, tarjeta o Crypto).",
        "url": "#",
        "contentPreview": [
            {
                "section": "Rampa Fiat (Dinero Tradicional)",
                "text": "Instrucciones para transferir desde cualquier banco en México (SPEI) sin necesidad de entender blockchain."
            }
        ]
    },
    {
        "id": "founding-round-guide",
        "title": "Founding Round Guide",
        "metadata": {
            "audience": "Inversionistas y Gestores",
            "purpose": "Explicación de la Ronda Fundadora",
            "estimatedReadTime": "10 min",
            "salesMoment": "Educación y Profundización"
        },
        "objective": "Entender qué es la Ronda Fundadora y por qué invertir temprano.",
        "description": "Explicación detallada sobre qué es la ronda fundadora, por qué existen tres rondas, cómo funciona la progresión de precios, por qué Pandoras no reabre rondas y qué ocurre después de concluir.",
        "url": "/es/institutional/founding-round-guide",
        "contentPreview": [
            {
                "section": "Riesgo y Valor",
                "text": "Los inversionistas tempranos participan en condiciones que no estarán disponibles cuando el proyecto entre a preventa pública."
            }
        ]
    }
];
export const snaraiMaterialsEN: MarketingMaterial[] = [
    {
        "id": "executive-investment-brief",
        "title": "Executive Investment Brief",
        "metadata": {
            "audience": "Institutional Investors / HNWIs",
            "purpose": "Initial filter and executive summary",
            "estimatedReadTime": "3 min",
            "salesMoment": "Initial Discovery"
        },
        "objective": "Executive summary of S'Narai and Pandoras.",
        "description": "S'Narai is a boutique real estate development conceived to integrate contemporary architecture, hospitality, and an operational infrastructure designed under institutional standards. S'Narai does not seek to reinvent the real estate market; it seeks to modernize the way developments are structured, managed, and presented to investors.",
        "url": "/en/institutional/executive-investment-brief",
        "contentPreview": [
            {
                "section": "Operational Infrastructure",
                "text": "Pandoras provides the technological, documentary, and commercial infrastructure that supports the complete cycle of the project under a centralized Growth OS model."
            },
            {
                "section": "The Opportunity",
                "text": "Participating during the structuring stage allows accessing the project before traditional presales, accompanying the development from its early stages."
            }
        ]
    },
    {
        "id": "project-overview",
        "title": "S'Narai Project Overview",
        "metadata": {
            "audience": "Investors",
            "purpose": "Quick introduction to the project",
            "estimatedReadTime": "5 min",
            "salesMoment": "Initial Discovery"
        },
        "objective": "Understand the project in under 5 minutes.",
        "description": "The initial document every investor, advisor, or developer must read to understand the value thesis of S'Narai Bucerías.",
        "url": "#overview",
        "contentPreview": [
            {
                "section": "More than real estate investment. A new way to build wealth.",
                "text": "S'Narai is a premium real estate development in the Golden Zone of Bucerías, designed to combine architecture, capital appreciation (35-40% est.), and blockchain technology in a transparent investment model."
            },
            {
                "section": "Digital Ecosystem",
                "text": "Every stage of the project (from the issuance of 80,400 titles to delivery) is backed by verifiable documentation, real-time tracking, and a Master Trust."
            }
        ]
    },
    {
        "id": "investment-deck",
        "title": "Investment Deck",
        "metadata": {
            "audience": "Investors",
            "purpose": "Detailed presentation of the opportunity",
            "estimatedReadTime": "10 min",
            "salesMoment": "Sales meeting or deep dive"
        },
        "objective": "Executive vision of the business model.",
        "description": "The Investment Deck presents the complete structure of the S'Narai project, including the commercial strategy, capital structure, execution schedule, and participation logic for early investors. S'Narai does not seek to reinvent the real estate market; it seeks to modernize the way developments are structured, managed, and presented to investors.",
        "url": "https://drive.google.com/file/d/1X42yC0R7665NfV9j_Zk5672/view?usp=sharing",
        "contentPreview": [
            {
                "section": "Founding Rounds",
                "text": "Private structuring stage prior to commercialization. Early rounds offer a lower issuance price due to participation in initial stages."
            },
            {
                "section": "Projections",
                "text": "Conservative, expected, and optimistic scenarios based on market studies and financial analysis, serving as a planning and evaluation tool."
            }
        ]
    },
    {
        "id": "smart-contract-audit",
        "title": "Digital Architecture and Smart Contracts",
        "metadata": {
            "audience": "Tech / Institutional Investors",
            "purpose": "Build technical trust",
            "estimatedReadTime": "15 min",
            "salesMoment": "Due Diligence (Transparency)"
        },
        "objective": "Traceability and immutable registry.",
        "description": "Pandoras uses smart contracts as technological infrastructure to establish verifiable issuance and traceability rules. S'Narai does not seek to reinvent the real estate market; it seeks to modernize the way developments are structured, managed, and presented to investors.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Programmable Infrastructure & Immutable Registry",
                "text": "Operations recorded via blockchain infrastructure, providing verifiable evidence and a tamper-resistant history that complements legal documentation."
            },
            {
                "section": "Platform Evolution",
                "text": "Architecture designed to gradually incorporate new operational automation capabilities and integration with digital financial services."
            }
        ]
    },
    {
        "id": "legal-structure",
        "title": "Legal Structure and Institutional Participation",
        "metadata": {
            "audience": "Lawyers / Investors",
            "purpose": "Validate legal certainty",
            "estimatedReadTime": "12 min",
            "salesMoment": "Due Diligence (Closing)"
        },
        "objective": "Understand the legal architecture of participation.",
        "description": "S'Narai is developed through a formal legal structure in Mexico, backed by participation contracts, institutional documentation, and validation processes that allow managing the project with high transparency standards. S'Narai does not seek to reinvent the real estate market; it seeks to modernize the way developments are structured, managed, and presented to investors.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Legal Structure",
                "text": "Each investor's participation is documented through contractual instruments and internal records that form part of the operational ecosystem of Pandoras Growth OS."
            },
            {
                "section": "Formalization and Evidence",
                "text": "The entire incorporation process includes identity validation, documentary acceptance, and digital evidence of each operation, preserved through traceability mechanisms."
            }
        ]
    },
    {
        "id": "market-research",
        "title": "Market Research: Riviera Nayarit",
        "metadata": {
            "audience": "Investors",
            "purpose": "Justify the geographical thesis",
            "estimatedReadTime": "8 min",
            "salesMoment": "Discovery / Qualification"
        },
        "objective": "Validate why Bucerías is the optimal market.",
        "description": "Hard data analysis of the real estate boom in Bahía de Banderas. Includes post-pandemic hotel occupancy metrics, ADR growth, and the scarcity of ultra-luxury inventory.",
        "url": "#",
        "contentPreview": [
            {
                "section": "The 'Golden Zone' Effect",
                "text": "Why Bucerías absorbed the demand from Punta Mita and Nuevo Vallarta, achieving annual appreciations of 12-15% in the high-end segment."
            },
            {
                "section": "Macro Projections",
                "text": "Impact of the new international airport, highways, and the massive influx of digital nomads and North American retirees."
            }
        ]
    },
    {
        "id": "partner-program",
        "title": "Growth Partner Program",
        "metadata": {
            "audience": "Brokers / Wealth Advisors",
            "purpose": "Recruit sales force",
            "estimatedReadTime": "5 min",
            "salesMoment": "Partner Onboarding"
        },
        "objective": "Understand the on-chain commission model.",
        "description": "The manual for marketing S'Narai. Explains how Growth Partners can earn liquid commissions (up to 10%) in USDC automatically and instantly, thanks to Pandoras Growth OS infrastructure.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Programmable Commissions",
                "text": "Forget chasing developers to get paid. If your client invests through your link, the Smart Contract routes your commission instantly to your wallet."
            },
            {
                "section": "Partner Dashboard",
                "text": "How to track your leads, monitor real-time sales, and download white-label marketing material."
            }
        ]
    },
    {
        "id": "financial-model",
        "title": "Financial Model and Proforma",
        "metadata": {
            "audience": "Analytical Investors",
            "purpose": "Validate numbers",
            "estimatedReadTime": "15 min",
            "salesMoment": "Deep Closing"
        },
        "objective": "Cost breakdown and cash flows.",
        "description": "Detailed spreadsheet and PDF summary with construction cost per sqm, projected operational expenses (OPEX), Capex, and 5 to 10-year cash flow projections.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Stress Scenarios",
                "text": "What happens to returns if occupancy drops to 40% (pessimistic) vs if it stays at 75% (expected)."
            },
            {
                "section": "Capital Structure",
                "text": "Use of funds (Land acquisition, Soft costs, Hard costs) and the payment waterfall."
            }
        ]
    },
    {
        "id": "architecture-dossier",
        "title": "Architectural Dossier & Renders",
        "metadata": {
            "audience": "Buyers / Investors",
            "purpose": "Sell the dream (Emotional)",
            "estimatedReadTime": "4 min",
            "salesMoment": "First contact / Vision"
        },
        "objective": "Inspire through design.",
        "description": "High-resolution visual catalog of the project. Includes facades, unit interiors, common areas (Rooftop pool, Wellness center, Coworking), and floorplans.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Bioclimatic Design",
                "text": "Regional materials integrated to reduce energy consumption by 25%."
            }
        ]
    },
    {
        "id": "faq",
        "title": "Frequently Asked Questions (FAQ)",
        "metadata": {
            "audience": "General Public",
            "purpose": "Resolve quick objections",
            "estimatedReadTime": "6 min",
            "salesMoment": "Anytime"
        },
        "objective": "Destroy common objections.",
        "description": "Direct answers to the most common doubts regarding tokenization, construction risks, taxes, vacation use, and the secondary market process (exit).",
        "url": "#",
        "contentPreview": [
            {
                "section": "What happens if the developer goes bankrupt?",
                "text": "Explanation of fiduciary protections and why the property remains protected."
            },
            {
                "section": "Do I have to pay taxes on profits?",
                "text": "Tax handling of yields (dividends vs capital appreciation)."
            }
        ]
    },
    {
        "id": "developer-track-record",
        "title": "Developer Track Record",
        "metadata": {
            "audience": "Institutional Investors",
            "purpose": "Build execution trust",
            "estimatedReadTime": "5 min",
            "salesMoment": "Due Diligence"
        },
        "objective": "Demonstrate execution capabilities.",
        "description": "History of the team behind S'Narai. Past completed projects, success metrics, and combined experience in hospitality, construction, and web3 technology.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Founding Team",
                "text": "Profiles of architects, hotel operators, and the blockchain engineering team (Pandoras)."
            }
        ]
    },
    {
        "id": "tokenomics",
        "title": "Tokenomics and Supply Mechanics",
        "metadata": {
            "audience": "Crypto-Native Investors",
            "purpose": "Explain token dynamics",
            "estimatedReadTime": "7 min",
            "salesMoment": "Technical Analysis"
        },
        "objective": "Understand supply and incentives.",
        "description": "Breakdown of the 80,400 Real Estate Participation Titles. Explains the presale phases (Seed, Private, Public), phase discounts, vesting mechanisms (if applicable), and token utilities (governance, free nights).",
        "url": "#",
        "contentPreview": [
            {
                "section": "Pricing Dynamics (Tranches)",
                "text": "How the token price algorithmically increases in every funding phase."
            }
        ]
    },
    {
        "id": "how-to-buy",
        "title": "Step-by-Step Guide: How to Invest",
        "metadata": {
            "audience": "Non-Technical Investors",
            "purpose": "Facilitate onboarding",
            "estimatedReadTime": "3 min",
            "salesMoment": "Closing / Onboarding"
        },
        "objective": "Eliminate tech friction when paying.",
        "description": "Very simple visual manual on how to create an account on the S'Narai Portal, pass identity verification (KYC), sign the contract, and make the payment (via SPEI, card, or Crypto).",
        "url": "#",
        "contentPreview": [
            {
                "section": "Fiat On-Ramp (Traditional Money)",
                "text": "Instructions to transfer from any bank in Mexico (SPEI) without needing to understand blockchain."
            }
        ]
    },
    {
        "id": "founding-round-guide",
        "title": "Founding Round Guide",
        "metadata": {
            "audience": "Investors and Managers",
            "purpose": "Explanation of the Founding Round",
            "estimatedReadTime": "10 min",
            "salesMoment": "Education and Deep Dive"
        },
        "objective": "Understand what the Founding Round is and why to invest early.",
        "description": "Detailed explanation of what the founding round is, why there are three rounds, how the price progression works, why Pandoras does not reopen rounds, and what happens after it concludes.",
        "url": "/en/institutional/founding-round-guide",
        "contentPreview": [
            {
                "section": "Risk and Value",
                "text": "Early investors participate in conditions that will not be available when the project enters public presale."
            }
        ]
    }
];
// Default export for backward compatibility if needed, although state/route.ts should handle locale logic
export const snaraiMaterials = snaraiMaterialsES;
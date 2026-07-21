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
        "objective": "An Executive Overview for Prospective Investors",
        "description": "Este documento no intenta vender. Intenta responder una sola pregunta: '¿Vale la pena que dedique una hora de mi tiempo a estudiar esto?'",
        "url": "/en/institutional/executive-investment-brief",
        "contentPreview": [
            {
                "section": "Executive Summary",
                "text": "Resumen muy ejecutivo de qué es S'Narai, qué hace Pandoras y qué oportunidad existe."
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
        "objective": "Analizar los números y la estructura de capital.",
        "description": "El pitch deck oficial que detalla la oportunidad comercial en Riviera Nayarit, el modelo financiero, el plan maestro arquitectónico y las fases de desarrollo (Semilla, Construcción, Operación).",
        "url": "https://drive.google.com/file/d/1X42yC0R7665NfV9j_Zk5672/view?usp=sharing",
        "contentPreview": [
            {
                "section": "Desglose Financiero (TIR y Yields)",
                "text": "Proyecciones de ocupación, tarifas promedio (ADR), y distribución de ingresos (70% inversionistas / 30% operación) en diferentes escenarios."
            },
            {
                "section": "Roadmap de Ejecución",
                "text": "Cronograma desde la constitución del Fideicomiso y Preventa F&F (Q2 2026) hasta el Soft Opening (Q1 2028)."
            }
        ]
    },
    {
        "id": "smart-contract-audit",
        "title": "Arquitectura On-Chain & Contratos Inteligentes",
        "metadata": {
            "audience": "Técnicos / Inversionistas Institucionales",
            "purpose": "Generar confianza técnica",
            "estimatedReadTime": "15 min",
            "salesMoment": "Due Diligence (Transparencia)"
        },
        "objective": "Demostrar la seguridad e inmutabilidad de la red.",
        "description": "Resumen técnico de los Smart Contracts desplegados en la red blockchain. Detalla el token standard (ERC-1155/ERC-20), las funciones de minteo y quema de certificados, y el mecanismo automatizado de distribución de ganancias.",
        "url": "#",
        "contentPreview": [
            {
                "section": "El 'Dividend Distributor' Contract",
                "text": "Cómo las utilidades hoteleras se inyectan como USDC y se distribuyen instantáneamente a las wallets de los tenedores de Certificados, sin intervención humana."
            },
            {
                "section": "Gobernanza Descentralizada",
                "text": "El sistema de votación on-chain que permite a los token holders tomar decisiones críticas sobre remodelaciones, operadores hoteleros o la posible venta en bloque del edificio."
            }
        ]
    },
    {
        "id": "legal-structure",
        "title": "Estructura Legal y Fideicomiso (NOM-151)",
        "metadata": {
            "audience": "Abogados / Inversionistas",
            "purpose": "Validar la certeza jurídica",
            "estimatedReadTime": "12 min",
            "salesMoment": "Due Diligence (Cierre)"
        },
        "objective": "Comprender cómo lo digital se ata a la propiedad real en México.",
        "description": "Documento clave que explica el puente entre la Blockchain y las Leyes Mexicanas. Describe el rol del Fideicomiso Maestro Inmobiliario, y cómo los Smart Contracts actúan como instrucciones irrevocables validadas mediante la NOM-151.",
        "url": "#",
        "contentPreview": [
            {
                "section": "El Fideicomiso",
                "text": "S'Narai SA de CV aporta el inmueble al Fideicomiso. Los certificados digitales representan derechos de fideicomisario, garantizando que el activo no puede ser embargado ni vendido sin el consenso de la DAO."
            },
            {
                "section": "Firma Electrónica Avanzada",
                "text": "El proceso de KYC/AML automatizado y la firma de contratos de adhesión con validez jurídica oficial ante la SE."
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
        "id": "hotel-operator",
        "title": "Operación Hotelera y Property Management",
        "metadata": {
            "audience": "Inversionistas enfocados en flujo",
            "purpose": "Garantizar la calidad de operación",
            "estimatedReadTime": "6 min",
            "salesMoment": "Due Diligence Operativo"
        },
        "objective": "Explicar quién y cómo operará el edificio.",
        "description": "Estrategia de comercialización de rentas vacacionales. Canales de distribución (Airbnb Luxe, Booking, Agencias directas), estándares de servicio (concierge, limpieza) y mantenimiento del activo.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Comisiones y Mantenimiento",
                "text": "Desglose del porcentaje que retiene el operador hotelero y el fondo de reserva para el mantenimiento del edificio."
            }
        ]
    }
,
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
        "objective": "An Executive Overview for Prospective Investors",
        "description": "This document is not trying to sell. It aims to answer a single question: 'Is this worth an hour of my time to study?'",
        "url": "/en/institutional/executive-investment-brief",
        "contentPreview": [
            {
                "section": "Executive Summary",
                "text": "A highly executive summary of what S'Narai is, what Pandoras does, and what the opportunity entails."
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
        "objective": "Analyze the numbers and capital structure.",
        "description": "The official pitch deck detailing the commercial opportunity in Riviera Nayarit, the financial model, the architectural master plan, and the development phases (Seed, Construction, Operation).",
        "url": "https://drive.google.com/file/d/1X42yC0R7665NfV9j_Zk5672/view?usp=sharing",
        "contentPreview": [
            {
                "section": "Financial Breakdown (IRR and Yields)",
                "text": "Occupancy projections, average daily rates (ADR), and revenue distribution (70% investors / 30% operations) across different scenarios."
            },
            {
                "section": "Execution Roadmap",
                "text": "Timeline from Trust constitution and F&F Presale (Q2 2026) to Soft Opening (Q1 2028)."
            }
        ]
    },
    {
        "id": "smart-contract-audit",
        "title": "On-Chain Architecture & Smart Contracts",
        "metadata": {
            "audience": "Tech / Institutional Investors",
            "purpose": "Build technical trust",
            "estimatedReadTime": "15 min",
            "salesMoment": "Due Diligence (Transparency)"
        },
        "objective": "Demonstrate the security and immutability of the network.",
        "description": "Technical summary of the Smart Contracts deployed on the blockchain network. Details the token standard (ERC-1155/ERC-20), minting and burning functions, and the automated profit distribution mechanism.",
        "url": "#",
        "contentPreview": [
            {
                "section": "The 'Dividend Distributor' Contract",
                "text": "How hotel profits are injected as USDC and distributed instantly to Certificate holders' wallets, without human intervention."
            },
            {
                "section": "Decentralized Governance",
                "text": "The on-chain voting system that allows token holders to make critical decisions about renovations, hotel operators, or the potential block sale of the building."
            }
        ]
    },
    {
        "id": "legal-structure",
        "title": "Legal Structure and Trust (NOM-151)",
        "metadata": {
            "audience": "Lawyers / Investors",
            "purpose": "Validate legal certainty",
            "estimatedReadTime": "12 min",
            "salesMoment": "Due Diligence (Closing)"
        },
        "objective": "Understand how the digital ties to real property in Mexico.",
        "description": "Key document explaining the bridge between Blockchain and Mexican Laws. Describes the role of the Master Real Estate Trust, and how Smart Contracts act as irrevocable instructions validated via NOM-151.",
        "url": "#",
        "contentPreview": [
            {
                "section": "The Trust",
                "text": "S'Narai SA de CV contributes the property to the Trust. Digital certificates represent trust beneficiary rights, ensuring the asset cannot be seized or sold without DAO consensus."
            },
            {
                "section": "Advanced Electronic Signature",
                "text": "The automated KYC/AML process and the signing of adhesion contracts with official legal validity."
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
        "id": "hotel-operator",
        "title": "Hotel Operations and Property Management",
        "metadata": {
            "audience": "Yield-focused investors",
            "purpose": "Guarantee operational quality",
            "estimatedReadTime": "6 min",
            "salesMoment": "Operational Due Diligence"
        },
        "objective": "Explain who and how the building will be operated.",
        "description": "Vacation rental commercialization strategy. Distribution channels (Airbnb Luxe, Booking, direct agencies), service standards (concierge, cleaning), and asset maintenance.",
        "url": "#",
        "contentPreview": [
            {
                "section": "Commissions and Maintenance",
                "text": "Breakdown of the percentage retained by the hotel operator and the reserve fund for building maintenance."
            }
        ]
    }
];

// Default export for backward compatibility if needed, although state/route.ts should handle locale logic
export const snaraiMaterials = snaraiMaterialsES;

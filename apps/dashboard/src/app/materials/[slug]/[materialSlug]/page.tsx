import React from 'react';
import { MaterialViewer } from './MaterialViewer';
import { mockSNaraiDeck } from '@/lib/marketing/mock-snarai-deck';
import { snaraiMaterialsES, snaraiMaterialsEN } from '@/lib/marketing/snarai-materials';

// Unique content overrides per materialSlug
// Each key matches the `id` in snaraiMaterials
const MATERIAL_CONTENT: Record<string, { hero?: string; heroSubtitle?: string; intro?: string; cssBackground?: string }> = {
    'project-overview': {
        hero: "La evolución de la Riviera.",
        heroSubtitle: "Todo lo que necesitas saber sobre S'Narai en 5 minutos.",
        intro: "El documento inicial que todo inversionista, asesor o desarrollador debe leer para entender la tesis de valor de S'Narai Bucerías. Arquitectura premium, estructuración institucional, 80,400 títulos y escenarios financieros basados en supuestos operativos del proyecto.",
        cssBackground: "bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-900/40 via-zinc-950 to-black",
    },
    'investment-deck': {
        hero: "Vive la siguiente generación de inversión.",
        heroSubtitle: "El deck comercial completo. Diseñado para convencer.",
        intro: "La presentación comercial de S'Narai detalla métricas, fases de inversión (Fundador $50, Estratégico $75, Público $100) y el modelo de flujo de caja que convierte un desarrollo inmobiliario en una máquina de rendimientos.",
        cssBackground: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-700/30 via-black to-zinc-950 bg-[linear-gradient(to_right,#f59e0b10_1px,transparent_1px),linear-gradient(to_bottom,#f59e0b10_1px,transparent_1px)] bg-[size:32px_32px]",
    },
    'realtor-sales-kit': {
        hero: "Vende con confianza. Cierra con datos.",
        heroSubtitle: "Tu kit completo para presentar S'Narai a cualquier cliente.",
        intro: "Creado específicamente para Gestores Patrimoniales. Incluye argumentos comerciales, comparativas con inversiones tradicionales, proceso de venta paso a paso y respuestas a las objeciones más comunes del mercado.",
        cssBackground: "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/40 via-black to-black bg-[linear-gradient(to_right,#10b98110_1px,transparent_1px),linear-gradient(to_bottom,#10b98110_1px,transparent_1px)] bg-[size:48px_48px]",
    },
    'guia-inversionista': {
        hero: "Tu inversión. Completamente clara.",
        heroSubtitle: "De principio a fin, acompañamos cada decisión.",
        intro: "Entiende cómo tu capital adquiere posiciones en S'Narai desde la Fase Fundador ($50 USD). Esta guía resuelve dudas sobre el Fideicomiso, el mercado de cesión de derechos, los rendimientos y el acceso a tu Portal de inversionista.",
        cssBackground: "bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-amber-600/20 via-black to-zinc-950",
    },
    'developer-kit': {
        hero: "Un nuevo estándar para construir.",
        heroSubtitle: "El modelo S'Narai aplicado al desarrollo inmobiliario moderno.",
        intro: "Documento exclusivo para entidades constructoras e inversionistas institucionales. Explica cómo S'Narai integra tecnología de trazabilidad, proceso de formalización digital con mecanismos de evidencia documental, y la comercialización de los 80,400 títulos en un solo ecosistema.",
        cssBackground: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-black to-black bg-[linear-gradient(to_right,#3b82f610_1px,transparent_1px),linear-gradient(to_bottom,#3b82f610_1px,transparent_1px)] bg-[size:24px_24px]",
    },
    'due-diligence': {
        hero: "Transparencia total. Desde el día uno.",
        heroSubtitle: "El paquete completo para que analices antes de invertir.",
        intro: "El Due Diligence de S'Narai incluye documentos de estructuración patrimonial (Fideicomiso en proceso de formalización), certeza de la tierra en Bucerías y la documentación regulatoria que asegura el desarrollo del proyecto.",
        cssBackground: "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-zinc-700/30 via-black to-black bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:80px_80px]",
    },
    'project-roadmap': {
        hero: "Del terreno a la entrega. Cada hito verificable.",
        heroSubtitle: "Un cronograma claro para cada fase del proyecto.",
        intro: "Sigue la ejecución de S'Narai desde la adquisición del terreno hasta la operación hotelera del Rooftop Pool & Wellness Center. Cada fase (preventa, obra negra, obra blanca, entrega) con objetivos y avances en tiempo real.",
        cssBackground: "bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-amber-600/20 via-black to-black bg-[repeating-linear-gradient(45deg,#f59e0b05_0px,#f59e0b05_2px,transparent_2px,transparent_12px)]",
    },
    'faq': {
        hero: "Tus preguntas. Nuestras respuestas.",
        heroSubtitle: "Todo lo que necesitas saber antes de invertir.",
        intro: "¿Soy dueño de escrituras? ¿Puedo vender mi posición antes? ¿Qué pasa si la obra se retrasa? ¿Cómo recibo mis rendimientos? Este documento responde las 30+ preguntas más frecuentes con claridad y sin letra chica.",
        cssBackground: "bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black",
    },
    'investment-process': {
        hero: "Tu proceso de inversión en 8 pasos.",
        heroSubtitle: "Simple, seguro y completamente transparente.",
        intro: "Desde conocer el proyecto hasta recibir acceso a tu Portal de inversionista. Cada paso está documentado: selección de títulos, firma con NOM-151, aporte de capital y activación de tu cuenta en el ecosistema S'Narai.",
        cssBackground: "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/40 via-black to-black bg-[radial-gradient(circle,#ffffff10_1px,transparent_1px)] bg-[size:20px_20px]",
    },
    'portal-guide': {
        hero: "Bienvenido a tu Portal S'Narai.",
        heroSubtitle: "Todo el proyecto, siempre disponible en un solo lugar.",
        intro: "El Portal S'Narai es tu centro de control como inversionista. Consulta documentos, avances de obra, distribución de rendimientos hoteleros, historial de gobernanza DAO y el estado en tiempo real de tu participación.",
        cssBackground: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black",
    },
    'gestores-guide': {
        hero: "Vende más. Explica menos.",
        heroSubtitle: "La guía comercial completa para nuestros Embajadores.",
        intro: "Incluye el Elevator Pitch (30s), el Pitch de 3 minutos y el Pitch profundo (10 min). Cómo presentar S'Narai frente a inmuebles tradicionales, qué prometer, qué NO prometer, y scripts listos para WhatsApp y LinkedIn.",
        cssBackground: "bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-800/30 via-black to-black",
    },
    'escenarios-financieros': {
        hero: "Tu patrimonio. Seis formas de verlo crecer.",
        heroSubtitle: "Análisis financiero detallado bajo supuestos hipotéticos. No es una promesa de rendimiento.",
        intro: `S'Narai no es un proyecto de venta inmobiliaria tradicional. Es un activo patrimonial tokenizado con liquidez secundaria: participas en las utilidades y capital de un edificio premium, con la posibilidad de ceder tu posición en cualquier momento a través del mercado interno.

Este documento modela seis escenarios financieros hipotéticos con los mismos supuestos base para que puedas entender el potencial de tu inversión bajo diferentes estrategias patrimoniales.`,
        cssBackground: "bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-700/20 via-black to-black bg-[linear-gradient(to_right,#10b9810a_1px,transparent_1px),linear-gradient(to_bottom,#10b9810a_1px,transparent_1px)] bg-[size:16px_16px]",
    },
    'investor-journey-guide': {
        hero: "Cierra ventas con claridad institucional.",
        heroSubtitle: "El documento maestro para la fuerza de ventas.",
        intro: "Este documento está diseñado para alinear el discurso comercial. No estás vendiendo 'crypto', ni 'tiempos compartidos'. Estás vendiendo una participación económica estructurada en un fideicomiso inmobiliario, con la mayor transparencia y seguridad del mercado.",
        cssBackground: "bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-800/20 via-black to-black",
    },
};


export default async function MaterialPage({ params, searchParams }: { params: Promise<{ slug: string, materialSlug: string }>, searchParams?: Promise<{ lang?: string }> }) {
    const { slug, materialSlug } = await params;
    const t = (es, en) => lang === 'en' ? en : es;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const lang = resolvedSearchParams.lang || 'es';
    
    // Find the matching material definition
    const activeMaterials = lang === 'en' ? snaraiMaterialsEN : snaraiMaterialsES;
    const material = activeMaterials.find(m => m.id === materialSlug);
    const contentOverride = MATERIAL_CONTENT[materialSlug];

    const title = material?.title ?? materialSlug.replace(/-/g, ' ').toUpperCase();
    const firstBlock = mockSNaraiDeck.blocks?.[0];

    // Rich financial scenario blocks for the dedicated document
    const financialScenarioBlocks = materialSlug === 'escenarios-financieros' ? [
        {
            type: 'info',
            data: {
                sectionLabel: 'Supuestos Base',
                title: 'Supuestos Generales del Modelo Financiero',
                content: `Estos números son modelos financieros hipotéticos, no una promesa de rendimiento. Sirven para entender los incentivos y diseñar la estrategia de inversión.`,
                stats: [
                    { label: 'Capital requerido', value: '$100M MXN' },
                    { label: 'Departamentos objetivo', value: '20 unidades' },
                    { label: 'Precio preventa inicial', value: 'USD $400,000' },
                    { label: 'Tipo de cambio modelo', value: '$18 MXN/USD' },
                    { label: 'Valor preventa / depto.', value: '$7.2M MXN' },
                    { label: 'Plusvalía anual esperada', value: '12% – 15%' },
                    { label: 'Rentabilidad renta bruta', value: '10% – 12% anual' },
                    { label: 'Ocupación promedio estabilizada', value: '65% – 75%' },
                    { label: 'Ingreso neto renta / depto.', value: '$528,000 MXN / año' },
                ]
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Escenario 1 — Patrimonial Fundador',
                title: 'Conservación Máxima: Construimos, recuperamos capital, conservamos el activo',
                content: `Estrategia: Se comercializa el 20% del proyecto (4 departamentos). El inversionista Fase Fundador que entra a $400,000 USD ($7.2M MXN) ve su activo crecer a ~$12.7M MXN en 5 años (plusvalía 12% compuesta). Las rentas acumuladas suman $2.64M MXN adicionales. Resultado total al año 5: ~$15.34M MXN sobre una inversión inicial de $7.2M MXN.`,
                stats: [
                    { label: 'Inversión inicial Fase Fundador', value: 'USD $400,000' },
                    { label: 'Valor departamento año 5', value: '~$12.7M MXN' },
                    { label: 'Rentas netas acumuladas (5 años)', value: '$2.64M MXN' },
                    { label: 'Valor total estimado año 5', value: '~$15.34M MXN' },
                    { label: 'ROI estimado (5 años)', value: '+113%' },
                ]
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Escenario 2 — Patrimonial Balanceado',
                title: 'El punto óptimo: Vendemos lo suficiente para devolver capital',
                content: `Estrategia 70/30: Se venden 6 departamentos (30%), recuperando $43.2M MXN para financiar construcción y devolver a participantes tempranos. El inversionista fundador que cede su posición en año 2 obtiene ~25% de ganancia. El comprador secundario que entra a $500,000 USD en año 2 adquiere una participación madura con menos riesgo y plusvalía futura proyectada a $15M MXN en año 5. Ambos participantes ganan en diferentes momentos del ciclo.`,
                stats: [
                    { label: 'Precio entrada secundaria (año 2)', value: 'USD $500,000' },
                    { label: 'Ganancia fundador en salida', value: '+25%' },
                    { label: 'Valor para comprador secundario (año 5)', value: '~$15M MXN' },
                    { label: 'Ganancia comprador secundario', value: '+$5M MXN' },
                ]
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Escenario 3 — Patrimonial Estratégico',
                title: 'Timing inteligente: Vendemos en los momentos de mayor precio',
                content: `Este modelo no vende todo en preventa. Hace timing por fases para capturar el máximo precio posible en cada etapa del ciclo del proyecto.`,
                stats: [
                    { label: 'Fase Fundador (2 deptos.)', value: 'USD $400K → $14.4M MXN' },
                    { label: 'Fase Estratégica (4 deptos. +15%)', value: 'USD $460K → $33.1M MXN' },
                    { label: 'Fase Pública (4 deptos. +30%)', value: 'USD $520K → $37.4M MXN' },
                    { label: 'Venta Tardía (2 deptos. +60%)', value: 'USD $640K → $23M MXN' },
                    { label: 'Total ingresos por ventas', value: '$107.9M MXN' },
                    { label: '8 departamentos retenidos (valor año 5)', value: '$101.6M MXN' },
                ]
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Escenario 4 — Mercado Secundario Activo',
                title: 'No vendemos departamentos: vendemos liquidez',
                content: `El modelo más Web3. Las posiciones se ceden entre participantes sin que el activo físico cambie de estructura jurídica. El fundador que vende su posición en año 2 captura la plusvalía acumulada. El nuevo participante entra a un proyecto más maduro, con menos riesgo constructivo y con plusvalía futura todavía disponible.`,
                stats: [
                    { label: 'Precio de entrada (Fundador)', value: '$7.2M MXN' },
                    { label: 'Precio de cesión (año 2)', value: '$10M MXN' },
                    { label: 'Ganancia del Fundador', value: '+$2.8M MXN' },
                    { label: 'Valor para nuevo participante (año 5)', value: '~$15M MXN' },
                    { label: 'Ganancia del nuevo participante', value: '+$5M MXN' },
                ]
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Escenario 5 — Expansión Patrimonial',
                title: 'S\'Narai como primer activo generador de un ecosistema',
                content: `La estrategia de largo plazo: el flujo de rentas generado por las participaciones retenidas financia nuevos proyectos y reservas. El activo se convierte en capital de trabajo para el ecosistema inversionista, no solo en un bien que se consume al venderse.`,
                stats: [
                    { label: 'Valor patrimonial año 5', value: '$203M MXN' },
                    { label: 'Flujo de renta neta anual', value: '$8.4M MXN' },
                ]
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Escenario 6 — Patrimonial Conservador',
                title: 'El escenario más probable: casi nadie vende',
                content: `Basado en el comportamiento histórico de inversionistas patrimoniales: cuando el activo produce flujo, no hay presión de venta. Con solo 3 departamentos comercializados en etapa inicial ($21.6M MXN) y 17 unidades retenidas, el ecosistema genera el mayor patrimonio absoluto a 5 años. Los inversionistas originales no necesitan que todo se venda porque el activo produce por sí solo.`,
                stats: [
                    { label: 'Departamentos vendidos', value: '3 unidades' },
                    { label: 'Departamentos retenidos', value: '17 unidades' },
                    { label: 'Valor patrimonial año 5', value: '$215.9M MXN' },
                    { label: 'Flujo de renta neta anual', value: '$8.9M MXN' },
                ]
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Comparativa Final — Los 6 Escenarios',
                title: 'Una decisión de estrategia patrimonial, no solo de retorno inmediato',
                content: `La premisa central es que S'Narai es un activo productivo. La decisión no es cuánto vender, sino cuándo. El modelo recomendado combina liquidez temprana para los participantes que la necesitan con retención de largo plazo para quienes buscan flujo sostenido. El resultado: el inversionista siente que su dinero tiene salida, mientras el activo acumula valor de forma continua.

Frase de posicionamiento: "Participa en la creación de un activo inmobiliario productivo. Puedes obtener liquidez antes, mientras el ecosistema genera valor a largo plazo."`,
                stats: [
                    { label: 'Modelo Conservador (15% venta)', value: 'Patrimonio $216M · Flujo $8.9M/año' },
                    { label: 'Modelo Balanceado (30% venta)', value: 'Patrimonio $178M · Flujo $7.4M/año' },
                    { label: 'Modelo Estratégico (60% venta)', value: 'Patrimonio $102M · Flujo $4.2M/año' },
                    { label: 'Venta Total (100%)', value: 'Patrimonio $0 · Flujo $0/año' },
                ]
            }
        },
    ] : [];

    const investorJourneyBlocks = materialSlug === 'investor-journey-guide' ? [
        {
            type: 'info',
            data: {
                sectionLabel: '1. Posicionamiento Correcto',
                title: '¿Qué estamos vendiendo?',
                content: `**NO VENDES CRIPTO.**
Aunque la tecnología blockchain permite el registro y la trazabilidad, el cliente invierte en **Real Estate**. Es una participación sobre un activo tangible (ladrillos en Bucerías).

**NO VENDES TIEMPOS COMPARTIDOS.**
El cliente no está comprando "semanas" de uso. Está participando financieramente en los ingresos generados por la operación de un activo y beneficiándose de la apreciación de la propiedad.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '2. Manejo de Expectativas',
                title: 'Transparencia Radical',
                content: `**Sobre el riesgo:** "Toda inversión conlleva riesgos, pero los mitigamos con administración fiduciaria, operadores hoteleros experimentados y control de hitos."

**Sobre la tecnología:** "No necesitas saber de blockchain. Nosotros usamos la tecnología para darte seguridad, pero tú ves un panel financiero claro y en dólares."

**Sobre la legalidad:** "Participas a través de un Fideicomiso y contratos claros. Todo está documentado con evidencia digital e integridad documental."`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '3. El Cierre',
                title: 'Resolución de fricción',
                content: `Si el cliente dice:

❌ *"Suena muy bueno para ser verdad."*
✅ "Es un modelo financiero estructurado (Fideicomiso) usado por fondos grandes, pero ahora accesible para ti. Toda la corrida financiera está documentada y puedes revisar nuestro Due Diligence."

❌ *"¿Cómo sé que el dinero sí se usa en la obra?"*
✅ "El capital se administra por entidades profesionales y su liberación está condicionada al avance de obra. Puedes ver los reportes mensuales en tu portal."`,
                stats: []
            }
        }
    ] : [];



    const realtorSalesKitBlocks = materialSlug === 'realtor-sales-kit' ? [
        {
            type: 'info',
            data: {
                sectionLabel: '1. La Visión S\'Narai',
                title: 'El Componente Emocional',
                content: `Riviera Nayarit se encuentra en una etapa histórica de crecimiento. Durante años, destinos como Tulum, Playa del Carmen y Puerto Vallarta han demostrado cómo una zona puede transformar el valor de los activos inmobiliarios cuando aumenta la demanda turística y residencial.\n\nS'Narai nace con la visión de participar en esta evolución de Bucerías, creando un desarrollo diseñado para combinar patrimonio inmobiliario, hospitalidad y una nueva forma de acceso a oportunidades.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '2. La Nueva Forma de Invertir en Riviera Nayarit',
                title: 'El Ángulo Comercial',
                content: `Durante años, invertir en Riviera Nayarit significaba comprar una propiedad completa, asumir grandes tickets de entrada y encargarse personalmente de la administración.\n\nS'Narai cambia ese paradigma: permite participar en un desarrollo inmobiliario premium desde una fracción del proyecto, combinando apreciación patrimonial y participación en ingresos operativos.\n\nEl participante puede beneficiarse de dos motores principales:\n1. **Crecimiento patrimonial:** La propiedad puede incrementar su valor conforme avanza el desarrollo, la zona aumenta su demanda y el proyecto madura.\n2. **Ingresos operativos:** Una vez en operación, el proyecto puede generar ingresos derivados de la actividad de renta y hospitalidad.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '3. El Cliente Perfecto',
                title: 'Focalización Comercial',
                content: `No buscamos venderle a todos. Buscamos perfiles específicos:\n• Personas con capital disponible que buscan diversificación.\n• Extranjeros interesados en Riviera Nayarit pero que no quieren administrar una propiedad.\n• Dueños de negocios que quieren convertir liquidez en activos.\n• Personas que quieren entrar al mercado antes de que la zona alcance mayor madurez.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '4. El Pitch Rápido',
                title: 'Respuestas de alto impacto',
                content: `**Pitch de 10 segundos (Elevator):**\n"S'Narai es un desarrollo premium en Riviera Nayarit donde puedes participar financieramente sin comprar todo el departamento, combinando plusvalía y rentas hoteleras."\n\n**Pitch de 30 segundos:**\n"S'Narai es un desarrollo inmobiliario en Bucerías donde puedes participar desde una inversión accesible en un proyecto premium. Tu participación está respaldada por un activo real y puede beneficiarse tanto del crecimiento del valor del inmueble como de los ingresos generados por la operación."\n\n**Pitch de WhatsApp (Copiar y pegar):**\n"¡Hola! Viendo el crecimiento de Riviera Nayarit, quería compartirte un proyecto premium en Bucerías llamado S'Narai. Tienen un modelo de participación que no te obliga a comprar la propiedad completa, pero te da exposición a la plusvalía de la zona y a los ingresos por rentas hoteleras. ¿Tienes 5 minutos para que te cuente cómo funciona?"`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '5. Qué Decir y Qué NO Decir',
                title: 'Guía de Comunicación Institucional',
                content: `**NO DECIR:**\n❌ "Es dinero garantizado."\n❌ "Siempre vas a ganar X%."\n❌ "Es como tener un departamento sin comprarlo."\n\n**SÍ DECIR:**\n✅ "Participas en un activo inmobiliario."\n✅ "Buscamos generar valor mediante apreciación y operación."\n✅ "Existen diferentes mecanismos de participación y liquidez."`,
                stats: []
            }
        }
    ] : [];

    const faqBlocks = materialSlug === 'faq' ? [
        {
            type: 'info',
            data: {
                sectionLabel: 'Legal',
                title: '¿Estoy comprando un departamento completo?',
                content: `No. S'Narai permite participar económicamente dentro de un desarrollo inmobiliario sin necesidad de adquirir una unidad completa, mediante certificados digitales de participación asociados al proyecto.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Oportunidad',
                title: '¿Por qué invertir ahora y no esperar a que esté terminado?',
                content: `Entrar en etapas tempranas permite participar antes de que un proyecto alcance su madurez comercial, cuando normalmente existe mayor potencial de apreciación.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Riesgo',
                title: '¿Mi inversión está garantizada? ¿Puedo perder mi inversión?',
                content: `Como cualquier inversión inmobiliaria, existen riesgos asociados. S'Narai busca mitigarlos mediante una estructura transparente, documentación del proyecto, seguimiento continuo y participación sobre un activo real.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Valor',
                title: '¿Qué pasa si el proyecto aumenta mucho de valor?',
                content: `El crecimiento del valor del activo puede reflejarse en la valoración de las participaciones de acuerdo con la evolución del proyecto y las condiciones del mercado.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Liquidez',
                title: '¿Qué pasa si necesito recuperar mi inversión?',
                content: `Existen mecanismos diseñados para facilitar opciones de liquidez, incluyendo mercado secundario cuando esté disponible y solicitudes de salida anticipada sujetas a las condiciones del protocolo.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Operación',
                title: '¿Quién administra las rentas?',
                content: `Un operador hotelero profesional. El inversionista no tiene que preocuparse por buscar inquilinos, pagar servicios o reparar daños. El operador se encarga de maximizar la ocupación y mantener el estándar premium del edificio.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Tecnología',
                title: '¿Necesito saber de tecnología para invertir?',
                content: `No. La tecnología existe para simplificar la experiencia; el inversionista participa en un proyecto inmobiliario tradicional con herramientas digitales adicionales.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Residencia',
                title: '¿Necesito vivir en México?',
                content: `No. El modelo está diseñado para permitir participación desde diferentes ubicaciones mediante herramientas digitales.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Comunidad',
                title: '¿Puedo recomendar S\'Narai a alguien más?',
                content: `Sí. Contamos con un Partner Program que permite a nuestros inversionistas convertirse en embajadores del proyecto, obteniendo beneficios por expandir la comunidad de participantes.`,
                stats: []
            }
        }
    ] : [];

    const guiaInversionistaBlocks = materialSlug === 'guia-inversionista' ? [
        {
            type: 'info',
            data: {
                sectionLabel: '1. ¿Qué hace diferente a S\'Narai?',
                title: 'Certeza y Transparencia',
                content: `• No compras una promesa futura.\n• Participas en un activo inmobiliario identificado.\n• Tienes seguimiento del avance del proyecto.\n• Puedes visualizar tu participación y evolución desde un portal digital.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '2. La Estructura de tu Participación',
                title: 'Derechos Económicos',
                content: `Los participantes adquieren derechos económicos asociados al proyecto bajo la estructura legal definida por S'Narai y Pandoras. No te encargas de la operación diaria, recibes los beneficios netos derivados de la administración profesional del inmueble.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '3. Tu ciclo como participante',
                title: 'Fases de Acompañamiento',
                content: `**Fase 1: Adquisición**\nAdquieres participación y formalizas tu posición en el ecosistema.\n\n**Fase 2: Desarrollo**\nObservas la construcción y evolución patrimonial del activo físico en tiempo real.\n\n**Fase 3: Estabilización**\nEl proyecto entra en operación hotelera y comercial.\n\n**Fase 4: Consolidación**\nRecibes beneficios derivados de la operación y puedes monitorear la evolución patrimonial de tus derechos.`,
                stats: []
            }
        }
    ] : [];

    const investmentProcessBlocks = materialSlug === 'investment-process' ? [
        {
            type: 'info',
            data: {
                sectionLabel: 'Proceso',
                title: 'Los 9 Pasos hacia tu Participación',
                content: `1. **Descubrimiento:** Revisión de la tesis de valor de S'Narai Bucerías y proyecciones.\n2. **Sesión Estratégica:** Llamada con un Embajador para alinear tu objetivo patrimonial.\n3. **Selección de Participación:** Definir cantidad de Títulos a adquirir.\n4. **KYC / Verificación Institucional:** Carga de ID y comprobante para cumplir normativas de prevención.\n5. **Formalización Digital:** Formalización digital de documentos y evidencia de integridad mediante herramientas tecnológicas y mecanismos legales aplicables.\n6. **Fondeo / Aporte:** Transferencia segura mediante SPEI, tarjeta o activos digitales.\n7. **Emisión de Certificados:** Acreditación inmediata de tus Títulos en tu bóveda digital.\n8. **Activación de Bóveda:** Acceso a tu Portal S'Narai personal.\n9. **Acompañamiento Post-Inversión:** Después de adquirir una participación, el inversionista continúa conectado al proyecto mediante actualizaciones, avances, reportes y comunicación permanente.`,
                stats: []
            }
        }
    ] : [];

    const dueDiligenceBlocks = materialSlug === 'due-diligence' ? [
        {
            type: 'info',
            data: {
                sectionLabel: '1. Certeza de la Tierra',
                title: 'Legal y Adquisición',
                content: `Toda inversión comienza con la seguridad del inmueble subyacente. S'Narai proporciona a sus participantes:

• **Escrituras Públicas:** Título de propiedad de la tierra.
• **Libertad de Gravamen:** Certificado reciente del Registro Público garantizando que la tierra no tiene deudas ni embargos.
• **Uso de Suelo:** Licencias y factibilidades emitidas por las autoridades municipales de Bahía de Banderas.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '2. Estructura Fiduciaria',
                title: 'Control Patrimonial',
                content: `El proyecto no está a nombre de personas físicas, sino encapsulado en un vehículo institucional:

• **Estructura Fiduciaria:** Estructura legal en proceso de formalización para protección patrimonial y dictamen de reglas de operación.
• **Comité Técnico:** Órgano colegiado encargado de supervisar decisiones financieras y constructivas.
• **Reglas de Gobernanza:** Mecanismos documentados para prevenir desviaciones de fondos o conflictos de interés.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '3. Arquitectura y Viabilidad Técnica',
                title: 'Construcción y Desarrollo (Aztecas)',
                content: `No vendemos renders, construimos realidades respaldadas técnica y operativamente:

• **Trámites Regulatorios:** Trámites municipales en fase inicial y procesos de factibilidad en curso para asegurar la viabilidad de construcción.
• **Proyecto Ejecutivo:** Planos estructurales, ingenierías, mecánica de suelos y estudios topográficos.
• **Presupuesto Base:** Catálogo de conceptos (Hard Costs & Soft Costs) verificado.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '4. El Operador Hotelero',
                title: 'Experiencia y Track Record',
                content: `Para garantizar el Yield Proyectado, la operación no se improvisa:

• **Contrato de Operación Comercial:** Acuerdos con administradores de propiedades de lujo que aseguran mantenimiento premium.
• **Estrategia de Pricing:** Estudios de ocupación promedio (ADR) y competitividad en Bucerías.
• **Mantenimiento (CAPEX):** Fondos de reserva integrados en el modelo financiero para que el activo no se deprecie.`,
                stats: []
            }
        }
    ] : [];



    const projectRoadmapBlocks = materialSlug === 'project-roadmap' ? [
        {
            type: 'info',
            data: {
                sectionLabel: 'Hitos',
                title: 'Momentos de creación de valor',
                content: `• **Entrada temprana:** Oportunidad inicial con mayor potencial de crecimiento patrimonial.\n• **Avance de obra:** Reducción de incertidumbre constructiva, incrementando el valor percibido del activo.\n• **Operación:** Generación de flujo operativo por rentas.\n• **Madurez del activo:** Consolidación patrimonial y maximización de la demanda en el mercado secundario.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Etapa 1',
                title: 'Estructuración y Fondeo Temprano',
                content: `Lanzamiento de Fase Fundador, consolidación de la estructura fiduciaria/legal y trámites pre-operativos.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Etapa 2',
                title: 'Obra Civil y Desarrollo',
                content: `Arranque de construcción física, cimentación, levantamiento estructural e instalaciones principales.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Etapa 3',
                title: 'Acabados y Equipamiento',
                content: `Obra blanca, interiorismo premium, equipamiento de amenidades (Rooftop & Wellness) y preparación para entrega.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Etapa 4',
                title: 'Operación y Flujo de Caja',
                content: `Apertura hotelera. Estabilización de la ocupación. Inicio de distribución de ingresos conforme la operación alcance estabilidad.`,
                stats: []
            }
        }
    ] : [];

    const portalGuideBlocks = materialSlug === 'portal-guide' ? [
        {
            type: 'info',
            data: {
                sectionLabel: '1. Centro de Transparencia',
                title: 'Información Institucional',
                content: `Tu bóveda personal e institucional. Aquí podrás consultar siempre:\n• Documentos legales.\n• Reportes del proyecto.\n• Avances de obra.\n• Comunicados oficiales.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '2. Dashboard Financiero',
                title: 'Tu Posición',
                content: `Visualización clara de tu participación: cantidad de títulos adquiridos, valor estimado de tu portafolio y el historial de rendimientos operativos distribuidos.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '3. Gobernanza',
                title: 'Tu Voz Importa',
                content: `Sistema de votación transparente para participar en decisiones sobre la operación del proyecto o encuestas de servicio.`,
                stats: []
            }
        }
    ] : [];



    const gestoresGuideBlocks = materialSlug === 'gestores-guide' ? [
        {
            type: 'info',
            data: {
                sectionLabel: '1. Tu Rol como Embajador',
                title: 'No vendes m², vendes acceso',
                content: `Como Gestor Patrimonial, tu objetivo principal es conectar capital con oportunidades estructuradas.\n\nEn lugar de intentar explicar cada detalle técnico de un Smart Contract o de la estructura legal, enfócate en el resultado: S'Narai ofrece una forma de participar en el mercado inmobiliario de Riviera Nayarit sin dolores de cabeza, con montos accesibles y alta transparencia.\n\nTu labor es **abrir la puerta**, generar confianza y utilizar los materiales de este portal para responder objeciones específicas.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '2. Prospección',
                title: '¿A quién buscar?',
                content: `Busca inversionistas que:\n\n• **Tengan liquidez en el banco** perdiendo valor contra la inflación.\n• **Hayan invertido en inmuebles tradicionales** y estén cansados de los mantenimientos, inquilinos y falta de liquidez.\n• **Inversionistas internacionales (EE. UU. / Canadá)** que buscan exposición en México pero temen a la burocracia.\n• **Inversionistas tecnológicos** que quieren diversificar sus ganancias hacia activos del mundo real (Real World Assets).`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '3. El Proceso de Venta Ideal',
                title: 'De prospecto a Inversionista',
                content: `1. **Primer Contacto:** Envía un mensaje corto o haz una llamada rápida (Pitch 30s). No intentes cerrar la venta, solo genera curiosidad.\n2. **Reunión 1 a 1:** Utiliza el *Investment Deck* para presentar los números. Escucha más de lo que hablas. ¿Qué le preocupa al cliente?\n3. **Follow-up:** Envía la *Guía del Inversionista* o el documento de *Due Diligence* según su perfil (conservador vs. analítico).\n4. **Cierre:** Acompáñalo en su registro dentro del portal y su fondeo.`,
                stats: []
            }
        }
    ] : [];

    const developerKitBlocks = materialSlug === 'developer-kit' ? [
        {
            type: 'info',
            data: {
                sectionLabel: '1. El Problema',
                title: 'El Desarrollo Inmobiliario Tradicional',
                content: `Actualmente, los desarrolladores inmobiliarios enfrentan tres grandes fricciones:\n\n1. **Fondeo Lento:** Depender de créditos puente costosos o de preventas "Friends & Family" donde los tickets son muy altos.\n2. **Administración Opaca:** Los inversionistas institucionales o retail exigen cada vez más transparencia sobre el uso de recursos.\n3. **Falta de Liquidez:** Un departamento no se puede fraccionar fácilmente si alguien necesita liquidez urgente.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '2. La Solución Pandoras',
                title: 'Infraestructura Inmobiliaria de Próxima Generación',
                content: `S'Narai es el primer caso de éxito utilizando la infraestructura tecnológica de Pandoras. ¿Qué ofrece este modelo para desarrolladores?\n\n• **Fraccionalización y Acceso:** Estructurar el capital de un proyecto en títulos digitales accesibles, bajando el ticket de entrada y acelerando el fondeo.\n• **Portal del Inversionista White-label:** Cada proyecto tiene un dashboard donde los participantes ven avances, estado financiero y documentación en tiempo real.\n• **Trazabilidad de Recursos:** Los hitos de construcción detonan las liberaciones de capital, generando máxima confianza.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '3. Beneficios B2B',
                title: 'Por qué integrar este modelo',
                content: `• **Diferenciador de mercado:** Ofrece a tus compradores liquidez secundaria mediante un mercado interno (bulletin board).\n• **Marketing Viral:** Modelos de gobernanza y programas de recompensas que convierten a tus clientes en embajadores.\n• **Seguridad Institucional:** Arquitectura respaldada por fideicomisos, KYC/AML y tecnología inmutable.`,
                stats: []
            }
        }
    ] : [];

    const foundingRoundGuideBlocks = materialSlug === 'founding-round-guide' ? [
        {
            type: 'info',
            data: {
                sectionLabel: t('Introducción', 'Introduction'),
                title: t('¿Por qué existe la Founding Round?', 'Why does the Founding Round exist?'),
                content: t(`S'Narai se encuentra actualmente en una etapa previa a la preventa inmobiliaria tradicional.\n\nEsta etapa recibe el nombre de **Founding Round** y tiene un objetivo muy específico: permitir que un grupo limitado de inversionistas participe en la estructuración inicial del proyecto antes del inicio de la comercialización pública.\n\nLas condiciones disponibles durante esta etapa no estarán disponibles una vez que el proyecto avance hacia la preventa.`, `S'Narai is currently in a stage prior to traditional real estate pre-sales.\n\nThis stage is called the **Founding Round** and has a very specific objective: to allow a limited group of investors to participate in the initial structuring of the project before public commercialization begins.\n\nThe conditions available during this stage will not be available once the project moves to pre-sales.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('El Momento Actual', 'The Current Stage'),
                title: t('¿Qué significa participar hoy?', 'What does it mean to participate today?'),
                content: t(`Durante la Founding Round el proyecto aún se encuentra consolidando diversos procesos:\n\n* estructuración financiera\n* integración legal\n* consolidación comercial\n* fortalecimiento institucional\n* preparación para la preventa\n\nPrecisamente por asumir esa etapa temprana, los participantes reciben condiciones preferenciales de adquisición.`, `During the Founding Round, the project is still consolidating various processes:\n\n* financial structuring\n* legal integration\n* commercial consolidation\n* institutional strengthening\n* pre-sale preparation\n\nPrecisely by assuming this early stage, participants receive preferential acquisition conditions.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Estructura', 'Structure'),
                title: t('Las tres Founding Rounds', 'The three Founding Rounds'),
                content: t(`La Founding Round se divide en tres emisiones consecutivas.\n\n**Founding Round I**\nPrecio inicial de participación.\n\n**Founding Round II**\nUna vez concluida la primera emisión, el precio aumenta.\n\n**Founding Round III**\nÚltima emisión antes de la preventa pública.\n\nCada ronda posee una cantidad limitada de certificados. Una vez agotada una ronda, Pandoras no volverá a emitir certificados bajo esas condiciones.`, `The Founding Round is divided into three consecutive issues.\n\n**Founding Round I**\nInitial participation price.\n\n**Founding Round II**\nOnce the first issue concludes, the price increases.\n\n**Founding Round III**\nFinal issue before public pre-sale.\n\nEach round has a limited amount of certificates. Once a round is sold out, Pandoras will not issue certificates under those conditions again.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Valor', 'Value'),
                title: t('Dos fuentes de creación de valor', 'Two sources of value creation'),
                content: t(`Es importante entender que existen dos mecanismos independientes.\n\n### Valor de emisión\nCada ronda posee un precio distinto de participación. Este incremento responde exclusivamente al avance del proceso de estructuración.\n\n### Valor del activo\nPosteriormente, el valor del proyecto dependerá de factores propios del desarrollo inmobiliario:\n* avance de obra\n* consolidación operativa\n* demanda\n* ocupación\n* ingresos generados\n\nAmbos procesos son diferentes y no deben confundirse.`, `It is important to understand that there are two independent mechanisms.\n\n### Issuance value\nEach round has a different participation price. This increase responds exclusively to the progress of the structuring process.\n\n### Asset value\nSubsequently, the value of the project will depend on factors inherent to real estate development:\n* construction progress\n* operational consolidation\n* demand\n* occupancy\n* generated income\n\nBoth processes are different and should not be confused.`),
                stats: []
            }
        }
    ] : [];

    const howToBuyBlocks = materialSlug === 'how-to-buy' ? [
        {
            type: 'info',
            data: {
                sectionLabel: t('Paso 1 y 2', 'Step 1 & 2'),
                title: t('Descubrimiento y Análisis', 'Discovery and Analysis'),
                content: t(`**Paso 1: Solicita una sesión privada**\nDurante la reunión resolveremos dudas sobre el proyecto, estructura, documentación y modelo financiero.\n\n**Paso 2: Revisa el Data Room**\nTendrás acceso a documentación legal, arquitectura, modelo financiero y materiales comerciales.`, `**Step 1: Request a private session**\nDuring the meeting we will resolve questions about the project, structure, documentation, and financial model.\n\n**Step 2: Review the Data Room**\nYou will have access to legal documentation, architecture, financial model, and commercial materials.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Paso 3 y 4', 'Step 3 & 4'),
                title: t('Selección y Formalización', 'Selection and Formalization'),
                content: t(`**Paso 3: Selecciona la Founding Round disponible**\nCada ronda posee precio, disponibilidad y cantidad limitada.\n\n**Paso 4: Formaliza tu participación**\nDependiendo del método elegido podrás participar mediante:\n* transferencia bancaria (SPEI)\n* transferencia internacional\n* activos digitales (opcional)\n\n*No es necesario utilizar tecnología blockchain para participar.*`, `**Step 3: Select the available Founding Round**\nEach round has a price, availability, and limited quantity.\n\n**Step 4: Formalize your participation**\nDepending on the chosen method, you can participate via:\n* bank transfer (SPEI)\n* international transfer\n* digital assets (optional)\n\n*It is not necessary to use blockchain technology to participate.*`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Paso 5 y 6', 'Step 5 & 6'),
                title: t('Recepción y Seguimiento', 'Reception and Tracking'),
                content: t(`**Paso 5: Recepción de documentación**\nUna vez validada la operación recibirás tu confirmación, documentación correspondiente y acceso al portal del inversionista.\n\n**Paso 6: Seguimiento**\nDesde el Portal podrás consultar la evolución del proyecto, documentación, comunicados, eventos y avances.`, `**Step 5: Document reception**\nOnce the transaction is validated, you will receive your confirmation, corresponding documentation, and access to the investor portal.\n\n**Step 6: Tracking**\nFrom the Portal, you can check the project's evolution, documentation, announcements, events, and progress.`),
                stats: []
            }
        }
    ] : [];

    const tokenomicsBlocks = materialSlug === 'tokenomics' ? [
        {
            type: 'info',
            data: {
                sectionLabel: t('Introducción', 'Introduction'),
                title: t('Mecanismos de Oferta', 'Supply Mechanisms'),
                content: t(`La Founding Round utiliza un modelo de emisión escalonada diseñado para recompensar la participación temprana.\n\nNo se trata de una especulación de precios sino de un mecanismo transparente de estructuración.`, `The Founding Round uses a staggered issuance model designed to reward early participation.\n\nThis is not about price speculation but a transparent structuring mechanism.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Estructura', 'Structure'),
                title: t('Founding Rounds y Oferta Limitada', 'Founding Rounds and Limited Supply'),
                content: t(`**Round I:** Precio inicial.\n**Round II:** Incremento programado.\n**Round III:** Última emisión antes de la preventa.\n\nCada ronda posee una cantidad determinada de certificados. Al agotarse, no vuelve a emitirse y el proyecto continúa con la siguiente ronda.`, `**Round I:** Initial price.\n**Round II:** Scheduled increase.\n**Round III:** Final issue before pre-sale.\n\nEach round has a specific amount of certificates. Once sold out, it is not re-issued and the project continues with the next round.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Políticas', 'Policies'),
                title: t('Transparencia Total', 'Total Transparency'),
                content: t(`**Política de emisión:**\nPandoras únicamente emite los certificados correspondientes a la ronda vigente. Las rondas anteriores permanecen exclusivamente en manos de quienes participaron oportunamente.\n\n**Transparencia:**\nTodas las reglas de emisión permanecen definidas desde el inicio del proyecto. No existen modificaciones arbitrarias posteriores.`, `**Issuance policy:**\nPandoras only issues certificates corresponding to the current round. Previous rounds remain exclusively in the hands of those who participated appropriately.\n\n**Transparency:**\nAll issuance rules remain defined from the project's inception. There are no subsequent arbitrary modifications.`),
                stats: []
            }
        }
    ] : [];

    const developerTrackRecordBlocks = materialSlug === 'developer-track-record' ? [
        {
            type: 'info',
            data: {
                sectionLabel: 'Equipo',
                title: 'S\\'Narai: Especialistas Multidisciplinarios',
                content: `S'Narai reúne especialistas provenientes de distintas disciplinas para desarrollar un modelo inmobiliario respaldado por procesos institucionales y tecnología.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Áreas de Expertise', 'Areas of Expertise'),
                title: t('Arquitectura, Desarrollo y Operación', 'Architecture, Development, and Operation'),
                content: t(`**Arquitectura:**\nEquipo especializado en diseño bioclimático y hospitalidad. Objetivos: eficiencia operativa, integración con el entorno y experiencia del huésped.\n\n**Desarrollo:**\nEquipo responsable de planeación, ejecución y coordinación.\n\n**Operación:**\nEspecialistas en renta vacacional, administración, experiencia del cliente y optimización de ingresos.`, `**Architecture:**\nTeam specialized in bioclimatic design and hospitality. Objectives: operational efficiency, integration with the environment, and guest experience.\n\n**Development:**\nTeam responsible for planning, execution, and coordination.\n\n**Operation:**\nSpecialists in vacation rentals, administration, customer experience, and revenue optimization.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Infraestructura', 'Infrastructure'),
                title: t('Pandoras Growth OS', 'Pandoras Growth OS'),
                content: t(`Proporciona la infraestructura tecnológica utilizada para seguimiento documental, administración, comunicación, automatización comercial y trazabilidad operativa.\n\n**Filosofía:**\nConstruimos activos reales apoyados por procesos digitales. La tecnología no reemplaza el activo; fortalece su administración.`, `Provides the technological infrastructure used for document tracking, administration, communication, commercial automation, and operational traceability.\n\n**Philosophy:**\nWe build real assets supported by digital processes. Technology does not replace the asset; it strengthens its administration.`),
                stats: []
            }
        }
    ] : [];

    const architectureDossierBlocks = materialSlug === 'architecture-dossier' ? [
        {
            type: 'info',
            data: {
                sectionLabel: t('Concepto', 'Concept'),
                title: t('Naturaleza y Hospitalidad', 'Nature and Hospitality'),
                content: t(`S'Narai fue concebido como un desarrollo boutique donde arquitectura, naturaleza y hospitalidad conviven bajo una misma filosofía.`, `S'Narai was conceived as a boutique development where architecture, nature, and hospitality coexist under the same philosophy.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Principios', 'Principles'),
                title: t('Diseño Bioclimático', 'Bioclimatic Design'),
                content: t(`El proyecto incorpora estrategias pasivas para mejorar el confort y reducir el consumo energético. Entre ellas:\n* orientación solar\n* ventilación natural\n* control térmico\n* iluminación natural\n* vegetación integrada\n* selección eficiente de materiales\n\nEstas decisiones buscan disminuir costos operativos y mejorar la experiencia del huésped.`, `The project incorporates passive strategies to improve comfort and reduce energy consumption. Among them:\n* solar orientation\n* natural ventilation\n* thermal control\n* natural lighting\n* integrated vegetation\n* efficient material selection\n\nThese decisions aim to lower operating costs and enhance the guest experience.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Espacios', 'Spaces'),
                title: t('Amenidades Boutique', 'Boutique Amenities'),
                content: t(`El proyecto cuenta con:\n* Rooftop\n* Alberca\n* Áreas comunes\n* Jardines\n* Amenidades boutique\n\n*Nota: Los renders representan la visión arquitectónica actual y podrán evolucionar durante el proceso ejecutivo sin alterar la esencia conceptual del proyecto.*`, `The project features:\n* Rooftop\n* Pool\n* Common areas\n* Gardens\n* Boutique amenities\n\n*Note: The renders represent the current architectural vision and may evolve during the executive process without altering the conceptual essence of the project.*`),
                stats: []
            }
        }
    ] : [];

    const financialModelBlocks = materialSlug === 'financial-model' ? [
        {
            type: 'info',
            data: {
                sectionLabel: t('Objetivo', 'Objective'),
                title: t('Lógica Financiera', 'Financial Logic'),
                content: t(`Presentar la lógica financiera utilizada para estructurar S'Narai.`, `To present the financial logic used to structure S'Narai.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Estructura', 'Structure'),
                title: t('Estructura de Capital', 'Capital Structure'),
                content: t(`Los recursos obtenidos serán destinados principalmente a:\n* adquisición del terreno\n* desarrollo ejecutivo\n* permisos\n* construcción\n* equipamiento\n* capital de trabajo`, `The funds obtained will be primarily allocated to:\n* land acquisition\n* executive development\n* permits\n* construction\n* equipment\n* working capital`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Modelo', 'Model'),
                title: t('Operación y Escenarios', 'Operation and Scenarios'),
                content: t(`El proyecto contempla ingresos provenientes de operación de rentas de corta estancia. Las proyecciones consideran distintos escenarios de ocupación:\n\n* **Conservador:** Mercado con menor demanda.\n* **Esperado:** Escenario base utilizado para la planeación.\n* **Optimista:** Mayor ritmo de ocupación y tarifas.`, `The project contemplates income from short-term rental operations. The projections consider different occupancy scenarios:\n\n* **Conservative:** Market with lower demand.\n* **Expected:** Base scenario used for planning.\n* **Optimistic:** Higher occupancy rate and tariffs.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Consideraciones', 'Considerations'),
                title: t('Riesgos', 'Risks'),
                content: t(`El desempeño futuro dependerá de múltiples factores: mercado, ejecución, economía, turismo y demanda.\n\n*Este documento no constituye una garantía de rendimiento.*`, `Future performance will depend on multiple factors: market, execution, economy, tourism, and demand.\n\n*This document does not constitute a guarantee of returns.*`),
                stats: []
            }
        }
    ] : [];

    const partnerProgramBlocks = materialSlug === 'partner-program' ? [
        {
            type: 'info',
            data: {
                sectionLabel: t('Introducción', 'Introduction'),
                title: t('Growth Partner Program', 'Growth Partner Program'),
                content: t(`El Growth Partner Program fue diseñado para profesionales que desean representar proyectos patrimoniales bajo un modelo transparente y escalable.`, `The Growth Partner Program was designed for professionals who wish to represent wealth projects under a transparent and scalable model.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Beneficios', 'Benefits'),
                title: t('Soporte Institucional', 'Institutional Support'),
                content: t(`Los Growth Partners reciben acceso a:\n* materiales comerciales\n* Investor Briefings\n* documentación\n* seguimiento de prospectos\n* soporte institucional`, `Growth Partners receive access to:\n* commercial materials\n* Investor Briefings\n* documentation\n* prospect tracking\n* institutional support`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Portal', 'Portal'),
                title: t('Portal del Gestor', 'Manager Portal'),
                content: t(`Desde el Dashboard es posible administrar prospectos, consultar actividad, descargar materiales, monitorear oportunidades y dar seguimiento al pipeline comercial.\n\n**Comisiones:**\nLas condiciones comerciales se encuentran establecidas dentro del programa correspondiente. Cada operación es registrada y validada conforme al proceso institucional de Pandoras.`, `From the Dashboard it is possible to manage prospects, check activity, download materials, monitor opportunities, and track the commercial pipeline.\n\n**Commissions:**\nCommercial conditions are established within the corresponding program. Each operation is registered and validated according to Pandoras' institutional process.`),
                stats: []
            }
        }
    ] : [];

    const marketResearchBlocks = materialSlug === 'market-research' ? [
        {
            type: 'info',
            data: {
                sectionLabel: t('Región', 'Region'),
                title: t('Riviera Nayarit', 'Riviera Nayarit'),
                content: t(`La Riviera Nayarit se ha consolidado como uno de los mercados turísticos e inmobiliarios con mayor crecimiento del Pacífico mexicano.`, `Riviera Nayarit has consolidated itself as one of the fastest-growing tourist and real estate markets in the Mexican Pacific.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Ubicación', 'Location'),
                title: t('Bucerías: Atractivo y Conectividad', 'Bucerías: Appeal and Connectivity'),
                content: t(`Su ubicación estratégica permite conectar rápidamente con Nuevo Vallarta, Punta Mita y Puerto Vallarta. Esto ha incrementado su atractivo para turismo nacional e internacional.`, `Its strategic location allows for quick connections to Nuevo Vallarta, Punta Mita, and Puerto Vallarta. This has increased its appeal for national and international tourism.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Análisis', 'Analysis'),
                title: t('Tendencias y Perspectiva', 'Trends and Perspective'),
                content: t(`Factores que impulsan la demanda:\n* crecimiento turístico\n* infraestructura y conectividad aérea\n* jubilados internacionales y nómadas digitales\n* oferta hotelera limitada\n\nEl desarrollo de infraestructura regional continúa fortaleciendo la competitividad del corredor Bahía de Banderas.`, `Factors driving demand:\n* tourism growth\n* infrastructure and air connectivity\n* international retirees and digital nomads\n* limited hotel supply\n\nThe development of regional infrastructure continues to strengthen the competitiveness of the Bahía de Banderas corridor.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: 'Posicionamiento',
                title: 'La propuesta S\\'Narai',
                content: `S'Narai busca participar en esta tendencia mediante un producto boutique orientado a calidad, eficiencia operativa y ubicación estratégica.`,
                stats: []
            }
        }
    ] : [];

    const executiveInvestmentBriefBlocks = materialSlug === 'executive-investment-brief' ? [
        {
            type: 'info',
            data: {
                sectionLabel: t('Executive Summary', 'Executive Summary'),
                title: t('Un nuevo estándar de inversión', 'A new investment standard'),
                content: t(`S'Narai es un desarrollo inmobiliario boutique ubicado en la Zona Dorada de Bucerías, diseñado para combinar arquitectura contemporánea, operación de hospitalidad y una estructura institucional apoyada por Pandoras Growth OS.\n\nActualmente el proyecto se encuentra en su **Founding Round**, una etapa previa a la preventa pública donde un grupo limitado de inversionistas puede participar bajo condiciones preferenciales de emisión.`, `S'Narai is a boutique real estate development located in the Golden Zone of Bucerías, designed to combine contemporary architecture, hospitality operations, and an institutional structure supported by Pandoras Growth OS.\n\nCurrently, the project is in its **Founding Round**, a stage prior to public pre-sales where a limited group of investors can participate under preferential issuance conditions.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Infraestructura', 'Infrastructure'),
                title: t('Soporte y Trazabilidad', 'Support and Traceability'),
                content: t(`Pandoras proporciona la infraestructura operativa, tecnológica y comercial que permite administrar el proyecto con altos estándares de trazabilidad, documentación y seguimiento.`, `Pandoras provides the operational, technological, and commercial infrastructure that allows managing the project with high standards of traceability, documentation, and tracking.`),
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: t('Oportunidad', 'Opportunity'),
                title: t('Participación Temprana', 'Early Participation'),
                content: t(`La oportunidad consiste en participar desde una etapa temprana del ciclo de desarrollo, antes del inicio de la comercialización tradicional, dentro de un mercado con fundamentos sólidos de crecimiento turístico e inmobiliario.\n\nEste documento resume la tesis de inversión, la estructura institucional, el modelo operativo y la propuesta de valor de S'Narai para inversionistas interesados en proyectos patrimoniales de largo plazo.`, `The opportunity consists of participating from an early stage of the development cycle, before the start of traditional commercialization, within a market with solid fundamentals of tourism and real estate growth.\n\nThis document summarizes the investment thesis, the institutional structure, the operational model, and the value proposition of S'Narai for investors interested in long-term wealth projects.`),
                stats: []
            }
        }
    ] : [];

    const customBlocks = financialScenarioBlocks.length > 0 ? financialScenarioBlocks 
        : foundingRoundGuideBlocks.length > 0 ? foundingRoundGuideBlocks
        : howToBuyBlocks.length > 0 ? howToBuyBlocks
        : tokenomicsBlocks.length > 0 ? tokenomicsBlocks
        : developerTrackRecordBlocks.length > 0 ? developerTrackRecordBlocks
        : architectureDossierBlocks.length > 0 ? architectureDossierBlocks
        : financialModelBlocks.length > 0 ? financialModelBlocks
        : partnerProgramBlocks.length > 0 ? partnerProgramBlocks
        : marketResearchBlocks.length > 0 ? marketResearchBlocks
        : executiveInvestmentBriefBlocks.length > 0 ? executiveInvestmentBriefBlocks 
        : investorJourneyBlocks.length > 0 ? investorJourneyBlocks
        : realtorSalesKitBlocks.length > 0 ? realtorSalesKitBlocks
        : faqBlocks.length > 0 ? faqBlocks
        : guiaInversionistaBlocks.length > 0 ? guiaInversionistaBlocks
        : investmentProcessBlocks.length > 0 ? investmentProcessBlocks
        : dueDiligenceBlocks.length > 0 ? dueDiligenceBlocks
        : projectRoadmapBlocks.length > 0 ? projectRoadmapBlocks
        : portalGuideBlocks.length > 0 ? portalGuideBlocks
        : gestoresGuideBlocks.length > 0 ? gestoresGuideBlocks
        : developerKitBlocks.length > 0 ? developerKitBlocks
        : [];

    const deck = {
        ...mockSNaraiDeck,
        title,
        blocks: firstBlock ? [
            {
                ...firstBlock,
                data: {
                    ...(firstBlock.data || {}),
                    // Override the hero text with content specific to this document
                    title: contentOverride?.hero ?? title,
                    subtitle: contentOverride?.heroSubtitle ?? firstBlock.data?.subtitle,
                    documentName: title,
                    cssBackground: contentOverride?.cssBackground,
                    backgroundImage: undefined,
                }
            },
            // Insert a unique intro info block right after the hero
            ...(contentOverride?.intro ? [{
                type: 'info',
                data: {
                    sectionLabel: material?.objective ?? 'Acerca de este documento',
                    title: material?.title ?? title,
                    content: contentOverride.intro,
                    stats: []
                }
            }] : []),
            
            // For custom blocks (financial scenarios or investor guide): inject rich blocks; otherwise show standard contentPreview
            ...(customBlocks.length > 0
                ? customBlocks
                : (material?.contentPreview?.map(preview => ({
                    type: 'info',
                    data: {
                        sectionLabel: 'Contenido Específico',
                        title: preview.section,
                        content: preview.text,
                        stats: []
                    }
                })) || [])
            ),

            // Add financial blocks only for the main investment documents
            ...(['investment-deck', 'project-overview'].includes(materialSlug) ? mockSNaraiDeck.blocks.slice(2) : [])
        ] : []
    };


    return (
        <main className="w-full min-h-screen bg-black">
            <MaterialViewer deck={deck} projectSlug={slug} />
        </main>
    );
}

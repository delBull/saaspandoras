import React from 'react';
import { MaterialViewer } from './MaterialViewer';
import { mockSNaraiDeck } from '@/lib/marketing/mock-snarai-deck';
import { snaraiMaterials } from '@/lib/marketing/snarai-materials';

// Unique content overrides per materialSlug
// Each key matches the `id` in snaraiMaterials
const MATERIAL_CONTENT: Record<string, { hero?: string; heroSubtitle?: string; intro?: string }> = {
    'project-overview': {
        hero: "La evolución de la Riviera.",
        heroSubtitle: "Todo lo que necesitas saber sobre S'Narai en 5 minutos.",
        intro: "El documento inicial que todo inversionista, asesor o desarrollador debe leer para entender la tesis de valor de S'Narai Bucerías. Arquitectura premium, Fideicomiso Maestro, 80,400 títulos y yields operativos del 10-12% anual.",
    },
    'investment-deck': {
        hero: "Vive la siguiente generación de inversión.",
        heroSubtitle: "El deck comercial completo. Diseñado para convencer.",
        intro: "La presentación comercial de S'Narai detalla métricas, fases de inversión (Fundador $50, Estratégico $75, Público $100) y el modelo de flujo de caja que convierte un desarrollo inmobiliario en una máquina de rendimientos.",
    },
    'realtor-sales-kit': {
        hero: "Vende con confianza. Cierra con datos.",
        heroSubtitle: "Tu kit completo para presentar S'Narai a cualquier cliente.",
        intro: "Creado específicamente para Gestores Patrimoniales. Incluye argumentos comerciales, comparativas con inversiones tradicionales, proceso de venta paso a paso y respuestas a las objeciones más comunes del mercado.",
    },
    'guia-inversionista': {
        hero: "Tu inversión. Completamente clara.",
        heroSubtitle: "De principio a fin, acompañamos cada decisión.",
        intro: "Entiende cómo tu capital adquiere posiciones en S'Narai desde la Fase Fundador ($50 USD). Esta guía resuelve dudas sobre el Fideicomiso, el mercado de cesión de derechos, los rendimientos y el acceso a tu Portal de inversionista.",
    },
    'developer-kit': {
        hero: "Un nuevo estándar para construir.",
        heroSubtitle: "El modelo S'Narai aplicado al desarrollo inmobiliario moderno.",
        intro: "Documento exclusivo para entidades constructoras e inversionistas institucionales. Explica cómo S'Narai integra smart contracts, seguimiento documental NOM-151 y la comercialización de los 80,400 títulos en un solo ecosistema.",
    },
    'due-diligence': {
        hero: "Transparencia total. Desde el día uno.",
        heroSubtitle: "El paquete completo para que analices antes de invertir.",
        intro: "El Due Diligence de S'Narai incluye escrituras del terreno en Zona Dorada de Bucerías, contratos de fideicomiso, licencias de construcción, manifiestos ambientales y perfiles verificables de los desarrolladores (Aztecas).",
    },
    'project-roadmap': {
        hero: "Del terreno a la entrega. Cada hito verificable.",
        heroSubtitle: "Un cronograma claro para cada fase del proyecto.",
        intro: "Sigue la ejecución de S'Narai desde la adquisición del terreno hasta la operación hotelera del Rooftop Pool & Wellness Center. Cada fase (preventa, obra negra, obra blanca, entrega) con objetivos y avances en tiempo real.",
    },
    'faq': {
        hero: "Tus preguntas. Nuestras respuestas.",
        heroSubtitle: "Todo lo que necesitas saber antes de invertir.",
        intro: "¿Soy dueño de escrituras? ¿Puedo vender mi posición antes? ¿Qué pasa si la obra se retrasa? ¿Cómo recibo mis rendimientos? Este documento responde las 30+ preguntas más frecuentes con claridad y sin letra chica.",
    },
    'investment-process': {
        hero: "Tu proceso de inversión en 8 pasos.",
        heroSubtitle: "Simple, seguro y completamente transparente.",
        intro: "Desde conocer el proyecto hasta recibir acceso a tu Portal de inversionista. Cada paso está documentado: selección de títulos, firma con NOM-151, aporte de capital y activación de tu cuenta en el ecosistema S'Narai.",
    },
    'portal-guide': {
        hero: "Bienvenido a tu Portal S'Narai.",
        heroSubtitle: "Todo el proyecto, siempre disponible en un solo lugar.",
        intro: "El Portal S'Narai es tu centro de control como inversionista. Consulta documentos, avances de obra, distribución de rendimientos hoteleros, historial de gobernanza DAO y el estado en tiempo real de tu participación.",
    },
    'gestores-guide': {
        hero: "Vende más. Explica menos.",
        heroSubtitle: "La guía comercial completa para nuestros Embajadores.",
        intro: "Incluye el Elevator Pitch (30s), el Pitch de 3 minutos y el Pitch profundo (10 min). Cómo presentar S'Narai frente a inmuebles tradicionales, qué prometer, qué NO prometer, y scripts listos para WhatsApp y LinkedIn.",
    },
    'escenarios-financieros': {
        hero: "Tu patrimonio. Seis formas de verlo crecer.",
        heroSubtitle: "Análisis financiero detallado bajo supuestos hipotéticos. No es una promesa de rendimiento.",
        intro: `S'Narai no es un proyecto de venta inmobiliaria tradicional. Es un activo patrimonial tokenizado con liquidez secundaria: participas en las utilidades y capital de un edificio premium, con la posibilidad de ceder tu posición en cualquier momento a través del mercado interno.

Este documento modela seis escenarios financieros hipotéticos con los mismos supuestos base para que puedas entender el potencial de tu inversión bajo diferentes estrategias patrimoniales.`,
    },
    'investor-journey-guide': {
        hero: "Cierra ventas con claridad institucional.",
        heroSubtitle: "El documento maestro para la fuerza de ventas.",
        intro: "Este documento está diseñado para alinear el discurso comercial. No estás vendiendo 'crypto', ni 'tiempos compartidos'. Estás vendiendo una participación económica estructurada en un fideicomiso inmobiliario, con la mayor transparencia y seguridad del mercado.",
    },
};


export default async function MaterialPage({ params }: { params: Promise<{ slug: string, materialSlug: string }> }) {
    const { slug, materialSlug } = await params;
    // Find the matching material definition
    const material = snaraiMaterials.find(m => m.id === materialSlug);
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
                sectionLabel: '1. La Promesa de Valor',
                title: '¿Qué estamos vendiendo exactamente?',
                content: `El problema actual: Los inversionistas quieren exposición al mercado de Real Estate de lujo en la Riviera Maya, pero no quieren lidiar con notarios, mantenimiento, o falta de liquidez, y no tienen $500,000 USD para comprar un departamento completo.

La Solución S'Narai:
"Tu participación representa una parte económica estructurada del proyecto S'Narai, permitiéndote acceder a los beneficios y utilidades del desarrollo desde tickets accesibles, con seguridad institucional."

No estás vendiendo "crypto". No estás vendiendo "tiempos compartidos". Estás vendiendo una participación económica en un fideicomiso inmobiliario, digitalizada (tokenizada) para hacerla líquida y transparente.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '2. El Ciclo de Vida',
                title: 'Lo que el cliente debe esperar',
                content: `Es crucial establecer las expectativas correctas desde el día 1:

1. Fase de Fondeo (Adquisición): El cliente adquiere sus Certificados de Participación. Su dinero entra a un Fideicomiso.
2. Fase de Generación de Valor (Desarrollo): El activo se construye/gestiona. El valor del certificado tiende a apreciarse conforme el riesgo disminuye.
3. Distribución de Rendimientos (Operación): El cliente recibe distribuciones de renta trimestrales directamente en su billetera digital vinculada al Portal.`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '3. Mecanismos de Liquidez',
                title: 'Manejo de Expectativas de Salida',
                content: `Advertencia Crítica: Nunca prometer "retiros inmediatos". Es Real Estate.
                
Respuesta oficial: "S'Narai es una inversión patrimonial a largo plazo. Tienes dos mecanismos de salida:
1. Mercado Secundario (AGORA): Vender tus certificados a otros inversionistas globales al precio de mercado.
2. Treasury Buybacks: En casos excepcionales, solicitar salida anticipada a la tesorería (sujeto a liquidez disponible, con penalidad)."`,
                stats: []
            }
        },
        {
            type: 'info',
            data: {
                sectionLabel: '4. FAQ y Objeciones',
                title: 'Manejo de Objeciones Frecuentes',
                content: `• "Qué pasa si S'Narai desaparece?" -> "Tu inversión está blindada legalmente por un Fideicomiso Maestro y contratos NOM-151. El edificio físico es la garantía."
• "¿Tengo que saber de criptomonedas?" -> "No. Pagas con tarjeta o SPEI. El Portal se encarga de crear tu bóveda digital automáticamente."
• "¿Por qué veo 'Poder de Voto'?" -> "S'Narai opera como un consorcio (DAO). Como poseedor, tienes voto directo sobre decisiones clave del inmueble."`,
                stats: []
            }
        }
    ] : [];

    const customBlocks = financialScenarioBlocks.length > 0 ? financialScenarioBlocks : investorJourneyBlocks;

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

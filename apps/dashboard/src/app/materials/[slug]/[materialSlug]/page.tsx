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
};

export default function MaterialPage({ params }: { params: { slug: string, materialSlug: string } }) {
    // Find the matching material definition
    const material = snaraiMaterials.find(m => m.id === params.materialSlug);
    const contentOverride = MATERIAL_CONTENT[params.materialSlug];

    const title = material?.title ?? params.materialSlug.replace(/-/g, ' ').toUpperCase();
    const firstBlock = mockSNaraiDeck.blocks?.[0];

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
            // Remaining blocks from the base deck (phases, investment example, financials)
            ...mockSNaraiDeck.blocks.slice(1)
        ] : []
    };

    return (
        <main className="w-full min-h-screen bg-black">
            <MaterialViewer deck={deck} projectSlug={params.slug} />
        </main>
    );
}

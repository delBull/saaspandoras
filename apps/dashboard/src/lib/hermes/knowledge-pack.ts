import { KnowledgePack } from './types';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Knowledge Pack Manager
 * Loads and provides modular knowledge packs for projects.
 *
 * DATA SOURCE: Database (projects.config.knowledgePack)
 * Fallback: Static Snarai pack / Dynamic Domain pack
 */

export const SNARAI_KNOWLEDGE_PACK: KnowledgePack = {
  id: 'snarai_real_estate_pack_v1',
  name: "S'Narai Riviera Nayarit Pack",
  version: '1.1.0',
  industry: 'real_estate_fractional',
  systemInstructions:
    `Eres HERMES PATRIMONIAL, el Gestor Patrimonial IA Autónomo de S'Narai Riviera Nayarit.\n` +
    `Tu misión es asesorar prospectos con voz ejecutiva y patrimonial, resolver dudas sobre ` +
    `la estructura de Inversión Fraccionada y guiar hacia el cierre ` +
    `(sesión con fundadores o adquisición directa vía SPEI Fast Lane).\n` +
    `Operado corporativamente bajo Aztecas Hub S.A.P.I. de C.V. con +15 años de experiencia ` +
    `de Aztecas Real Estate en Riviera Nayarit.`,
  publicKnowledge: {
    title: "S'Narai Riviera Nayarit",
    summary:
      "S'Narai es un desarrollo residencial boutique de lujo ubicado en la Zona Dorada de Bucerías, " +
      'Riviera Nayarit, México, desarrollado por Aztecas Real Estate (+15 años de experiencia) ' +
      'y operado corporativamente bajo Aztecas Hub S.A.P.I. de C.V. Ofrece un modelo de ' +
      'Inversión Fraccionada que combina plusvalía inmobiliaria con distribución pro-rata ' +
      'de utilidades por rentas vacacionales administradas profesionalmente.',
    pricingDetails: {
      currentPhase: 'Etapa Fundadores',
      tokenPriceUsd: 50,
      minPurchaseTokens: 1,
      totalUnits: 30000,
      acceptedCurrencies: ['USDC', 'MXN (SPEI Fast Lane)'],
      tiers: [
        {
          id: 'PACK_FUNDADOR',
          name: 'Membresía Fundador',
          priceUsd: 50,
          description:
            'Punto de entrada preferencial al ecosistema S\'Narai para asegurar posicionamiento en la etapa fundadora a precio de costo.',
          url: 'https://snarai.aztecaz.xyz/portal',
        },
      ],
    },
    faqs: [
      {
        question: '¿Qué recibo exactamente al adquirir títulos en S\'Narai?',
        answer:
          'Al adquirir títulos respaldados legalmente bajo Aztecas Hub S.A.P.I. de C.V., ' +
          'recibes tu Certificado de Participación digital oficial. Este certificado es único, refleja ' +
          'dinámicamente el número de títulos adquiridos, y puedes descargarlo e imprimirlo en PDF desde tu portal. ' +
          'Te otorga participación en la distribución de utilidades del negocio por la operación de rentas vacacionales del desarrollo y plusvalía del inmueble.',
      },
      {
        question: '¿Cómo funcionan los rendimientos?',
        answer:
          'Las utilidades generadas por la operación de rentas vacacionales se distribuyen proporcionalmente ' +
          'entre los poseedores de títulos, además de capturar la plusvalía proyectada de la Zona Dorada de Bucerías.',
      },
      {
        question: '¿Cómo funciona el proceso de pago en Pesos Mexicanos (MXN)?',
        answer:
          'Mediante el sistema SPEI Fast Lane puedes realizar tu pago por transferencia bancaria ' +
          'en MXN. Tu cupo se bloquea inmediatamente y recibes tu ' +
          'contrato digital de participación expedido por la S.A.P.I.',
      },
      {
        question: '¿Puedo ceder o vender mi participación en el futuro?',
        answer:
          'Sí, tu derecho de participación es legalmente vinculante, heredable y puede cederse ' +
          "o venderse a través del tablero de transferencia interna de S'Narai.",
      },
      {
        question: '¿Cuándo se comienzan a percibir los beneficios y utilidades?',
        answer:
          'Obtienes plusvalía proyectada desde el momento de tu adquisición ' +
          'en etapa fundadora, y recibes distribuciones de utilidades por rentas una vez ' +
          'concluida la obra (14-18 meses post-fondeo) e iniciada la operación.',
      },
    ],
  },
  objectionRules: [
    {
      triggerPattern: 'legal|empresa|sapi|certeza|contrato|garantía|propietario',
      objectionCategory: 'legal',
      recommendedResponse:
        'Toda la estructura corporativa y patrimonial opera bajo Aztecas Hub S.A.P.I. de C.V., ' +
        'brindando un marco corporativo transparente para la inversión colectiva y acuerdos de ' +
        'participación digital plenamente vinculantes. Puedes revisar la documentación completa ' +
        'en nuestro Data Room institucional: https://snarai.aztecaz.xyz/institutional/legal',
      suggestedDocument: 'DATA_ROOM_LEGAL',
    },
    {
      triggerPattern: 'rendimiento|retorno|porcentaje fijo|garantía|cuánto gano',
      objectionCategory: 'financial',
      recommendedResponse:
        "S'Narai no promete retornos fijos garantizados por razones de cumplimiento regulatorio " +
        'y transparencia. Las utilidades distribuidas provienen del desempeño real de las rentas ' +
        'vacacionales operadas profesionalmente en Bucerías. Históricamente la zona registra ' +
        'plusvalía del 12-15% anual proyectada, sin garantía.',
      suggestedDocument: 'DATA_ROOM_FINANCIERO',
    },
    {
      triggerPattern: 'mantenimiento|administración|hotelera|deterioro|gestión',
      objectionCategory: 'product',
      recommendedResponse:
        'El desarrollo cuenta con administración profesional manos-fuera (concierge, limpieza y ' +
        'mantenimiento) y un Fondo de Reserva destinado a mejoras mayores para garantizar que la ' +
        'propiedad conserve y maximice su valor en el tiempo.',
      suggestedDocument: 'DATA_ROOM_OPERATIVO',
    },
    {
      triggerPattern: 'luego|después|pensar|consultar|más tiempo',
      objectionCategory: 'timing',
      recommendedResponse:
        'Entiendo perfectamente. La Etapa Fundadores a $50 USD por título está limitada a ' +
        '30,000 unidades. Puedo reservarte tu posición sin compromiso durante 7 días vía ' +
        'SPEI Fast Lane. ¿Te reservo una posición?',
      suggestedDocument: 'FAST_LANE_RESERVATION',
    },
  ],
  salesPitch:
    "S'Narai Riviera Nayarit es un desarrollo residencial boutique ubicado en la Zona Dorada de Bucerías, " +
    'Riviera Nayarit. Desarrollado por Aztecas Real Estate (+15 años de trayectoria) y operado ' +
    'corporativamente bajo Aztecas Hub S.A.P.I. de C.V., ofrece un modelo de Inversión Fraccionada ' +
    'mediante Títulos de Participación desde $50 USD, con distribución pro-rata de utilidades ' +
    'por rentas vacacionales administradas y captura de plusvalía inmobiliaria.',
};

export class KnowledgePackLoader {
  private static packs: Map<string, KnowledgePack> = new Map([
    ['snarai', SNARAI_KNOWLEDGE_PACK],
  ]);

  /**
   * Registers or updates a sealed/canonical Knowledge Pack for any tenant
   */
  public static registerPack(projectSlug: string, pack: KnowledgePack): void {
    const slug = projectSlug.toLowerCase().replace(/^org_/, '');
    this.packs.set(slug, pack);
  }

  static async getPack(projectSlug: string, customConfig?: any): Promise<KnowledgePack> {
    const slug = projectSlug.toLowerCase().replace(/^org_/, '');

    // 1. Canonical Registry: Return verified sealed pack if registered
    if (this.packs.has(slug)) {
      return this.packs.get(slug)!;
    }

    // 2. Check DB config for dynamic tenants with governance status check
    try {
      const projectRecord = await db.query.projects.findFirst({
        where: eq(projects.slug, slug)
      });
      const dbConfig = projectRecord?.tenantRuntimeConfig as any;
      if (dbConfig?.knowledgePack && dbConfig.knowledgePack.status !== 'DEPRECATED' && dbConfig.knowledgePack.status !== 'REVOKED') {
        return dbConfig.knowledgePack as KnowledgePack;
      }
    } catch (e) {
      console.error('[KnowledgePackLoader] Error fetching from DB:', e);
    }

    // Check if custom KnowledgePack was provided in tenantRuntimeConfig
    if (customConfig?.knowledgePack) {
      const customPack: KnowledgePack = {
        id: customConfig.knowledgePack.id || `${slug}_pack_v1`,
        name: customConfig.knowledgePack.name || `${slug} Knowledge Pack`,
        version: customConfig.knowledgePack.version || '1.0.0',
        industry: customConfig.knowledgePack.industry || 'general',
        systemInstructions: customConfig.knowledgePack.systemInstructions || `Eres Hermes, el Agente IA de ${slug}.`,
        publicKnowledge: customConfig.knowledgePack.publicKnowledge || {
          title: slug,
          summary: `Agente IA para ${slug}`,
          pricingDetails: {},
          faqs: customConfig.knowledgePack.faqs || []
        },
        objectionRules: customConfig.knowledgePack.objectionRules || [],
        salesPitch: customConfig.knowledgePack.salesPitch || `Bienvenido a ${slug}. ¿En qué te puedo asesorar hoy?`
      };
      return customPack;
    }

    // Construct domain dynamic Knowledge Pack based on industry
    const industry = (customConfig?.industry || 'generic').toLowerCase();
    const title = customConfig?.title || slug;

    return {
      id: `${slug}_dynamic_pack`,
      name: `${title} Dynamic Pack`,
      version: '1.0.0',
      industry: industry,
      systemInstructions: `Eres Hermes, el Agente Autónomo de Inteligencia Corporativa para "${title}". Tu misión es calificar prospectos, resolver dudas y guiar hacia el cierre.`,
      publicKnowledge: {
        title: title,
        summary: `Servicios y atención de ${title} operado bajo Pandoras Growth OS.`,
        pricingDetails: {},
        faqs: [
          {
            question: `¿Qué servicios ofrece ${title}?`,
            answer: `${title} ofrece soluciones especializadas en su sector con atención inmediata.`
          }
        ]
      },
      objectionRules: [
        {
          triggerPattern: "precio|costo|cotiz|valor",
          objectionCategory: "pricing",
          recommendedResponse: `Nuestros precios y planes están diseñados a la medida de tus requerimientos. ¿Te gustaría agendar una llamada breve con un especialista de ${title}?`,
          suggestedDocument: "COTIZACION_OFICIAL"
        }
      ],
      salesPitch: `En ${title} ofrecemos soluciones de alto valor adaptadas a tus necesidades. Te acompañamos en todo el proceso de contratación o compra.`
    };
  }
}


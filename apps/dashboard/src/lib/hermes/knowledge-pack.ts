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
    `la estructura de Certificados de Participación y guiar hacia el cierre ` +
    `(sesión con fundadores o adquisición directa vía SPEI Fast Lane).\n` +
    `Operado corporativamente bajo Aztecas Hub S.A.P.I. de C.V. con +15 años de experiencia ` +
    `de Aztecas Real Estate en Riviera Nayarit.`,
  publicKnowledge: {
    title: "S'Narai Riviera Nayarit",
    summary:
      "S'Narai es un desarrollo residencial boutique de lujo ubicado en la Zona Dorada de Bucerías, " +
      'Riviera Nayarit, México, desarrollado por Aztecas Real Estate (+15 años de experiencia) ' +
      'y operado corporativamente bajo Aztecas Hub S.A.P.I. de C.V. Ofrece un modelo de ' +
      'Propiedad Fraccionada y Certificados de Participación que combinan estancias de lujo ' +
      'con distribución de utilidades por rentas hoteleras y plusvalía inmobiliaria.',
    pricingDetails: {
      currentPhase: 'Etapa Fundadores',
      tokenPriceUsd: 50,
      minPurchaseTokens: 1,
      totalUnits: 30000,
      acceptedCurrencies: ['USDC', 'MXN (SPEI Fast Lane)'],
      tiers: [
        {
          id: 'PACK_EXPLORADOR',
          name: 'Nivel Explorador',
          priceUsd: 50,
          description:
            'Punto de entrada flexible al ecosistema S\'Narai para asegurar posicionamiento en la etapa fundadora.',
          url: 'https://snarai.aztecaz.xyz/portal?tier=explorer',
        },
        {
          id: 'PACK_RESIDENTE',
          name: 'Nivel Residente',
          priceUsd: 500,
          description:
            'Nivel recomendado que otorga estancias prioritarias anuales y bono adicional sobre la utilidad distribuida.',
          url: 'https://snarai.aztecaz.xyz/portal?tier=residente',
        },
        {
          id: 'PACK_EMBAJADOR',
          name: 'Nivel Embajador',
          priceUsd: 2500,
          description:
            'Participación de capital estratégico con voz directiva y máxima prioridad en reservaciones de alta temporada.',
          url: 'https://snarai.aztecaz.xyz/portal?tier=ambassador',
        },
      ],
    },
    faqs: [
      {
        question: '¿Qué recibo exactamente al adquirir títulos en S\'Narai?',
        answer:
          'Al adquirir títulos digitales respaldados legalmente bajo Aztecas Hub S.A.P.I. de C.V., ' +
          'recibes tu Certificado de Participación digital oficial. Este certificado es único, refleja ' +
          'dinámicamente el número de títulos adquiridos, y puedes descargarlo e imprimirlo en PDF desde tu portal. ' +
          'Te otorga dos beneficios principales: 1) Derecho a estancias de uso personal (según el nivel de títulos) ' +
          'y 2) Participación en la distribución de utilidades del negocio total por la operación del desarrollo.',
      },
      {
        question: '¿Cómo funcionan los derechos de estancias y rendimientos?',
        answer:
          'Dependiendo de la cantidad de títulos adquiridos, existen paquetes que otorgan derechos ' +
          'a estancias prioritarias anuales en Bucerías, además de un porcentaje de rendimiento adicional ' +
          'sobre las utilidades globales distribuidas por la operación del proyecto.',
      },
      {
        question: '¿Cómo funciona el proceso de pago e inscripción en Pesos Mexicanos (MXN)?',
        answer:
          'Mediante el sistema SPEI Fast Lane puedes realizar tu pago por transferencia bancaria ' +
          'en MXN. Tu cupo se bloquea inmediatamente (Soft-Lock por 7 días) y recibes tu ' +
          'contrato digital de participación expedido por la S.A.P.I.',
      },
      {
        question: '¿Puedo ceder o vender mi participación en el futuro?',
        answer:
          'Sí, tu derecho de participación es legalmente vinculante, heredable y puede cederse ' +
          "o venderse en cualquier momento a través del tablero de transferencia interna de S'Narai.",
      },
      {
        question: '¿Cuándo se comienzan a percibir los beneficios y utilidades?',
        answer:
          'Obtienes plusvalía proyectada desde el momento de tu adquisición ' +
          'en etapa fundadora, y recibes distribuciones de utilidades por rentas una vez ' +
          'concluida la obra e iniciada la operación.',
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
        'hoteleras operadas profesionalmente en Bucerías. Históricamente la zona registra ' +
        'plusvalía del 12-15% anual proyectado, sin garantía.',
      suggestedDocument: 'DATA_ROOM_FINANCIERO',
    },
    {
      triggerPattern: 'mantenimiento|administración|hotelera|deterioro|gestión',
      objectionCategory: 'product',
      recommendedResponse:
        'El desarrollo cuenta con administración hotelera profesional (concierge 24/7, limpieza y ' +
        'mantenimiento) y un Fondo de Reserva destinado a mejoras mayores para garantizar que la ' +
        'propiedad no pierda valor con el tiempo.',
      suggestedDocument: 'DATA_ROOM_OPERATIVO',
    },
    {
      triggerPattern: 'luego|después|pensar|consultar|más tiempo',
      objectionCategory: 'timing',
      recommendedResponse:
        'Entiendo perfectamente. La Etapa Fundadores a $50 USD por Certificado está limitada a ' +
        '30,000 unidades. Puedo reservarte tu posición sin compromiso durante 7 días vía ' +
        'SPEI Fast Lane. ¿Te reservo una posición?',
      suggestedDocument: 'FAST_LANE_RESERVATION',
    },
  ],
  salesPitch:
    "S'Narai es un desarrollo residencial boutique de lujo en la Zona Dorada de Bucerías, " +
    'Riviera Nayarit — a pasos del mar. A través de un modelo de Propiedad Fraccionada y ' +
    'Certificados de Participación emitidos por Aztecas Hub S.A.P.I. de C.V., puedes ' +
    'asegurar tu posición desde $50 USD, disfrutar estancias anuales de lujo y participar ' +
    'en las utilidades de las rentas hoteleras. Transparencia corporativa completa, ' +
    'liquidez garantizada y plusvalía proyectada en una de las zonas de mayor crecimiento de México.',
};

export class KnowledgePackLoader {
  private static packs: Map<string, KnowledgePack> = new Map([
    ['snarai', SNARAI_KNOWLEDGE_PACK]
  ]);

  static async getPack(projectSlug: string, customConfig?: any): Promise<KnowledgePack> {
    const slug = projectSlug.toLowerCase();
    
    // Check DB first
    try {
      const projectRecord = await db.query.projects.findFirst({
        where: eq(projects.slug, slug)
      });
      const dbConfig = projectRecord?.tenantRuntimeConfig as any;
      if (dbConfig?.knowledgePack) {
        return dbConfig.knowledgePack as KnowledgePack;
      }
    } catch (e) {
      console.error('[KnowledgePackLoader] Error fetching from DB:', e);
    }

    // Always return S'Narai pack for snarai if not in DB
    if (slug === 'snarai') {
      return SNARAI_KNOWLEDGE_PACK;
    }

    if (this.packs.has(slug)) {
      return this.packs.get(slug)!;
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


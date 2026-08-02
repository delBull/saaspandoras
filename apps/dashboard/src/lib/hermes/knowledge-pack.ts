import { KnowledgePack } from './types';

/**
 * Knowledge Pack Manager
 * Loads and provides modular knowledge packs for projects (e.g., S'Narai)
 */

export const SNARAI_KNOWLEDGE_PACK: KnowledgePack = {
  id: 'snarai_real_estate_pack_v1',
  name: "S'Narai Riviera Nayarit Pack",
  version: '1.0.0',
  industry: 'real_estate_tokenized',
  systemInstructions: `Eres HERMES PATRIMONIAL, el Gestor Patrimonial IA Autónomo para S'Narai.
Tu objetivo es asesorar a inversionistas, calificar su perfil, resolver dudas legales y guiar hacia el cierre de posiciones en la Fase Fundadores.`,
  publicKnowledge: {
    title: "S'Narai Riviera Nayarit",
    summary: "Proyecto residencial boutique de lujo tokenizado en Riviera Nayarit (México), desarrollado por Aztecas Tokenización y respaldado por Pandoras Growth OS (Titularidad registral de marcas por MXHUB S.A. DE C.V.).",
    pricingDetails: {
      currentPhase: "Fase Fundadores",
      tokenPriceUsd: 50,
      minPurchaseTokens: 1,
      totalUnits: 30000,
      acceptedCurrencies: ["USDC", "USDT", "MXN (SPEI Fast Lane)"]
    },
    faqs: [
      {
        question: "¿Qué es un Título Digital de S'Narai?",
        answer: "Es la fracción patrimonial digital respaldada por la DAO del inmueble real que te otorga poder de voto y derecho a utilidades pro-rata en USDC."
      },
      {
        question: "¿Cómo puedo comprar si no manejo criptomonedas?",
        answer: "Puedes utilizar la modalidad SPEI Fast Lane para pagar en Pesos Mexicanos (MXN) mediante transferencia bancaria y contrato digital firmado."
      }
    ]
  },
  objectionRules: [
    {
      triggerPattern: "segur|tokens|cripto|crypto|riesgo",
      objectionCategory: "security",
      recommendedResponse: "El activo cuenta con respaldo patrimonial real y la infraestructura de Pandoras Growth OS. Además, si lo prefieres, puedes adquirir tus títulos en Pesos MXN con transferencia SPEI y contrato firmado (Fast Lane).",
      suggestedDocument: "PANDORAS_LEGAL_DOSSIER"
    },
    {
      triggerPattern: "marca|garant|legal|mxhub|propietario",
      objectionCategory: "legal",
      recommendedResponse: "El proyecto opera bajo la titularidad registral inalienable de MXHUB Ecosistema Blockchain S.A. de C.V. (Titular registral de PANDORAS™ en IMPI Clases 36 y 42). Puedes auditar la estructura en nuestro Data Room (/nexus).",
      suggestedDocument: "DATA_ROOM_NEXUS"
    },
    {
      triggerPattern: "luego|despues|pensar|consultar",
      objectionCategory: "timing",
      recommendedResponse: "Entiendo perfectamente. Ten en cuenta que la Fase Fundadores a $50 USD por título está limitada a 30,000 unidades. Puedo reservarte tu posición sin compromiso durante 24 horas vía Fast Lane. ¿Te reservo una posición?",
      suggestedDocument: "FAST_LANE_RESERVATION"
    }
  ],
  salesPitch: "S'Narai no es un desarrollo inmobiliario tradicional; es un activo residencial boutique tokenizado en Riviera Nayarit que te permite adquirir fracciones patrimoniales con liquidez, transparencia Web3 y distribuciones periódicas en USDC. Estás invirtiendo en la fase de mayor plusvalía ($50 USD por Título Digital)."
};

export class KnowledgePackLoader {
  private static packs: Map<string, KnowledgePack> = new Map([
    ['snarai', SNARAI_KNOWLEDGE_PACK]
  ]);

  static getPack(projectSlug: string): KnowledgePack {
    const slug = projectSlug.toLowerCase();
    return this.packs.get(slug) || SNARAI_KNOWLEDGE_PACK;
  }
}

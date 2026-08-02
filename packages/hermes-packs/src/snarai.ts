import { DomainPack } from './types';

export const SNARAI_DOMAIN_PACK: DomainPack = {
  manifest: {
    id: "snarai",
    name: "S'Narai Riviera Nayarit Pack",
    version: "1.0.0",
    industry: "real_estate_tokenized",
    locale: ["es-MX", "en-US"],
    requires: ["checkout", "documents", "crm"]
  },
  knowledge: {
    title: "S'Narai Riviera Nayarit",
    summary: "Proyecto residencial boutique de lujo tokenizado en Riviera Nayarit (México), desarrollado por Aztecas Tokenización y respaldado por Pandoras Growth OS.",
    faqs: [
      {
        question: "¿Qué es un Título Digital de S'Narai?",
        answer: "Es la fracción patrimonial digital respaldada por la DAO del inmueble real que otorga poder de voto y derecho a utilidades pro-rata en USDC."
      },
      {
        question: "¿Cómo puedo comprar si no manejo criptomonedas?",
        answer: "Puedes utilizar la modalidad SPEI Fast Lane para pagar en Pesos Mexicanos (MXN) mediante transferencia bancaria y contrato digital firmado."
      }
    ]
  },
  resources: [
    { id: "DOSSIER_LEGAL", name: "Dossier Legal Institucional", type: "link", url: "https://pandoras.finance/nexus" },
    { id: "FAST_LANE", name: "Reserva SPEI Fast Lane", type: "link", url: "https://snarai.pandoras.finance/portal?action=fastlane" }
  ],
  policies: [
    { id: "NO_GUARANTEED_RETURNS", description: "Nunca prometer retornos de inversión fijos ni garantizados", ruleType: "DENY", pattern: "garantiz|rendimiento fijo|retorno seguro" }
  ],
  objections: [
    {
      triggerPattern: "segur|tokens|cripto|crypto|riesgo",
      category: "security",
      response: "El activo cuenta con respaldo patrimonial real y la infraestructura de Pandoras Growth OS. Además, si lo prefieres, puedes adquirir tus títulos en Pesos MXN con transferencia SPEI y contrato firmado (Fast Lane).",
      suggestedResourceId: "DOSSIER_LEGAL"
    },
    {
      triggerPattern: "marca|garant|legal|mxhub|propietario",
      category: "legal",
      response: "El proyecto opera bajo la titularidad registral inalienable de MXHUB Ecosistema Blockchain S.A. de C.V. (Titular registral de PANDORAS™ en IMPI Clases 36 y 42). Puedes auditar la estructura en nuestro Data Room (/nexus).",
      suggestedResourceId: "DOSSIER_LEGAL"
    }
  ],
  salesPitch: "S'Narai es un activo residencial boutique tokenizado en Riviera Nayarit que te permite adquirir fracciones patrimoniales con liquidez, transparencia Web3 y distribuciones periódicas en USDC. Estás invirtiendo en la Fase Fundadores ($50 USD por Título Digital).",
  pricing: {
    currentPhase: "Fase Fundadores",
    tokenPriceUsd: 50,
    minPurchaseTokens: 1,
    totalUnits: 30000
  }
};

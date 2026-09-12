/**
 * Hermes Real Estate Pack — Doctrine & Safe Harbor Engine
 * src/lib/hermes/packs/real-estate-doctrine.ts
 *
 * Implements approved doctrine matching and Safe Harbor disclaimers for real estate.
 * CRITICAL DIRECTIVE: The pack NEVER establishes universal legal truth.
 * All legal statements are framed strictly as:
 * "According to the approved documentation of this development in the Data Room..."
 */

export type RealEstatePropertyType =
  | 'LOT'
  | 'CONDOMINIUM'
  | 'VILLA'
  | 'FRACTIONAL'
  | 'COMMERCIAL_PREMISES';

export type RealEstateCommercialStage =
  | 'FAMILY_AND_FRIENDS'
  | 'PRESALE_EARLY_BIRD'
  | 'PRESALE_STANDARD'
  | 'CONSTRUCTION'
  | 'IMMEDIATE_DELIVERY';

export type RealEstateLegalStructureType =
  | 'FIDUCIARY_TRUST'           // Fideicomiso de garantía / administración
  | 'CONDOMINIUM_REGIME'         // Régimen en condominio
  | 'DIRECT_TITLE_DEED'          // Escrituración directa notarial
  | 'SPV_CORPORATE_SHARES'       // Sociedad mercantil / vehículo de propósito especial
  | 'FRACTIONAL_CO_OWNERSHIP';   // Copropiedad fraccional certificada

export type RealEstateObjectionCategory =
  | 'LEGAL_CERTAINTY'
  | 'CAPITAL_APPRECIATION'
  | 'DELIVERY_TIMELINE'
  | 'EXIT_LIQUIDITY'
  | 'MAINTENANCE_HOA';

export interface ClientApprovedRealEstateDoc {
  title: string;
  category: 'LEGAL' | 'PERMITS' | 'BLUEPRINTS' | 'FINANCIAL' | 'BROCHURE';
  documentUrl: string;
  notaryOrAuthorityReference?: string;
  isPublicInDataRoom: boolean;
}

export interface ClientProjectKnowledge {
  developmentName: string;
  location: string;
  legalStructure: RealEstateLegalStructureType;
  legalStructureDescription: string;
  developerCompany: string;
  propertyTypesOffered: RealEstatePropertyType[];
  commercialStage: RealEstateCommercialStage;
  estimatedDeliveryDate?: string;
  estimatedAppreciationPercentage?: string;
  rentalPoolEnabled: boolean;
  maintenanceFeeEstimated?: string;
  approvedDocuments: ClientApprovedRealEstateDoc[];
  customDoctrines?: Record<RealEstateObjectionCategory, string>;
}

export interface ResolvedDoctrinalResponse {
  category: RealEstateObjectionCategory;
  responseStrategy: string;
  approvedSourceDocument?: string;
  safeHarborDisclaimerIncluded: boolean;
}

export class RealEstateDoctrineEngine {
  /**
   * Safe Harbor disclaimer prefix mandated by compliance rules.
   */
  static readonly SAFE_HARBOR_PREFIX =
    "Con base en la documentación oficial y expedientes aprobados para este desarrollo en el Data Room:";

  static readonly SAFE_HARBOR_FINANCIAL_DISCLAIMER =
    "⚠️ *Aviso de Transparencia:* Las estimaciones de plusvalía y flujos de renta son proyecciones basadas en el comportamiento del mercado y no constituyen rendimientos financieros garantizados.";

  /**
   * Resolves objection response strictly grounded on the client's approved knowledge.
   */
  static resolveObjection(
    category: RealEstateObjectionCategory,
    knowledge: ClientProjectKnowledge
  ): ResolvedDoctrinalResponse {
    let responseStrategy = '';
    let approvedSourceDocument: string | undefined;
    let safeHarborDisclaimerIncluded = false;

    // Check if client provided custom approved doctrine for this objection
    if (knowledge.customDoctrines && knowledge.customDoctrines[category]) {
      return {
        category,
        responseStrategy: `${this.SAFE_HARBOR_PREFIX} ${knowledge.customDoctrines[category]}`,
        safeHarborDisclaimerIncluded: category === 'CAPITAL_APPRECIATION'
      };
    }

    switch (category) {
      case 'LEGAL_CERTAINTY': {
        const legalDoc = knowledge.approvedDocuments.find((d) => d.category === 'LEGAL' || d.category === 'PERMITS');
        approvedSourceDocument = legalDoc?.title;
        responseStrategy = `${this.SAFE_HARBOR_PREFIX} El proyecto ${knowledge.developmentName} opera bajo un esquema de ${this.getLegalStructureLabel(knowledge.legalStructure)}. ${knowledge.legalStructureDescription} Toda la documentación probatoria está disponible para su consulta en el Data Room del proyecto.`;
        break;
      }

      case 'CAPITAL_APPRECIATION': {
        responseStrategy = `${this.SAFE_HARBOR_PREFIX} La zona de ${knowledge.location} presenta un crecimiento proyectado${knowledge.estimatedAppreciationPercentage ? ` del ${knowledge.estimatedAppreciationPercentage}` : ''} impulsado por infraestructura y demanda turística. ${this.SAFE_HARBOR_FINANCIAL_DISCLAIMER}`;
        safeHarborDisclaimerIncluded = true;
        break;
      }

      case 'DELIVERY_TIMELINE': {
        responseStrategy = `${this.SAFE_HARBOR_PREFIX} La etapa actual es de ${this.getCommercialStageLabel(knowledge.commercialStage)}${knowledge.estimatedDeliveryDate ? ` con entrega estimada programada para ${knowledge.estimatedDeliveryDate}` : ''}. Los avances de obra se publican periódicamente en el Centro de Transparencia.`;
        break;
      }

      case 'EXIT_LIQUIDITY': {
        responseStrategy = `${this.SAFE_HARBOR_PREFIX} Los derechos de cesión, transferencia o reventa en mercado secundario se rigen bajo los términos y ventanas de salida estipulados en el reglamento interno y contrato oficial del Data Room.`;
        break;
      }

      case 'MAINTENANCE_HOA': {
        responseStrategy = `${this.SAFE_HARBOR_PREFIX} ${knowledge.rentalPoolEnabled ? 'El desarrollo cuenta con opción de administración hotelera / pool de rentas que cubre mantenimiento con flujos de ocupación.' : 'Las cuotas de mantenimiento se determinan por asamblea de propietarios para conservación de áreas comunes.'}`;
        break;
      }
    }

    return {
      category,
      responseStrategy,
      approvedSourceDocument,
      safeHarborDisclaimerIncluded
    };
  }

  static getLegalStructureLabel(type: RealEstateLegalStructureType): string {
    switch (type) {
      case 'FIDUCIARY_TRUST': return 'Fideicomiso Fiduciario de Garantía y Administración';
      case 'CONDOMINIUM_REGIME': return 'Régimen de Propiedad en Condominio';
      case 'DIRECT_TITLE_DEED': return 'Escrituración Notarial Directa';
      case 'SPV_CORPORATE_SHARES': return 'Sociedad de Propósito Especial (SPV)';
      case 'FRACTIONAL_CO_OWNERSHIP': return 'Copropiedad Fraccional Certificada';
    }
  }

  static getCommercialStageLabel(stage: RealEstateCommercialStage): string {
    switch (stage) {
      case 'FAMILY_AND_FRIENDS': return 'Preventa Exclusiva Friends & Family';
      case 'PRESALE_EARLY_BIRD': return 'Preventa Inicial Fase 1';
      case 'PRESALE_STANDARD': return 'Preventa Estándar';
      case 'CONSTRUCTION': return 'Obra en Construcción Activa';
      case 'IMMEDIATE_DELIVERY': return 'Entrega Inmediata / Escriturable';
    }
  }

  /**
   * Resolves recommended closing angle tailored for Real Estate sales reps / brokers.
   */
  static resolveClosingAngle(objections: string[], defaultAngle?: string): string {
    const hasLegal = objections.some((o) => o.toLowerCase().includes('legal') || o.toLowerCase().includes('certeza'));
    if (hasLegal) {
      return 'Priorizar la certeza jurídica de la estructura legal y la documentación notarial del Data Room.';
    }
    const hasYield = objections.some((o) => o.toLowerCase().includes('renta') || o.toLowerCase().includes('rendimiento') || o.toLowerCase().includes('retorno'));
    if (hasYield) {
      return 'Presentar corridas del modelo financiero o pool de rentas con el aviso de transparencia Safe Harbor.';
    }
    return defaultAngle || 'Enfoque en plusvalía patrimonial y facilidades de financiamiento.';
  }
}


/**
 * Hermes Real Estate — Experience Templates
 * src/lib/real-estate/experience-templates.ts
 *
 * Defines the provisionable white-label experience templates for real estate.
 * Zero compilation required — driven entirely by configuration and metadata.
 */

export type RealEstateVertical = 'REAL_ESTATE';

export type RealEstateExperienceTemplateKey = 'LUXURY' | 'LAND' | 'YIELD';

export interface PortalModuleConfig {
  key: string;
  enabled: boolean;
  title: string;
  order: number;
}

export interface RealEstateExperienceTemplateDefinition {
  key: RealEstateExperienceTemplateKey;
  label: string;
  headline: string;
  description: string;
  targetPropertyTypes: string[];
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    darkLuxury: boolean;
  };
  modules: {
    dataRoom: PortalModuleConfig;
    calculator: PortalModuleConfig;
    brokerHub: PortalModuleConfig;
    transparencyCenter: PortalModuleConfig;
    governanceDao: PortalModuleConfig;
    rentalPool: PortalModuleConfig;
  };
  defaultCustomDoctrines: {
    legalFocus: string;
    financialFocus: string;
  };
}

export const REAL_ESTATE_EXPERIENCE_TEMPLATES: Record<
  RealEstateExperienceTemplateKey,
  RealEstateExperienceTemplateDefinition
> = {
  LUXURY: {
    key: 'LUXURY',
    label: 'Boutique & Luxury Resort',
    headline: 'Experiencia Patrimonial de Alta Gama',
    description: 'Diseñado para villas, condominios frente al mar y copropiedad fraccional con administración hotelera (Referencia S\'Narai).',
    targetPropertyTypes: ['VILLA', 'CONDOMINIUM', 'FRACTIONAL'],
    theme: {
      primaryColor: '#D4AF37', // Champagne Gold
      accentColor: '#10B981',  // Emerald Green
      backgroundColor: '#070709',
      darkLuxury: true
    },
    modules: {
      dataRoom: { key: 'dataRoom', enabled: true, title: 'Data Room Soberano', order: 1 },
      calculator: { key: 'calculator', enabled: true, title: 'Calculadora de Plusvalía & Rentas', order: 2 },
      brokerHub: { key: 'brokerHub', enabled: true, title: 'Broker Network Hub', order: 3 },
      transparencyCenter: { key: 'transparencyCenter', enabled: true, title: 'Centro de Transparencia de Obra', order: 4 },
      governanceDao: { key: 'governanceDao', enabled: true, title: 'Gobernanza de Propietarios', order: 5 },
      rentalPool: { key: 'rentalPool', enabled: true, title: 'Pool de Rentas Hotelero', order: 6 }
    },
    defaultCustomDoctrines: {
      legalFocus: 'Estructurado bajo fideicomiso bancario irrevocable de administración con certeza notarial.',
      financialFocus: 'Rendimiento sustentado en ocupación turística prémium y plusvalía histórica de la costa.'
    }
  },

  LAND: {
    key: 'LAND',
    label: 'Masterplan & Urbanización de Tierra',
    headline: 'Comercialización de Lotes y Macrolotes',
    description: 'Enfocado en desarrollos campestres, residenciales y macrolotes con financiamiento directo y etapas de urbanización.',
    targetPropertyTypes: ['LOT', 'MACROLOT', 'RESIDENTIAL_LOT'],
    theme: {
      primaryColor: '#F59E0B', // Amber
      accentColor: '#3B82F6',  // Blue
      backgroundColor: '#09090D',
      darkLuxury: true
    },
    modules: {
      dataRoom: { key: 'dataRoom', enabled: true, title: 'Expediente Notarial & Licencias', order: 1 },
      calculator: { key: 'calculator', enabled: true, title: 'Cotizador de Financiamiento Directo', order: 2 },
      brokerHub: { key: 'brokerHub', enabled: true, title: 'Red de Asesores & Lotes', order: 3 },
      transparencyCenter: { key: 'transparencyCenter', enabled: true, title: 'Hitos de Urbanización', order: 4 },
      governanceDao: { key: 'governanceDao', enabled: false, title: 'Gobernanza (No requerida)', order: 5 },
      rentalPool: { key: 'rentalPool', enabled: false, title: 'Pool de Rentas (No aplica)', order: 6 }
    },
    defaultCustomDoctrines: {
      legalFocus: 'Venta con promesa de compraventa con reserva de dominio y escrituración al liquidar.',
      financialFocus: 'Plusvalía generada por introducción de servicios básicos, vialidades y accesos.'
    }
  },

  YIELD: {
    key: 'YIELD',
    label: 'Institutional Cash Flow & Commercial',
    headline: 'Activos de Renta y Flujo de Caja',
    description: 'Orientado a locales comerciales, bodegas y edificios multifamily con métricas financieras (NOI, Cap Rate y dividendos periódicos).',
    targetPropertyTypes: ['COMMERCIAL_PREMISES', 'MULTIFAMILY', 'INDUSTRIAL_WAREHOUSE'],
    theme: {
      primaryColor: '#10B981', // Emerald
      accentColor: '#6366F1',  // Indigo
      backgroundColor: '#05070A',
      darkLuxury: true
    },
    modules: {
      dataRoom: { key: 'dataRoom', enabled: true, title: 'Auditoría Fiduciaria & Contratos de Renta', order: 1 },
      calculator: { key: 'calculator', enabled: true, title: 'Simulador de Cap Rate & NOI', order: 2 },
      brokerHub: { key: 'brokerHub', enabled: true, title: 'Partner Hub Institucional', order: 3 },
      transparencyCenter: { key: 'transparencyCenter', enabled: true, title: 'Reportes de Ocupación Auditados', order: 4 },
      governanceDao: { key: 'governanceDao', enabled: true, title: 'Comité Técnico de Vigilancia', order: 5 },
      rentalPool: { key: 'rentalPool', enabled: true, title: 'Distribución Pro-Rata Mensual', order: 6 }
    },
    defaultCustomDoctrines: {
      legalFocus: 'Vehículo SPV o fideicomiso emisor con custodia fiduciaria y contratos de arrendamiento triple net.',
      financialFocus: 'Flujos generados por arrendatarios corporativos con ajustes inflacionarios anuales.'
    }
  }
};

export function getExperienceTemplate(key: RealEstateExperienceTemplateKey): RealEstateExperienceTemplateDefinition {
  return REAL_ESTATE_EXPERIENCE_TEMPLATES[key] || REAL_ESTATE_EXPERIENCE_TEMPLATES.LUXURY;
}
export * from './real-estate-provisioner';

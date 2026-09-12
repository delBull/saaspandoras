import { describe, it, expect } from 'vitest';
import { 
  RealEstateDoctrineEngine, 
  ClientProjectKnowledge 
} from '../real-estate-doctrine';
import { 
  createRealEstateDomainPack, 
  REAL_ESTATE_BASE_SOUL 
} from '../real-estate-pack';

describe('Hermes Real Estate Pack — Phase 2 Doctrine & Pack Tests', () => {
  const mockKnowledge: ClientProjectKnowledge = {
    developmentName: 'Residencial Punta Arena',
    location: 'Riviera Nayarit, México',
    legalStructure: 'FIDUCIARY_TRUST',
    legalStructureDescription: 'Fideicomiso bancario irrevocable número F/1234 con Banco Mercantil.',
    developerCompany: 'Desarrollos del Pacífico S.A. de C.V.',
    propertyTypesOffered: ['LOT', 'VILLA'],
    commercialStage: 'PRESALE_EARLY_BIRD',
    estimatedDeliveryDate: 'Diciembre 2026',
    estimatedAppreciationPercentage: '18% anual histórico',
    rentalPoolEnabled: true,
    approvedDocuments: [
      {
        title: 'Escritura Constitutiva del Fideicomiso',
        category: 'LEGAL',
        documentUrl: 'https://dataroom.puntaarena.com/fideicomiso.pdf',
        isPublicInDataRoom: true
      },
      {
        title: 'Licencia Municipal de Urbanización',
        category: 'PERMITS',
        documentUrl: 'https://dataroom.puntaarena.com/licencia.pdf',
        isPublicInDataRoom: true
      }
    ]
  };

  describe('RealEstateDoctrineEngine', () => {
    it('resolves LEGAL_CERTAINTY objection with Safe Harbor prefix and fideicomiso reference', () => {
      const result = RealEstateDoctrineEngine.resolveObjection('LEGAL_CERTAINTY', mockKnowledge);
      
      expect(result.responseStrategy).toContain(RealEstateDoctrineEngine.SAFE_HARBOR_PREFIX);
      expect(result.responseStrategy).toContain('Fideicomiso Fiduciario de Garantía y Administración');
      expect(result.responseStrategy).toContain('F/1234');
      expect(result.approvedSourceDocument).toBe('Escritura Constitutiva del Fideicomiso');
    });

    it('resolves CAPITAL_APPRECIATION with mandatory financial Safe Harbor disclaimer', () => {
      const result = RealEstateDoctrineEngine.resolveObjection('CAPITAL_APPRECIATION', mockKnowledge);
      
      expect(result.responseStrategy).toContain(RealEstateDoctrineEngine.SAFE_HARBOR_PREFIX);
      expect(result.responseStrategy).toContain('18% anual histórico');
      expect(result.safeHarborDisclaimerIncluded).toBe(true);
      expect(result.responseStrategy).toContain('no constituyen rendimientos financieros garantizados');
    });

    it('resolves DELIVERY_TIMELINE referencing construction stage and estimated date', () => {
      const result = RealEstateDoctrineEngine.resolveObjection('DELIVERY_TIMELINE', mockKnowledge);
      
      expect(result.responseStrategy).toContain('Preventa Inicial Fase 1');
      expect(result.responseStrategy).toContain('Diciembre 2026');
      expect(result.responseStrategy).toContain('Centro de Transparencia');
    });

    it('resolves MAINTENANCE_HOA mentioning hotel rental pool', () => {
      const result = RealEstateDoctrineEngine.resolveObjection('MAINTENANCE_HOA', mockKnowledge);
      
      expect(result.responseStrategy).toContain('pool de rentas');
    });

    it('uses client custom doctrine when provided in knowledge', () => {
      const knowledgeWithCustom: ClientProjectKnowledge = {
        ...mockKnowledge,
        customDoctrines: {
          LEGAL_CERTAINTY: 'Contamos con título inmatriculado ante el Registro Público de Nayarit Folio 98765.',
          CAPITAL_APPRECIATION: '',
          DELIVERY_TIMELINE: '',
          EXIT_LIQUIDITY: '',
          MAINTENANCE_HOA: ''
        }
      };

      const result = RealEstateDoctrineEngine.resolveObjection('LEGAL_CERTAINTY', knowledgeWithCustom);
      expect(result.responseStrategy).toContain('Folio 98765');
      expect(result.responseStrategy).toContain(RealEstateDoctrineEngine.SAFE_HARBOR_PREFIX);
    });
  });

  describe('createRealEstateDomainPack factory', () => {
    it('produces a valid DomainPackManifest strictly through configuration without compilation', () => {
      const pack = createRealEstateDomainPack({
        tenantId: 'punta-arena',
        developmentName: 'Punta Arena',
        knowledge: mockKnowledge,
        customAgentName: 'Sofía Valdés'
      });

      expect(pack.id).toBe('punta-arena');
      expect(pack.type).toBe('organization-pack');
      expect(pack.soul.agentName).toBe('Sofía Valdés');
      expect(pack.soul.forbiddenClaims).toEqual(REAL_ESTATE_BASE_SOUL.forbiddenClaims);
      expect(pack.policies.financialAdvice).toBe('disclaimer_required');
      expect(pack.policies.promises).toBe('forbidden');
      expect(pack.journeys.length).toBeGreaterThan(0);
      expect(pack.journeys[0].id).toBe('punta-arena_commercial_closing_journey');
    });
  });
});

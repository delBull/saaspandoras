import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  HermesSkillRegistry, 
  registerCanonicalSkills, 
  CANONICAL_SKILLS, 
  HermesSkillDefinition 
} from '../index';

describe('🏛️ Hermes Skill Registry & Progressive Disclosure (F1)', () => {
  let registry: HermesSkillRegistry;

  beforeEach(() => {
    registry = HermesSkillRegistry.getInstance();
    registry.clear();
  });

  it('debe registrar y listar todas las skills canónicas de F1 (9 skills)', () => {
    registerCanonicalSkills(registry);

    const allSkills = registry.listAll();
    expect(allSkills.length).toBe(9);

    const ids = allSkills.map(s => s.id);
    expect(ids).toContain('seo.audit');
    expect(ids).toContain('seo.content');
    expect(ids).toContain('seo.schema');
    expect(ids).toContain('seo.competitor');
    expect(ids).toContain('seo.geo');
    expect(ids).toContain('web.search');
    expect(ids).toContain('web.extract');
    expect(ids).toContain('web.crawl');
    expect(ids).toContain('web.browser');
  });

  it('INVARIANTE CRÍTICA: Ninguna skill debe contener un método execute() (Conocimiento procedural puro)', () => {
    registerCanonicalSkills(registry);

    for (const skill of registry.listAll()) {
      expect((skill as any).execute).toBeUndefined();
      expect(typeof (skill as any).execute).toBe('undefined');
      expect(typeof skill.procedure).toBe('string');
      expect(skill.procedure.length).toBeGreaterThan(100);
    }
  });

  it('PROGRESSIVE DISCLOSURE: getSkillIndex() debe omitir procedure y schemas pesados', () => {
    registerCanonicalSkills(registry);

    const index = registry.getSkillIndex();
    expect(index.length).toBe(9);

    for (const item of index) {
      // Campos livianos presentes
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.description).toBeDefined();
      expect(item.category).toBeDefined();
      expect(item.requiredCapabilities).toBeDefined();
      expect(item.riskClass).toBeDefined();
      expect(item.produces).toBeDefined();

      // Campos pesados omitidos en el índice para no gastar tokens
      expect((item as any).procedure).toBeUndefined();
      expect((item as any).inputsSchema).toBeUndefined();
      expect((item as any).outputsSchema).toBeUndefined();
    }
  });

  it('ON-DEMAND HYDRATION: getSkill() recupera la definición completa con procedimiento', () => {
    registerCanonicalSkills(registry);

    const skill = registry.getSkill('seo.audit');
    expect(skill).toBeDefined();
    expect(skill!.name).toBe('Auditoría Técnica y On-Page');
    expect(skill!.executionClass).toBe('ANALYZE');
    expect(skill!.riskClass).toBe('LOW');
    expect(skill!.produces).toBe('EVIDENCE');
    expect(skill!.requiredTools).toEqual(['web.fetch', 'web.extract']);
    expect(skill!.inputsSchema).toBeDefined();
    expect(skill!.procedure).toContain('# Procedimiento: Auditoría Técnica y On-Page');
  });

  it('CAPABILITY FILTERING: getSkillsForCapabilities() debe filtrar con Least Privilege estricto', () => {
    registerCanonicalSkills(registry);

    // Solo con capability 'web.extract'
    const extractSkills = registry.getSkillsForCapabilities(['web.extract']);
    const extractSkillIds = extractSkills.map(s => s.id);

    expect(extractSkillIds).toContain('seo.audit');
    expect(extractSkillIds).toContain('seo.content');
    expect(extractSkillIds).toContain('seo.schema');
    expect(extractSkillIds).toContain('seo.geo');
    expect(extractSkillIds).toContain('web.extract');

    // 'seo.competitor' requiere ['web.search', 'web.extract'], debe estar EXCLUIDA
    expect(extractSkillIds).not.toContain('seo.competitor');

    // 'web.browser' requiere ['web.browser'], debe estar EXCLUIDA
    expect(extractSkillIds).not.toContain('web.browser');

    // Con capabilities ['web.search', 'web.extract']
    const multiSkills = registry.getSkillsForCapabilities(['web.search', 'web.extract']);
    const multiSkillIds = multiSkills.map(s => s.id);
    expect(multiSkillIds).toContain('seo.competitor');
    expect(multiSkillIds).toContain('web.search');
  });

  it('GOBERNANZA: web.browser debe requerir aprobación humana explícita y nivel de riesgo HIGH', () => {
    registerCanonicalSkills(registry);

    const browserSkill = registry.getSkill('web.browser');
    expect(browserSkill).toBeDefined();
    expect(browserSkill!.riskClass).toBe('HIGH');
    expect(browserSkill!.executionClass).toBe('EXECUTE');
    expect(browserSkill!.governance.approvalRequired).toBe(true);
    expect(browserSkill!.governance.requiredClearance).toBe('TIER_2_OPERATOR');
  });

  it('GEO REALISMO: seo.geo debe documentar explícitamente los límites de llms.txt', () => {
    registerCanonicalSkills(registry);

    const geoSkill = registry.getSkill('seo.geo');
    expect(geoSkill).toBeDefined();
    expect(geoSkill!.procedure).toContain('llms.txt` NO es una palanca mágica');
    expect(geoSkill!.procedure).toContain('Citabilidad basada en datos atómicos');
  });
});

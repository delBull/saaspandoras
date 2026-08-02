export interface PolicyRule {
  id: string;
  source: 'CORE_CODE' | 'TENANT_DB' | 'DOMAIN_PACK';
  ruleType: 'ALLOW' | 'DENY' | 'REQUIRES_APPROVAL';
  pattern?: string;
  description: string;
}

export class PolicyEngine {
  private rules: PolicyRule[] = [
    {
      id: "CORE_NO_GUARANTEED_RETURNS",
      source: "CORE_CODE",
      ruleType: "DENY",
      pattern: "garantiz|rendimiento fijo|retorno seguro",
      description: "Queda estrictamente prohibido prometer retornos de inversión garantizados o fijos."
    },
    {
      id: "CORE_NO_UNAUTHORIZED_LEGAL",
      source: "CORE_CODE",
      ruleType: "DENY",
      pattern: "dictamen legal definitivo|asesoria legal formal",
      description: "Queda prohibido emitir dictámenes legales definitivos sin revisión de apoderado legal."
    }
  ];

  addRules(additionalRules: PolicyRule[]) {
    this.rules.push(...additionalRules);
  }

  evaluateMessage(message: string): { allowed: boolean; violatedRule?: PolicyRule } {
    for (const rule of this.rules) {
      if (rule.ruleType === 'DENY' && rule.pattern) {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(message)) {
          return { allowed: false, violatedRule: rule };
        }
      }
    }
    return { allowed: true };
  }
}

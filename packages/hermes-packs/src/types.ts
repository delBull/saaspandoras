export interface DomainPackManifest {
  id: string;
  name: string;
  version: string;
  industry: string;
  locale: string[];
  requires: string[];
}

export interface DomainPack {
  manifest: DomainPackManifest;
  knowledge: {
    title: string;
    summary: string;
    faqs: Array<{ question: string; answer: string }>;
  };
  resources: Array<{
    id: string;
    name: string;
    type: 'pdf' | 'link' | 'video' | 'doc';
    url: string;
  }>;
  policies: Array<{
    id: string;
    description: string;
    ruleType: 'ALLOW' | 'DENY' | 'REQUIRES_APPROVAL';
    pattern?: string;
  }>;
  objections: Array<{
    triggerPattern: string;
    category: string;
    response: string;
    suggestedResourceId?: string;
  }>;
  salesPitch: string;
  pricing?: Record<string, any>;
}

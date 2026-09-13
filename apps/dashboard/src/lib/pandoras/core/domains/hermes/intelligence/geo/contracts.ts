/**
 * 🌐 Hermes OS — GEO & AI Discoverability Contracts (F5)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/intelligence/geo/contracts.ts
 */

export interface AiBotPolicy {
  botName: string;
  userAgent: string;
  allowed: boolean;
  directive?: string;
}

export interface AiRobotsPolicyReport {
  robotsFound: boolean;
  content?: string;
  botPolicies: AiBotPolicy[];
  allAiBotsBlocked: boolean;
  score: number; // 0 to 100
}

export interface LlmsTxtReport {
  present: boolean;
  url?: string;
  contentLength: number;
  hasCanonicalLinks: boolean;
  hasH1Title: boolean;
  sectionCount: number;
  isValidMarkdown: boolean;
}

export interface GeoAuditInput {
  url: string;
  robotsTxtContent?: string;
  llmsTxtContent?: string;
  htmlContent?: string;
}

export interface GeoCitabilityReport {
  url: string;
  citabilityScore: number; // 0 to 100
  aiRobotsPolicy: AiRobotsPolicyReport;
  llmsTxtStatus: LlmsTxtReport;
  atomicFactsCount: number;
  entityConsistencyScore: number;
  recommendations: string[];
  generatedLlmsTxt?: string;
}

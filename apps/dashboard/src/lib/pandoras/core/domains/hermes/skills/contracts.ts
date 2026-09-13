/**
 * 📜 Hermes OS — Skill Contracts & Governance Types (F1)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/skills/contracts.ts
 *
 * ARCHITECTURAL INVARIANT:
 * A Skill represents PROCEDURAL KNOWLEDGE ("How to accomplish a class of tasks").
 * A Skill NEVER executes directly. Execution authority belongs exclusively to the
 * Tool Gateway (HermesToolExecutor + ToolAuthorizationGate).
 *
 * PROGRESSIVE DISCLOSURE:
 * - HermesSkillIndex: Lightweight metadata exposed to prompts/discovery (~100 tokens).
 * - HermesSkillDefinition: Full operational procedure hydrated strictly on-demand.
 */

export type SkillCategory =
  | 'SEO'
  | 'WEB_INTELLIGENCE'
  | 'RESEARCH'
  | 'REAL_ESTATE'
  | 'COMMERCE'
  | 'GOVERNANCE'
  | 'OPERATIONS';

export type SkillExecutionClass =
  | 'READ'
  | 'ANALYZE'
  | 'GENERATE'
  | 'WRITE'
  | 'EXECUTE';

export type SkillRiskClass =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type SkillProduces =
  | 'TEXT'
  | 'DATA'
  | 'EVIDENCE'
  | 'ARTIFACT'
  | 'ACTION';

export interface SkillGovernance {
  approvalRequired: boolean;
  requiredClearance?: string;
  quorumRequired?: boolean;
}

/**
 * 📦 HermesSkillIndex — Lightweight representation for Progressive Disclosure.
 * Injected into LLM context / system prompt without operational instructions overhead.
 */
export interface HermesSkillIndex {
  id: string;
  version: string;
  name: string;
  description: string;
  category: SkillCategory;
  requiredCapabilities: string[];
  riskClass: SkillRiskClass;
  produces: SkillProduces;
  tenantScoped: boolean;
}

/**
 * 📜 HermesSkillDefinition — Complete Procedural Knowledge Specification.
 * Hydrated on-demand when the cognitive runtime chooses to execute this procedure.
 */
export interface HermesSkillDefinition extends HermesSkillIndex {
  executionClass: SkillExecutionClass;
  requiredTools: string[];
  governance: SkillGovernance;
  inputsSchema: Record<string, unknown>;
  outputsSchema: Record<string, unknown>;
  /**
   * Complete Operational Procedure in Markdown.
   * Includes: Context, Prerequisites, Execution Procedure, Pitfalls, Verification.
   */
  procedure: string;
}

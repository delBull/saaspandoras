/**
 * 🏛️ Hermes OS — Skill Registry (F1)
 * apps/dashboard/src/lib/pandoras/core/domains/hermes/skills/registry.ts
 *
 * Implements the Progressive Disclosure Registry for Hermes Skills.
 * Isolates procedural definitions from execution tools.
 */

import { HermesSkillDefinition, HermesSkillIndex } from './contracts';

export class HermesSkillRegistry {
  private static instance: HermesSkillRegistry;
  private skills: Map<string, HermesSkillDefinition> = new Map();

  private constructor() {}

  public static getInstance(): HermesSkillRegistry {
    if (!HermesSkillRegistry.instance) {
      HermesSkillRegistry.instance = new HermesSkillRegistry();
    }
    return HermesSkillRegistry.instance;
  }

  /**
   * Registers a skill definition into the registry.
   */
  public register(skill: HermesSkillDefinition): void {
    if (!skill.id || typeof skill.id !== 'string') {
      throw new Error('[HermesSkillRegistry] Invalid skill ID.');
    }
    this.skills.set(skill.id, Object.freeze({ ...skill }));
  }

  /**
   * Retrieves the full skill definition (including procedural markdown).
   * Used strictly for on-demand hydration.
   */
  public getSkill(id: string): HermesSkillDefinition | undefined {
    return this.skills.get(id);
  }

  /**
   * Checks if a skill is registered.
   */
  public hasSkill(id: string): boolean {
    return this.skills.has(id);
  }

  /**
   * Returns lightweight indices for all registered skills (Progressive Disclosure).
   * Omits heavyweight procedure markdown and schemas to conserve LLM tokens.
   */
  public getSkillIndex(): HermesSkillIndex[] {
    return Array.from(this.skills.values()).map(s => ({
      id: s.id,
      version: s.version,
      name: s.name,
      description: s.description,
      category: s.category,
      requiredCapabilities: [...s.requiredCapabilities],
      riskClass: s.riskClass,
      produces: s.produces,
      tenantScoped: s.tenantScoped,
    }));
  }

  /**
   * Filters skills available for a specific set of active capabilities.
   */
  public getSkillsForCapabilities(activeCapabilities: string[]): HermesSkillIndex[] {
    const activeSet = new Set(activeCapabilities);
    return this.getSkillIndex().filter(skill =>
      skill.requiredCapabilities.every(cap => activeSet.has(cap))
    );
  }

  /**
   * Returns all full skill definitions.
   */
  public listAll(): HermesSkillDefinition[] {
    return Array.from(this.skills.values());
  }

  /**
   * Clears all registered skills (primarily for testing isolation).
   */
  public clear(): void {
    this.skills.clear();
  }
}

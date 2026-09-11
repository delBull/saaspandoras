import { describe, it, expect } from 'vitest';
import { HermesPromptBuilder } from '../prompt-builder';
import { CognitiveContextAdapter } from '../context-adapter';

describe('🏛️ Hermes Tenant Identity & Schedule Link Separation', () => {
  it('prompt builder uses Pandora\'s Growth OS for pandoras tenant', () => {
    const prompt = HermesPromptBuilder.build({
      reasoningContext: {
        tenantIdentity: {
          agentName: 'Hermes',
          organizationName: "Pandora's Growth OS",
          language: 'es',
          tone: 'Formal, Concierge',
        },
        systemRules: [],
        governanceRestrictions: [],
        activeKnowledge: [],
        activeCapabilities: [],
        styleOverlay: {},
        conversationHistory: [],
        currentMessage: { id: 'm1', role: 'USER', content: 'hola', createdAt: new Date() },
      } as any,
      hints: { temperature: 0.1, maxTokens: 100 },
    });

    const directivesMsg = prompt.messages.find(m => m.content.includes('=== FORMATTING & PRESENTATION DIRECTIVES ==='));
    expect(directivesMsg).toBeDefined();
    expect(directivesMsg!.content).toContain("As Hermes for Pandora's Growth OS");
    expect(directivesMsg!.content).not.toContain("As Hermes for S'Narai");
  });

  it('prompt builder uses S\'Narai only when explicitly acting for S\'Narai', () => {
    const prompt = HermesPromptBuilder.build({
      reasoningContext: {
        tenantIdentity: {
          agentName: 'Hermes',
          organizationName: "S'Narai",
          language: 'es',
          tone: 'Formal, Concierge',
        },
        systemRules: [],
        governanceRestrictions: [],
        activeKnowledge: [],
        activeCapabilities: [],
        styleOverlay: {},
        conversationHistory: [],
        currentMessage: { id: 'm2', role: 'USER', content: 'hola', createdAt: new Date() },
      } as any,
      hints: { temperature: 0.1, maxTokens: 100 },
    });

    const directivesMsg = prompt.messages.find(m => m.content.includes('=== FORMATTING & PRESENTATION DIRECTIVES ==='));
    expect(directivesMsg).toBeDefined();
    expect(directivesMsg!.content).toContain("As Hermes for S'Narai");
  });

  it('context adapter formats schedule links using projectSlug or clean slug instead of unresolvable UUID', () => {
    const effectiveContext = {
      core: {
        tenantId: '9079ecf5-2162-4078-bddf-66b607e2d32f',
        projectSlug: 'snarai',
        organizationName: "S'Narai",
      },
      activeCapabilities: [],
      knowledge: [],
      style: {},
      intelligenceScores: [],
    };

    const { reasoningContext } = CognitiveContextAdapter.adapt(effectiveContext as any, [], {
      id: '1',
      role: 'USER',
      content: 'test',
      createdAt: new Date(),
    });
    const schedulingCap = reasoningContext.activeCapabilities.find(c => c.id === 'scheduling.book');
    expect(schedulingCap).toBeDefined();
    
    // Suggested action must contain clean slug /schedule/snarai, NOT raw UUID
    const scheduleAction = (schedulingCap!.suggestedActions || []).find(a => a.includes('/schedule/'));
    expect(scheduleAction).toBeDefined();
    expect(scheduleAction).toContain('/schedule/snarai');
    expect(scheduleAction).not.toContain('9079ecf5-2162-4078-bddf-66b607e2d32f');
  });

  it('context adapter formats schedule links for pandoras root without UUID', () => {
    const effectiveContext = {
      core: {
        tenantId: 'pandoras',
        projectSlug: 'pandoras',
        organizationName: "Pandora's Growth OS",
      },
      activeCapabilities: [],
      knowledge: [],
      style: {},
      intelligenceScores: [],
    };

    const { reasoningContext } = CognitiveContextAdapter.adapt(effectiveContext as any, [], {
      id: '1',
      role: 'USER',
      content: 'test',
      createdAt: new Date(),
    });
    const schedulingCap = reasoningContext.activeCapabilities.find(c => c.id === 'scheduling.book');
    expect(schedulingCap).toBeDefined();

    const scheduleAction = (schedulingCap!.suggestedActions || []).find(a => a.includes('/schedule/'));
    expect(scheduleAction).toContain('/schedule/pandoras');
  });
});

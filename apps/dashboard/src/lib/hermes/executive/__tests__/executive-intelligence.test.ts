import { describe, it, expect } from 'vitest';
import { FounderDirectiveStore } from '../founder-directives';
import { ExecutiveBriefingEngine } from '../briefing-engine';
import { ALL_FOUNDER_CAPABILITIES } from '../types';
import { InterlocutorResolver } from '@/lib/hermes/identity/interlocutor-resolver';
import { HermesPromptBuilder } from '@/lib/pandoras/core/domains/hermes/runtime/prompt-builder';
import type { ReasoningContext, RuntimeMessage } from '@/lib/pandoras/core/domains/hermes/runtime/contracts';

describe('Hermes Executive Sovereign Plane — Phase 0: Executive Intelligence & Founder Memory', () => {
  describe('1. FounderDirectiveStore (Executive Memory)', () => {
    it('infers directive categories accurately from conversational text', () => {
      expect(FounderDirectiveStore.inferCategory('No usar Twilio para SMS')).toBe('VENDOR_RESTRICTION');
      expect(FounderDirectiveStore.inferCategory('Prohibido usar bases de datos externas sin Neon')).toBe('VENDOR_RESTRICTION');
      expect(FounderDirectiveStore.inferCategory('Priorizar el cluster de IPFS para almacenamiento')).toBe('INFRASTRUCTURE_PREFERENCE');
      expect(FounderDirectiveStore.inferCategory('El tenant snari debe priorizar villas fase 1')).toBe('TENANT_OVERRIDE');
      expect(FounderDirectiveStore.inferCategory('Ajustar precio del token Agora a 0.50 USDC')).toBe('PRODUCT_POLICY');
      expect(FounderDirectiveStore.inferCategory('Mantener alta velocidad en el cierre de leads')).toBe('GENERAL_STRATEGY');
    });

    it('adds and persists an authoritative directive from Marco', () => {
      const dir = FounderDirectiveStore.addDirective({
        text: 'Nunca aceptar transferencias sin comprobante bancario validado',
        category: 'PRODUCT_POLICY',
        channel: 'telegram',
        actorId: 'marco_founder',
      });

      expect(dir.id).toMatch(/^dir_/);
      expect(dir.status).toBe('ACTIVE');
      expect(dir.authoritative).toBe(true);

      const active = FounderDirectiveStore.getActiveDirectives();
      expect(active.some(d => d.id === dir.id)).toBe(true);
    });

    it('formats active directives into markdown prompt context with maximum authority', () => {
      const promptBlock = FounderDirectiveStore.formatDirectivesForPrompt();
      expect(promptBlock).toContain('DIRECTIVAS ESTRATÉGICAS DEL FUNDADOR (MARCO)');
      expect(promptBlock).toContain('MÁXIMA AUTORIDAD');
      expect(promptBlock).toContain('Hermes DEBE alinear todas sus propuestas');
    });

    it('deactivates an existing directive', () => {
      const dir = FounderDirectiveStore.addDirective({
        text: 'Directiva temporal a desactivar',
        category: 'GENERAL_STRATEGY',
      });

      expect(FounderDirectiveStore.deactivateDirective(dir.id)).toBe(true);
      const active = FounderDirectiveStore.getActiveDirectives();
      expect(active.some(d => d.id === dir.id)).toBe(false);
    });
  });

  describe('2. ExecutiveBriefingEngine (Tier 0: Business Pulse)', () => {
    it('generates a structured executive briefing with markdown summary', async () => {
      const briefing = await ExecutiveBriefingEngine.generateBriefing();

      expect(briefing).toBeDefined();
      expect(briefing.headline).toContain("Pandora's Pulse");
      expect(Array.isArray(briefing.attentionItems)).toBe(true);
      expect(briefing.attentionItems.length).toBeGreaterThan(0);
      expect(briefing.systemHealth.status).toBe('HEALTHY');
      expect(briefing.rawMarkdown).toContain('BRIEFING EJECUTIVO — PANDORA\'S GROWTH OS');
      expect(briefing.rawMarkdown).toContain('PUNTOS QUE REQUIEREN TU ATENCIÓN HOY');
      expect(briefing.rawMarkdown).toContain('PULSO DE NEGOCIO');
    });
  });

  describe('3. Capability-Based Authority (Role != Capability)', () => {
    it('grants all founder capabilities to Marco upon identity resolution', async () => {
      const marco = await InterlocutorResolver.resolve({
        channel: 'web',
        walletAddress: '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
      });

      expect(marco.isBoss).toBe(true);
      expect(marco.founderExecutiveMode).toBe(true);
      expect(marco.capabilities).toEqual(ALL_FOUNDER_CAPABILITIES);

      expect(InterlocutorResolver.hasFounderCapability(marco, 'FOUNDER_INTELLIGENCE')).toBe(true);
      expect(InterlocutorResolver.hasFounderCapability(marco, 'FOUNDER_READ')).toBe(true);
      expect(InterlocutorResolver.hasFounderCapability(marco, 'FOUNDER_OPERATOR')).toBe(true);
      expect(InterlocutorResolver.hasFounderCapability(marco, 'FOUNDER_CODE_EXECUTION')).toBe(true);
      expect(InterlocutorResolver.hasFounderCapability(marco, 'FOUNDER_FINANCIAL')).toBe(true);
    });

    it('denies founder capabilities to non-boss interlocutors', async () => {
      const guest = await InterlocutorResolver.resolve({
        channel: 'whatsapp',
        phone: '+52 555 999 8888',
      });

      expect(guest.isBoss).toBe(false);
      expect(guest.founderExecutiveMode).toBeFalsy();
      expect(InterlocutorResolver.hasFounderCapability(guest, 'FOUNDER_FINANCIAL')).toBe(false);
      expect(InterlocutorResolver.hasFounderCapability(guest, 'FOUNDER_OPERATOR')).toBe(false);
    });
  });

  describe('4. HermesPromptBuilder (Executive Mode Injection)', () => {
    it('injects Founder Directives and Tier 0 capabilities into system prompt', () => {
      const dummyMsg: RuntimeMessage = {
        id: 'msg_1',
        role: 'USER',
        content: '¿Cuál es la estrategia?',
        createdAt: new Date(),
      };

      const executiveContext: ReasoningContext = {
        systemRules: ['Rule 1'],
        governanceRestrictions: [],
        tenantIdentity: { agentName: 'Hermes', organizationName: "Pandoras" },
        activeKnowledge: [],
        activeCapabilities: [],
        interlocutor: {
          name: 'Marco',
          role: 'FOUNDER_BOSS',
          actorId: 'marco_founder',
          isBoss: true,
          founderExecutiveMode: true,
        },
        conversationHistory: [],
        currentMessage: dummyMsg,
      };

      const prompt = HermesPromptBuilder.build({ reasoningContext: executiveContext });
      const systemMessages = prompt.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');

      expect(systemMessages).toContain('HERMES EXECUTIVE SOVEREIGN PLANE: MODO FUNDADOR / MARCO');
      expect(systemMessages).toContain('CAPACIDADES EJECUTIVAS: FOUNDER_INTELLIGENCE (Tier 0)');
      expect(systemMessages).toContain('TIER 0 EXECUTIVE INTELLIGENCE & BRIEFINGS');
      expect(systemMessages).toContain('DIRECTIVAS ESTRATÉGICAS DEL FUNDADOR');
    });
  });
});

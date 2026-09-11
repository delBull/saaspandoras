import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InterlocutorResolver } from '../interlocutor-resolver';
import { CognitiveContextAdapter } from '@/lib/pandoras/core/domains/hermes/runtime/context-adapter';
import { HermesPromptBuilder } from '@/lib/pandoras/core/domains/hermes/runtime/prompt-builder';
import type { RuntimeMessage, ReasoningContext } from '@/lib/pandoras/core/domains/hermes/runtime/contracts';

describe('Hermes Omnichannel Identity & Boss Executive Authority Suite', () => {
  describe('1. InterlocutorResolver — Boss Detection across 4 surfaces', () => {
    it('detects Marco as Boss via canonical wallet on Web / Hermes Intelligence', async () => {
      const result = await InterlocutorResolver.resolve({
        channel: 'web',
        walletAddress: '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
      });

      expect(result.isBoss).toBe(true);
      expect(result.name).toBe('Marco');
      expect(result.role).toBe('FOUNDER_BOSS');
      expect(result.executivePrivilege).toBe(true);
      expect(result.actorId).toBe('marco_founder');
    });

    it('detects Marco as Boss via admin phone number on WhatsApp', async () => {
      const result = await InterlocutorResolver.resolve({
        channel: 'whatsapp',
        phone: '+52 322 274 1987',
      });

      expect(result.isBoss).toBe(true);
      expect(result.name).toBe('Marco');
      expect(result.role).toBe('FOUNDER_BOSS');
      expect(result.executivePrivilege).toBe(true);
    });

    it('detects Marco as Boss via Telegram ID / Username', async () => {
      const result = await InterlocutorResolver.resolve({
        channel: 'telegram',
        telegramId: '555111222',
        telegramUsername: 'operator_marco',
      });

      expect(result.isBoss).toBe(true);
      expect(result.name).toBe('Marco');
      expect(result.role).toBe('FOUNDER_BOSS');
      expect(result.executivePrivilege).toBe(true);
    });

    it('detects Marco as Boss on Nexus Terminal with admin context', async () => {
      const result = await InterlocutorResolver.resolve({
        channel: 'nexus',
        walletAddress: '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
        email: 'admin@pandoras.finance',
      });

      expect(result.isBoss).toBe(true);
      expect(result.name).toBe('Marco');
      expect(result.role).toBe('FOUNDER_BOSS');
    });

    it('treats unknown inbound as new lead with friendly provisional name', async () => {
      const freshPhone = `+5299${Date.now().toString().slice(-8)}`;
      const result = await InterlocutorResolver.resolve({
        channel: 'whatsapp',
        phone: freshPhone,
        nameHint: 'Carlos Rivera',
      });

      expect(result.isBoss).toBe(false);
      expect(result.name).toBe('Carlos Rivera');
      expect(result.role).toBe('NEW_LEAD');
      expect(result.isNewLead).toBe(true);
    });
  });

  describe('2. PromptBuilder — Executive Boss Directives & Personalized Greetings', () => {
    const dummyMsg: RuntimeMessage = {
      id: 'msg_1',
      role: 'USER',
      content: 'Hola Hermes, cómo vamos hoy?',
      createdAt: new Date(),
    };

    it('injects Executive Boss Authority block with ZERO restrictions for Marco', () => {
      const bossContext: ReasoningContext = {
        systemRules: ['Rule 1'],
        governanceRestrictions: ['Restriction 1'],
        tenantIdentity: { agentName: 'Hermes', organizationName: "Pandora's Growth OS" },
        activeKnowledge: [],
        activeCapabilities: [
          {
            id: 'schedule_meeting',
            description: 'Agendar llamadas y citas',
            requiresHumanApproval: true, // Normally blocked by human gate
          },
        ],
        interlocutor: {
          name: 'Marco',
          role: 'FOUNDER_BOSS',
          actorId: 'marco_founder',
          isBoss: true,
          executivePrivilege: true,
        },
        conversationHistory: [],
        currentMessage: dummyMsg,
      };

      const prompt = HermesPromptBuilder.build({ reasoningContext: bossContext });
      const systemMessages = prompt.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');

      // 1. Must recognize Marco as Boss
      expect(systemMessages).toContain('EXECUTIVE_AUTHORITY: MARCO — EL JEFE DE PANDORAS');
      expect(systemMessages).toContain('CERO RESTRICCIONES NI LIMITACIONES');
      expect(systemMessages).toContain('RECEPTOR DE CONTACTOS Y BIENVENIDAS');
      expect(systemMessages).toContain('INSTRUCCIONES DE NEGOCIO Y ESTRATEGIA');

      // 2. Human approval gate MUST BE BYPASSED for the Boss
      expect(systemMessages).not.toContain('[HUMAN_GATE: MANDATORY_HUMAN_APPROVAL]');
    });

    it('injects personalized name directive for registered interlocutor (non-boss)', () => {
      const memberContext: ReasoningContext = {
        systemRules: ['Rule 1'],
        governanceRestrictions: [],
        tenantIdentity: { agentName: 'Hermes', organizationName: "S'Narai" },
        activeKnowledge: [],
        activeCapabilities: [
          {
            id: 'schedule_meeting',
            description: 'Agendar llamadas',
            requiresHumanApproval: true,
          }
        ],
        interlocutor: {
          name: 'Óscar Hernández',
          role: 'OPERATOR',
          actorId: 'collab_12',
          isBoss: false,
        },
        conversationHistory: [],
        currentMessage: dummyMsg,
      };

      const prompt = HermesPromptBuilder.build({ reasoningContext: memberContext });
      const systemMessages = prompt.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');

      expect(systemMessages).toContain('INTERLOCUTOR_IDENTIFICATION');
      expect(systemMessages).toContain('Óscar Hernández');
      expect(systemMessages).toContain('Dirígete a esta persona SIEMPRE por su nombre (Óscar Hernández)');

      // Human gate is active for non-boss
      expect(systemMessages).toContain('[HUMAN_GATE: MANDATORY_HUMAN_APPROVAL]');
    });
  });

  describe('3. CognitiveContextAdapter — Elevates Clearance for the Boss', () => {
    it('grants CONFIDENTIAL clearance to Boss without needing explicit grant', () => {
      const effectiveContext: any = {
        core: {
          tenantId: 'pandoras',
          role: 'USER', // Even if core role says user, interlocutor is Boss
          identity: {
            isBoss: true,
            role: 'FOUNDER_BOSS',
            name: 'Marco',
          },
        },
        knowledge: [
          {
            id: 'fact_confidential',
            key: 'holding_term_sheet',
            content: 'Contrato confidencial de holding',
            status: 'ACTIVE',
            visibility: 'CONFIDENTIAL',
            classification: 'CONFIDENTIAL',
          }
        ],
        activeCapabilities: [],
      };

      const dummyMsg: RuntimeMessage = {
        id: 'msg_test',
        role: 'USER',
        content: 'Reporte confidencial',
        createdAt: new Date(),
      };

      const { reasoningContext } = CognitiveContextAdapter.adapt(effectiveContext, [], dummyMsg);
      expect(reasoningContext.interlocutor?.isBoss).toBe(true);
      expect(reasoningContext.interlocutor?.name).toBe('Marco');
      // Knowledge at CONFIDENTIAL classification must be retained for the Boss
      expect(reasoningContext.activeKnowledge.some(k => k.id === 'fact_confidential')).toBe(true);
    });
  });

  describe('4. Granular RBAC, Boundaries & Roles for Ecosystem Scaling', () => {
    const dummyMsg: RuntimeMessage = {
      id: 'msg_test_rbac',
      role: 'USER',
      content: 'Estatus del sistema',
      createdAt: new Date(),
    };

    it('injects operational posture and permissions for ADMIN_OPERATIONS', () => {
      const opsContext: ReasoningContext = {
        systemRules: ['Rule 1'],
        governanceRestrictions: [],
        tenantIdentity: { agentName: 'Hermes', organizationName: "Pandoras" },
        activeKnowledge: [],
        activeCapabilities: [],
        interlocutor: {
          name: 'Laura Operaciones',
          role: 'ADMIN_OPERATIONS',
          actorId: 'user_ops_1',
          isBoss: false,
          permissions: ['users.manage', 'tenants.manage', 'calendar.manage'],
        },
        conversationHistory: [],
        currentMessage: dummyMsg,
      };

      const prompt = HermesPromptBuilder.build({ reasoningContext: opsContext });
      const systemMessages = prompt.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');

      expect(systemMessages).toContain('POSTURA OPERATIVA');
      expect(systemMessages).toContain('NUNCA expongas claves privadas ni autorices retiros financieros directos');
      expect(systemMessages).toContain('Permisos Autorizados: users.manage, tenants.manage, calendar.manage');
    });

    it('injects VIP posture and deal room permissions for INVESTOR', () => {
      const investorContext: ReasoningContext = {
        systemRules: ['Rule 1'],
        governanceRestrictions: [],
        tenantIdentity: { agentName: 'Hermes', organizationName: "S'Narai" },
        activeKnowledge: [],
        activeCapabilities: [],
        interlocutor: {
          name: 'Santiago Garza',
          role: 'INVESTOR',
          title: 'Inversionista Registrado',
          actorId: 'lead_inv_99',
          isBoss: false,
          permissions: ['portal.view', 'deal_room.view', 'schedule.book'],
        },
        conversationHistory: [],
        currentMessage: dummyMsg,
      };

      const prompt = HermesPromptBuilder.build({ reasoningContext: investorContext });
      const systemMessages = prompt.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');

      expect(systemMessages).toContain('POSTURA INVERSIONISTA VIP');
      expect(systemMessages).toContain('guante blanco');
      expect(systemMessages).toContain('Permisos Autorizados: portal.view, deal_room.view, schedule.book');
    });

    it('injects growth posture and bounds for ADMIN_MARKETING', () => {
      const mktgContext: ReasoningContext = {
        systemRules: ['Rule 1'],
        governanceRestrictions: [],
        tenantIdentity: { agentName: 'Hermes', organizationName: "Pandoras" },
        activeKnowledge: [],
        activeCapabilities: [],
        interlocutor: {
          name: 'Valeria Crecimiento',
          role: 'ADMIN_MARKETING',
          actorId: 'user_mktg_2',
          isBoss: false,
          permissions: ['marketing.manage', 'growth.manage'],
        },
        conversationHistory: [],
        currentMessage: dummyMsg,
      };

      const prompt = HermesPromptBuilder.build({ reasoningContext: mktgContext });
      const systemMessages = prompt.messages.filter(m => m.role === 'system').map(m => m.content).join('\n');

      expect(systemMessages).toContain('POSTURA DE CRECIMIENTO');
      expect(systemMessages).toContain('No compartas información confidencial de KYC de inversionistas');
      expect(systemMessages).toContain('Permisos Autorizados: marketing.manage, growth.manage');
    });

    it('executes promoteContactFromBoss to convert a contact into an administrator', async () => {
      const result = await InterlocutorResolver.promoteContactFromBoss({
        targetIdentifier: 'valeria@pandoras.finance',
        targetRole: 'ADMIN_OPERATIONS',
        notes: 'Promoción a Ops Admin dictada por Marco',
      });

      expect(result.success).toBe(true);
      expect(result.assignedRole).toBe('ADMIN_OPERATIONS');
      expect(result.message).toContain('ADMIN_OPERATIONS');
    });
  });

  describe('5. Telegram Webhook Anti-Forgery & Boss Impersonation Defense', () => {
    it('rejects updates without matching X-Telegram-Bot-Api-Secret-Token', async () => {
      const { POST } = await import('@/app/api/hermes/bot/webhook/route');
      const originalSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
      process.env.TELEGRAM_WEBHOOK_SECRET = 'k25_vault_secret_token_123';

      try {
        // Request with missing secret token
        const reqMissing = new Request('http://localhost:3000/api/hermes/bot/webhook', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            message: {
              from: { id: 555111222, first_name: 'Marco' },
              chat: { id: 555111222 },
              text: 'instruccion secreta',
            },
          }),
        });

        const resMissing = await POST(reqMissing as any);
        expect(resMissing.status).toBe(401);

        // Request with invalid secret token
        const reqInvalid = new Request('http://localhost:3000/api/hermes/bot/webhook', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-telegram-bot-api-secret-token': 'attacker_fake_token',
          },
          body: JSON.stringify({
            message: {
              from: { id: 555111222, first_name: 'Marco' },
              chat: { id: 555111222 },
              text: 'instruccion secreta',
            },
          }),
        });

        const resInvalid = await POST(reqInvalid as any);
        expect(resInvalid.status).toBe(401);

        // Request with valid secret token
        const reqValid = new Request('http://localhost:3000/api/hermes/bot/webhook', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-telegram-bot-api-secret-token': 'k25_vault_secret_token_123',
          },
          body: JSON.stringify({
            message: {
              from: { id: 555111222, first_name: 'Marco' },
              chat: { id: 555111222 },
              text: '',
            },
          }),
        });

        const resValid = await POST(reqValid as any);
        expect(resValid.status).toBe(200);
      } finally {
        process.env.TELEGRAM_WEBHOOK_SECRET = originalSecret;
      }
    });
  });
});

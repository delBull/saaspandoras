import { describe, it, expect, vi } from 'vitest';
import { RevenueCloserEngine } from '../revenue-closer-engine';
import { ExecutiveHandoffService } from '../executive-handoff-service';
import { AttributionPolicy } from '../../contracts/attribution';
import { RevenueOpportunity } from '../../contracts/opportunity';

describe('Hermes RevenueCloserEngine — Phase 1 Core Test Suite', () => {
  describe('Qualification Engine & State Transitions', () => {
    it('creates an initial anonymous qualification context with baseline confidence', () => {
      const initial = RevenueCloserEngine.createInitialQualificationContext();
      expect(initial.stage).toBe('ANONYMOUS');
      expect(initial.confidenceScore).toBe(0.1);
      expect(initial.identifiedNeeds).toEqual([]);
      expect(initial.keyObjectionsDetected).toEqual([]);
    });

    it('transitions from ANONYMOUS to EXPLORING on first contact', () => {
      const evaluation = RevenueCloserEngine.evaluateQualification({
        leadId: 'lead-123',
        messageText: 'Hola, me gustaría información general del desarrollo.'
      });

      expect(evaluation.previousStage).toBe('ANONYMOUS');
      expect(evaluation.newStage).toBe('EXPLORING');
      expect(evaluation.totalScore).toBe(25);
    });

    it('transitions to ENGAGED when specific needs or budget tier are revealed', () => {
      const initial = RevenueCloserEngine.createInitialQualificationContext();
      const evaluation = RevenueCloserEngine.evaluateQualification({
        leadId: 'lead-123',
        messageText: 'Busco una propiedad con vista al mar para vacacionar.',
        currentContext: initial,
        signals: {
          budgetTier: 'TIER_MID',
          needs: ['vista al mar', 'uso vacacional']
        }
      });

      expect(evaluation.newStage).toBe('ENGAGED');
      expect(evaluation.totalScore).toBe(50);
      expect(evaluation.context.identifiedNeeds).toContain('vista al mar');
    });

    it('transitions to HIGH_INTENT when high budget or short horizon is confirmed', () => {
      const engagedContext = {
        ...RevenueCloserEngine.createInitialQualificationContext(),
        stage: 'ENGAGED' as const,
        identifiedNeeds: ['lote frente al mar']
      };

      const evaluation = RevenueCloserEngine.evaluateQualification({
        leadId: 'lead-123',
        messageText: 'Planeo comprar de contado en los próximos 60 días.',
        currentContext: engagedContext,
        signals: {
          budgetTier: 'TIER_PREMIUM',
          estimatedBudgetUsd: 150000,
          purchaseHorizonDays: 60
        }
      });

      expect(evaluation.newStage).toBe('HIGH_INTENT');
      expect(evaluation.totalScore).toBe(75);
      expect(evaluation.context.estimatedBudgetUsd).toBe(150000);
    });

    it('transitions to READY_TO_BOOK when meeting or calendar is requested', () => {
      const highIntentContext = {
        ...RevenueCloserEngine.createInitialQualificationContext(),
        stage: 'HIGH_INTENT' as const,
        budgetTier: 'TIER_PREMIUM' as const,
        estimatedBudgetUsd: 120000
      };

      const evaluation = RevenueCloserEngine.evaluateQualification({
        leadId: 'lead-123',
        messageText: 'Me interesa agendar una videollamada para revisar los planos y números.',
        currentContext: highIntentContext,
        signals: {
          intentToBook: true
        }
      });

      expect(evaluation.newStage).toBe('READY_TO_BOOK');
      expect(evaluation.totalScore).toBe(90);
      expect(evaluation.shouldEscalate).toBe(true);
    });

    it('immediately sets stage to DISQUALIFIED when disqualified signal is received', () => {
      const evaluation = RevenueCloserEngine.evaluateQualification({
        leadId: 'lead-123',
        messageText: 'Solo estoy haciendo un trabajo escolar, no tengo dinero.',
        signals: {
          disqualified: true
        }
      });

      expect(evaluation.newStage).toBe('DISQUALIFIED');
      expect(evaluation.totalScore).toBe(0);
      expect(evaluation.shouldEscalate).toBe(false);
    });
  });

  describe('Deterministic Attribution Engine', () => {
    const policy180Days: AttributionPolicy = {
      strategy: 'FIRST_TOUCH',
      windowDays: 180,
      conflictResolution: 'FIRST_CLAIM',
      allowBrokerOverride: false
    };

    it('resolves and seals first-touch referral record', () => {
      const result = RevenueCloserEngine.resolveAttribution({
        leadId: 'lead-456',
        incomingReferralCode: 'ref_CARLOS_M',
        incomingMedium: 'telegram',
        policy: policy180Days,
        campaignSource: 'meta_ads'
      });

      expect(result.status).toBe('RESOLVED');
      expect(result.isDeterministic).toBe(true);
      expect(result.activeRecord?.referralCode).toBe('ref_CARLOS_M');
      expect(result.policyApplied).toBe('FIRST_TOUCH');
    });

    it('protects first-touch broker from competing broker within the 180-day window', () => {
      const now = new Date();
      const existingAttribution = {
        activeRecord: {
          id: 'attr_existing_1',
          leadId: 'lead-456',
          referralCode: 'ref_CARLOS_ORIGINAL',
          medium: 'telegram' as const,
          touchTimestamp: now.toISOString(),
          expiresAt: new Date(now.getTime() + 180 * 86400 * 1000).toISOString()
        },
        history: [],
        isDeterministic: true,
        status: 'RESOLVED' as const,
        policyApplied: 'FIRST_TOUCH' as const
      };

      // Competing broker attempts touch 30 days later
      const competingResult = RevenueCloserEngine.resolveAttribution({
        leadId: 'lead-456',
        incomingReferralCode: 'ref_MARIA_COMPETING',
        incomingMedium: 'whatsapp',
        policy: policy180Days,
        existingContext: existingAttribution,
        touchTimestamp: new Date(now.getTime() + 30 * 86400 * 1000).toISOString()
      });

      // Original broker CARLOS remains protected
      expect(competingResult.activeRecord?.referralCode).toBe('ref_CARLOS_ORIGINAL');
      expect(competingResult.isDeterministic).toBe(true);
    });

    it('marks attribution as EXPIRED when outside window', () => {
      const pastDate = new Date(Date.now() - 200 * 86400 * 1000);
      const expiredAttribution = {
        activeRecord: {
          id: 'attr_old',
          leadId: 'lead-456',
          referralCode: 'ref_EXPIRED_BROKER',
          medium: 'web_landing' as const,
          touchTimestamp: pastDate.toISOString(),
          expiresAt: new Date(pastDate.getTime() + 180 * 86400 * 1000).toISOString()
        },
        history: [],
        isDeterministic: true,
        status: 'RESOLVED' as const,
        policyApplied: 'FIRST_TOUCH' as const
      };

      const result = RevenueCloserEngine.resolveAttribution({
        leadId: 'lead-456',
        incomingMedium: 'whatsapp',
        policy: policy180Days,
        existingContext: expiredAttribution
      });

      expect(result.status).toBe('EXPIRED');
      expect(result.activeRecord).toBeUndefined();
    });
  });

  describe('Next Best Action Decider', () => {
    it('proposes meeting when stage is READY_TO_BOOK', () => {
      const opportunity: RevenueOpportunity = {
        id: 'opp-1',
        leadId: 'lead-1',
        organizationId: 'org-snarai',
        stage: 'DISCOVERY',
        qualification: {
          stage: 'READY_TO_BOOK',
          confidenceScore: 0.9,
          identifiedNeeds: ['fraccion de lujo'],
          keyObjectionsDetected: [],
          evaluatedAt: new Date().toISOString()
        },
        attribution: {
          history: [],
          isDeterministic: true,
          status: 'RESOLVED',
          policyApplied: 'FIRST_TOUCH'
        },
        probabilityPercentage: 80,
        nextBestAction: 'CONTINUE_CONVERSATION',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const decision = RevenueCloserEngine.determineNextBestAction(opportunity);
      expect(decision.action).toBe('PROPOSE_MEETING');
      expect(decision.opportunityStage).toBe('COMMITTED');
    });

    it('deploys documentation when stage is HIGH_INTENT', () => {
      const opportunity: RevenueOpportunity = {
        id: 'opp-2',
        leadId: 'lead-2',
        organizationId: 'org-snarai',
        stage: 'DISCOVERY',
        qualification: {
          stage: 'HIGH_INTENT',
          confidenceScore: 0.8,
          identifiedNeeds: ['lote'],
          keyObjectionsDetected: ['certeza juridica'],
          evaluatedAt: new Date().toISOString()
        },
        attribution: {
          history: [],
          isDeterministic: false,
          status: 'UNATTRIBUTED',
          policyApplied: 'FIRST_TOUCH'
        },
        probabilityPercentage: 60,
        nextBestAction: 'CONTINUE_CONVERSATION',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const decision = RevenueCloserEngine.determineNextBestAction(opportunity);
      expect(decision.action).toBe('SEND_DOCUMENTATION');
      expect(decision.opportunityStage).toBe('QUALIFIED');
    });
  });

  describe('Executive Handoff Service', () => {
    it('compiles comprehensive handoff briefing with urgency and closing angles', () => {
      const opportunity: RevenueOpportunity = {
        id: 'opp-999',
        leadId: 'lead-999',
        organizationId: 'org-snarai',
        stage: 'COMMITTED',
        qualification: {
          stage: 'READY_TO_BOOK',
          budgetTier: 'TIER_PREMIUM',
          estimatedBudgetUsd: 100000,
          confidenceScore: 0.95,
          identifiedNeeds: ['villa vacacional', 'pool de rentas'],
          keyObjectionsDetected: ['certeza jurídica del fideicomiso'],
          evaluatedAt: new Date().toISOString()
        },
        attribution: {
          history: [],
          isDeterministic: true,
          status: 'RESOLVED',
          policyApplied: 'FIRST_TOUCH'
        },
        probabilityPercentage: 85,
        nextBestAction: 'PROPOSE_MEETING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Agnostic compilation without domain coupling
      const handoffAgnostic = RevenueCloserEngine.compileExecutiveHandoff({
        opportunity,
        leadName: 'Eduardo Garza',
        contactIdentifier: '+5213221234567',
        primaryChannel: 'whatsapp',
        assignedBrokerName: 'Carlos Mendoza (Executive Rep)',
        conversationSummary: 'Prospecto con alta liquidez y requerimientos de certeza contractual.',
        appointmentDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        meetingLink: 'https://meet.google.com/abc-defg-hij'
      });

      expect(handoffAgnostic.leadName).toBe('Eduardo Garza');
      expect(handoffAgnostic.urgency).toBe('HIGH');
      expect(handoffAgnostic.recommendedClosingAngle).toContain('certeza contractual');
      expect(handoffAgnostic.opportunity.appointmentDate).toBeDefined();

      // 2. Domain-specific angle resolution via injected resolver
      const handoffDomain = RevenueCloserEngine.compileExecutiveHandoff({
        opportunity,
        leadName: 'Eduardo Garza',
        contactIdentifier: '+5213221234567',
        primaryChannel: 'whatsapp',
        assignedBrokerName: 'Carlos Mendoza (Executive Rep)',
        conversationSummary: 'Prospecto interesado en estructura jurídica patrimonial.',
        domainClosingAngleResolver: (objections) =>
          objections.some((o) => o.toLowerCase().includes('certeza') || o.toLowerCase().includes('legal'))
            ? 'Priorizar la certeza jurídica del fideicomiso y la documentación notarial del Data Room.'
            : 'Enfoque general.'
      });
      expect(handoffDomain.recommendedClosingAngle).toContain('fideicomiso');

      const notificationText = ExecutiveHandoffService.formatHandoffNotification(handoffAgnostic);
      expect(notificationText).toContain('Eduardo Garza');
      expect(notificationText).toContain('meet.google.com');
      expect(notificationText).toContain('$100,000 USD');
    });

    it('dispatches telegram alert through sender adapter', async () => {
      const mockSender = {
        sendTelegramAlert: vi.fn().mockResolvedValue(true)
      };

      const handoff = RevenueCloserEngine.compileExecutiveHandoff({
        opportunity: {
          id: 'opp-1',
          leadId: 'lead-1',
          organizationId: 'snarai',
          stage: 'COMMITTED',
          qualification: RevenueCloserEngine.createInitialQualificationContext(),
          attribution: { history: [], isDeterministic: false, status: 'UNATTRIBUTED', policyApplied: 'FIRST_TOUCH' },
          probabilityPercentage: 70,
          nextBestAction: 'PROPOSE_MEETING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        leadName: 'Ana Silva',
        contactIdentifier: '+5215555555555',
        primaryChannel: 'whatsapp',
        conversationSummary: 'Interesada en lote campestre.'
      });

      const result = await ExecutiveHandoffService.dispatchHandoff(
        handoff,
        { channel: 'telegram_push', recipientIdentifier: '798431743' },
        mockSender
      );

      expect(result.success).toBe(true);
      expect(mockSender.sendTelegramAlert).toHaveBeenCalledWith('798431743', expect.stringContaining('Ana Silva'));
    });
  });
});

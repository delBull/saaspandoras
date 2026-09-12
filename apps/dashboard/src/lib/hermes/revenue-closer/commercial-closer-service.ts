/**
 * Hermes Revenue Closer — Commercial Closer Orchestrator Service
 * src/lib/hermes/revenue-closer/commercial-closer-service.ts
 *
 * Connects the Revenue Closer Engine, Nurture Engine, Executive Handoff Service,
 * and Real Estate Doctrine Engine into live communication channels (WhatsApp, Telegram, Web).
 *
 * Eliminates module orphanhood and guarantees commercial closing execution in production.
 */

import { RevenueCloserEngine } from './revenue-closer-engine';
import { NurtureEngine, LeadNurtureState } from './nurture-engine';
import { ExecutiveHandoffService, HandoffNotificationSender } from './executive-handoff-service';
import { 
  RealEstateDoctrineEngine, 
  ClientProjectKnowledge, 
  RealEstateObjectionCategory,
  ResolvedDoctrinalResponse
} from '../packs/real-estate-doctrine';
import { QualificationContext, QualificationEvaluation } from '../contracts/qualification';
import { NextBestAction, OpportunityStage, RevenueOpportunity } from '../contracts/opportunity';
import { ExecutiveHandoffSummary } from '../contracts/handoff';
import { NurtureActionProposal } from '../contracts/nurture';
import { HermesSoulRegistry } from '../soul/snarai-soul';

export const SNARAI_OFFICIAL_REAL_ESTATE_KNOWLEDGE: ClientProjectKnowledge = {
  developmentName: "S'Narai Riviera Nayarit",
  location: "Riviera Nayarit, México",
  legalStructure: 'FRACTIONAL_CO_OWNERSHIP',
  legalStructureDescription: "Estructura institucional Aztecas Hub con copropiedad notariada, Títulos desde $50 USD y rendimientos pro-rata.",
  developerCompany: "Aztecas Hub / Pandoras Growth OS",
  propertyTypesOffered: ['FRACTIONAL', 'CONDOMINIUM'],
  commercialStage: 'PRESALE_EARLY_BIRD',
  estimatedDeliveryDate: "Fase 1 Fundadores en ejecución activa",
  estimatedAppreciationPercentage: "12-15% anual proyectado según plusvalía de la zona",
  rentalPoolEnabled: true,
  approvedDocuments: [
    {
      title: "Data Room Legal y Registro Institucional S'Narai",
      category: 'LEGAL',
      documentUrl: "https://snarai.aztecaz.xyz/institutional/legal",
      isPublicInDataRoom: true
    },
    {
      title: "Due Diligence Financiero y Rendimientos Pro-Rata",
      category: 'FINANCIAL',
      documentUrl: "https://snarai.aztecaz.xyz/institutional/due-diligence-index",
      isPublicInDataRoom: true
    },
    {
      title: "Estatus Operativo y Avance de Proyecto S'Narai",
      category: 'PERMITS',
      documentUrl: "https://snarai.aztecaz.xyz/institutional/project-status-report",
      isPublicInDataRoom: true
    }
  ]
};

export interface CommercialCloserInput {
  tenantSlug: string;
  leadId: string;
  messageText: string;
  channel: 'whatsapp' | 'telegram' | 'web';
  leadName?: string;
  existingContext?: QualificationContext;
  nurtureState?: LeadNurtureState;
}

export interface CommercialCloserResult {
  qualification: QualificationEvaluation;
  nextBestAction: {
    action: NextBestAction;
    reason: string;
    opportunityStage: OpportunityStage;
  };
  doctrinalGuidance?: ResolvedDoctrinalResponse;
  executiveHandoff?: ExecutiveHandoffSummary;
  nurtureProposal?: NurtureActionProposal;
  recommendedCallToAction?: {
    type: 'MEETING' | 'CHECKOUT' | 'DATA_ROOM' | 'PORTAL';
    url: string;
    label: string;
  };
}

export class CommercialCloserService {
  /**
   * Evaluates inbound messages through the full Revenue Closer & Real Estate doctrine loop.
   */
  static async evaluateInbound(input: CommercialCloserInput): Promise<CommercialCloserResult> {
    const { tenantSlug, leadId, messageText, channel, leadName = 'Prospecto Interesado', existingContext } = input;
    const lower = messageText.toLowerCase();

    // 1. Detect commercial signals & objections
    const intentToBook = /agendar|cita|reuni[oó]n|llamada|zoom|calendario|hablar con|fundador|asesor|platicar/i.test(lower);
    const intentToBuy = /comprar|invertir|inversi[oó]n|adquirir|t[ií]tulo|t[ií]tulos|apartar|fondeo|fondear|cu[aá]nto cuesta|precio|ticket/i.test(lower);

    // Estimate budget tier
    let estimatedBudgetUsd: number | undefined;
    if (/\$?\s*50\b|\$?\s*100\b/i.test(lower)) estimatedBudgetUsd = 100;
    else if (/\$?\s*500\b|\$?\s*1,?000\b/i.test(lower)) estimatedBudgetUsd = 1000;
    else if (/\$?\s*5,?000\b|\$?\s*10,?000\b/i.test(lower)) estimatedBudgetUsd = 10000;
    else if (intentToBuy) estimatedBudgetUsd = 50; // minimum entry ticket for S'Narai

    // Detect Real Estate objections
    let detectedCategory: RealEstateObjectionCategory | undefined;
    const keyObjectionsDetected: string[] = [];

    if (/legal|certeza|fideicomiso|escritura|notario|registro p[uú]blico|contrato/i.test(lower)) {
      detectedCategory = 'LEGAL_CERTAINTY';
      keyObjectionsDetected.push('Certeza Jurídica y Fideicomiso');
    } else if (/plusval[ií]a|rendimiento|retorno|ganancia|roi/i.test(lower)) {
      detectedCategory = 'CAPITAL_APPRECIATION';
      keyObjectionsDetected.push('Plusvalía y Rendimiento Estimado');
    } else if (/entrega|cu[aá]ndo entregan|avance|construcci[oó]n|obra/i.test(lower)) {
      detectedCategory = 'DELIVERY_TIMELINE';
      keyObjectionsDetected.push('Plazos de Entrega y Construcción');
    } else if (/vender|liquidez|salida|mercado secundario/i.test(lower)) {
      detectedCategory = 'EXIT_LIQUIDITY';
      keyObjectionsDetected.push('Liquidez y Reventa');
    } else if (/mantenimiento|cuota|hoa/i.test(lower)) {
      detectedCategory = 'MAINTENANCE_HOA';
      keyObjectionsDetected.push('Cuota de Mantenimiento');
    }

    // 2. Resolve doctrine if real estate objection detected
    let doctrinalGuidance: ResolvedDoctrinalResponse | undefined;
    if (detectedCategory) {
      doctrinalGuidance = RealEstateDoctrineEngine.resolveObjection(
        detectedCategory,
        SNARAI_OFFICIAL_REAL_ESTATE_KNOWLEDGE
      );
    }

    // 3. Step 3 Qualification
    const needs: string[] = [];
    if (intentToBuy) needs.push('Adquisición de títulos y copropiedad');
    if (intentToBook) needs.push('Sesión estratégica con fundadores');

    const qualification = RevenueCloserEngine.evaluateQualification({
      leadId,
      messageText,
      currentContext: existingContext,
      signals: {
        intentToBook,
        estimatedBudgetUsd,
        purchaseHorizonDays: (intentToBuy || intentToBook) ? 30 : undefined,
        needs,
        objections: keyObjectionsDetected,
        decisionRole: intentToBuy ? 'SOLE_DECISION_MAKER' : undefined,
      }
    });

    // 4. Construct Opportunity snapshot
    const opportunity: RevenueOpportunity = {
      id: `opp_${tenantSlug}_${leadId.replace(/[^a-zA-Z0-9]/g, '_')}`,
      leadId,
      organizationId: tenantSlug,
      projectId: tenantSlug,
      stage: 'DISCOVERY',
      qualification: qualification.context,
      attribution: {
        isDeterministic: true,
        status: 'UNATTRIBUTED',
        policyApplied: 'FIRST_TOUCH',
        history: []
      },
      estimatedValueUsd: estimatedBudgetUsd || 50,
      probabilityPercentage: intentToBuy ? 75 : (intentToBook ? 60 : 30),
      nextBestAction: 'CONTINUE_CONVERSATION',
      notes: keyObjectionsDetected.length > 0 
        ? `Foco en: ${keyObjectionsDetected.join(', ')}`
        : (intentToBuy ? 'Interés en adquisición de títulos' : 'Exploración inicial'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      domainContext: {
        developmentSlug: tenantSlug,
        doctrineCategory: detectedCategory
      }
    };

    // 5. Determine Next Best Action
    const nextBestAction = RevenueCloserEngine.determineNextBestAction(opportunity);

    // 6. Resolve Canonical URLs & Recommended Call to Action
    const soul = HermesSoulRegistry.getSoul(tenantSlug);
    const calendarUrl = soul?.canonicalUrls?.calendar || `https://dash.pandoras.finance/events/${tenantSlug}/1`;
    const checkoutUrl = soul?.canonicalUrls?.checkout || `https://dash.pandoras.finance/pay/${tenantSlug}/fundador`;
    const portalUrl = soul?.canonicalUrls?.portal || `https://snarai.aztecaz.xyz/portal`;

    let recommendedCallToAction: CommercialCloserResult['recommendedCallToAction'];
    if (nextBestAction.action === 'PROPOSE_MEETING' || intentToBook) {
      recommendedCallToAction = {
        type: 'MEETING',
        url: calendarUrl,
        label: 'Agendar sesión estratégica con fundadores'
      };
    } else if (intentToBuy) {
      recommendedCallToAction = {
        type: 'CHECKOUT',
        url: checkoutUrl,
        label: 'Adquirir títulos en Checkout Oficial'
      };
    } else if (nextBestAction.action === 'SEND_DOCUMENTATION') {
      recommendedCallToAction = {
        type: 'DATA_ROOM',
        url: soul?.canonicalUrls?.legalDataRoom || portalUrl,
        label: 'Revisar Data Room y Documentación Oficial'
      };
    }

    // 7. Executive Handoff if high intent or booking ready
    let executiveHandoff: ExecutiveHandoffSummary | undefined;
    if (
      qualification.newStage === 'READY_TO_BOOK' || 
      qualification.newStage === 'HIGH_INTENT' || 
      qualification.newStage === 'HANDOFF_PENDING' ||
      (estimatedBudgetUsd && estimatedBudgetUsd >= 5000)
    ) {
      executiveHandoff = RevenueCloserEngine.compileExecutiveHandoff({
        opportunity,
        leadName,
        contactIdentifier: leadId,
        primaryChannel: channel,
        conversationSummary: `Mensaje de entrada: "${messageText}". Estado: ${qualification.newStage}.`,
        appointmentDate: intentToBook ? new Date(Date.now() + 86400000).toISOString() : undefined,
        meetingLink: calendarUrl,
      });
    }

    // 8. Multi-channel Nurture Trigger Check
    let nurtureProposal: NurtureActionProposal | undefined;
    if (input.nurtureState) {
      const nurtureEval = NurtureEngine.evaluateTrigger(
        {
          id: `ev_${Date.now()}`,
          leadId,
          eventType: intentToBook ? 'MEETING_NO_SHOW' : 'DOCUMENT_VIEWED',
          occurredAt: new Date().toISOString(),
          eventPayload: { channel, leadId }
        },
        input.nurtureState
      );
      if (nurtureEval.shouldTrigger && nurtureEval.proposal) {
        nurtureProposal = nurtureEval.proposal;
      }
    }

    return {
      qualification,
      nextBestAction,
      doctrinalGuidance,
      executiveHandoff,
      nurtureProposal,
      recommendedCallToAction
    };
  }

  /**
   * Dispatches an executive handoff notification if configured.
   */
  static async notifySalesTeam(
    handoff: ExecutiveHandoffSummary,
    sender?: HandoffNotificationSender
  ): Promise<void> {
    const alertChatId = process.env.HERMES_BROKER_ALERT_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
    if (alertChatId && sender?.sendTelegramAlert) {
      await ExecutiveHandoffService.dispatchHandoff(
        handoff,
        { channel: 'telegram_push', recipientIdentifier: alertChatId },
        sender
      );
    }
  }
}

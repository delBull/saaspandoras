/**
 * 🏛️ Setup Progress Engine
 * src/lib/mesh/setup-progress.service.ts
 *
 * Evaluates real-time setup completion for installed products
 * across Hermes AI, Growth OS, and Pandoras RWA.
 */

import { db } from '@/db';
import {
  projects,
  installedProducts,
  hermesKnowledge,
  telegramBindings,
  marketingLeads,
} from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';

export interface SetupChecklistItem {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  actionUrl: string;
  actionLabel: string;
}

export interface ModuleSetupState {
  productKey: 'HERMES' | 'GROWTH_OS' | 'PANDORAS_RWA';
  title: string;
  status: 'ACTIVE' | 'AVAILABLE' | 'TRIAL' | 'PENDING_CONFIG';
  progressPercentage: number;
  totalSteps: number;
  completedSteps: number;
  checklist: SetupChecklistItem[];
  primaryActionUrl: string;
  primaryActionLabel: string;
}

export interface EcosystemSetupSummary {
  organizationSlug: string;
  overallPercentage: number;
  totalActiveModules: number;
  completedModules: number;
  modules: ModuleSetupState[];
}

export class SetupProgressService {
  constructor(private readonly customDb?: any) {}

  private get db() {
    return this.customDb || db;
  }

  /**
   * Evaluates setup completion for a specific tenant organization
   */
  async getEcosystemSetupState(organizationSlug: string): Promise<EcosystemSetupSummary> {
    const cleanSlug = organizationSlug.toLowerCase().trim();

    // 1. Fetch Project Identity
    const project = await this.db
      .select()
      .from(projects)
      .where(eq(projects.slug, cleanSlug))
      .limit(1)
      .then((rows: any[]) => rows[0]);

    if (!project) {
      return {
        organizationSlug: cleanSlug,
        overallPercentage: 0,
        totalActiveModules: 0,
        completedModules: 0,
        modules: [],
      };
    }

    const projectId = project.id;

    // 2. Fetch Installed Products
    const installed = await this.db
      .select()
      .from(installedProducts)
      .where(eq(installedProducts.projectId, projectId));

    const hermesProd = installed.find((p: any) => p.productFamily === 'HERMES');
    const growthProd = installed.find((p: any) => p.productFamily === 'GROWTH_OS');
    const rwaProd = installed.find((p: any) => p.productFamily === 'CAPITAL');

    // 3. Parallel Database Signals Gathering
    const [knowledgeCountRes, telegramBindingsRes, leadsCountRes] = await Promise.allSettled([
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(hermesKnowledge)
        .where(
          or(
            eq(hermesKnowledge.organizationId, cleanSlug),
            eq(hermesKnowledge.organizationId, `org_${cleanSlug}`)
          )
        ),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(telegramBindings)
        .where(
          project.applicantWalletAddress
            ? eq(telegramBindings.walletAddress, project.applicantWalletAddress.toLowerCase())
            : sql`false`
        ),
      this.db
        .select({ count: sql<number>`count(*)::int` })
        .from(marketingLeads)
        .where(eq(marketingLeads.projectId, projectId)),
    ]);

    const hasKnowledge =
      knowledgeCountRes.status === 'fulfilled' && (knowledgeCountRes.value[0]?.count || 0) > 0;
    const hasTelegramBot =
      telegramBindingsRes.status === 'fulfilled' && (telegramBindingsRes.value[0]?.count || 0) > 0;
    const hasLeads =
      leadsCountRes.status === 'fulfilled' && (leadsCountRes.value[0]?.count || 0) > 0;

    const extra = typeof project.extraConfig === 'object' && project.extraConfig !== null
      ? (project.extraConfig as Record<string, any>)
      : {};

    // ── HERMES AI MODULE SETUP STATE ──
    const hermesChecklist: SetupChecklistItem[] = [
      {
        id: 'hermes-vault',
        title: 'Sovereign Knowledge Vault (K25)',
        description: 'Documentos institucionales y políticas ancladas en IPFS.',
        isCompleted: hasKnowledge,
        actionUrl: `/portal/${cleanSlug}/knowledge`,
        actionLabel: 'Cargar Documento',
      },
      {
        id: 'hermes-telegram',
        title: 'Canal Conversacional Telegram',
        description: 'Bot oficial vinculado con webhook y verificación de firma.',
        isCompleted: hasTelegramBot,
        actionUrl: `/portal/${cleanSlug}/overview`,
        actionLabel: 'Vincular Bot',
      },
      {
        id: 'hermes-persona',
        title: 'Business Persona & Prompt',
        description: 'Identidad corporativa y directivas operativas del agente.',
        isCompleted: Boolean(hermesProd?.config && Object.keys(hermesProd.config).length > 1),
        actionUrl: `/portal/${cleanSlug}/settings`,
        actionLabel: 'Configurar Persona',
      },
      {
        id: 'hermes-widget',
        title: 'Web Widget Interactivo',
        description: 'Incrustación del asistente en tu sitio web corporativo.',
        isCompleted: Boolean(project.website || extra.widgetEnabled),
        actionUrl: `/portal/${cleanSlug}/widget`,
        actionLabel: 'Obtener Código',
      },
    ];

    const hermesCompleted = hermesChecklist.filter((c) => c.isCompleted).length;
    const hermesStatus = hermesProd ? (hermesProd.status === 'active' ? 'ACTIVE' : 'TRIAL') : 'AVAILABLE';
    const hermesState: ModuleSetupState = {
      productKey: 'HERMES',
      title: 'Hermes AI OS',
      status: hermesStatus,
      progressPercentage: hermesStatus === 'AVAILABLE' ? 0 : Math.round((hermesCompleted / hermesChecklist.length) * 100),
      totalSteps: hermesChecklist.length,
      completedSteps: hermesCompleted,
      checklist: hermesChecklist,
      primaryActionUrl: `/portal/${cleanSlug}`,
      primaryActionLabel: hermesStatus === 'AVAILABLE' ? 'Activar Hermes AI' : 'Abrir Hermes Portal',
    };

    // ── GROWTH OS MODULE SETUP STATE ──
    const growthChecklist: SetupChecklistItem[] = [
      {
        id: 'growth-crm',
        title: 'Pipeline CRM de Inversores',
        description: 'Registro y cualificación de prospectos en el embudo comercial.',
        isCompleted: hasLeads,
        actionUrl: `/growth-os/organizations/${cleanSlug}/crm`,
        actionLabel: 'Ver Pipeline',
      },
      {
        id: 'growth-email',
        title: 'Email Marketing Institucional',
        description: 'Plantillas y remitente de correos configurados para la organización.',
        isCompleted: Boolean(project.applicantEmail || extra.emailSenderConfigured),
        actionUrl: `/growth-os/organizations/${cleanSlug}/email`,
        actionLabel: 'Configurar Email',
      },
      {
        id: 'growth-treasury',
        title: 'Tesorería Soberana (Safe Vault)',
        description: 'Billetera multi-firma o contrato de tesorería vinculado.',
        isCompleted: Boolean(project.treasuryAddress),
        actionUrl: `/growth-os/organizations/${cleanSlug}/finance`,
        actionLabel: 'Asignar Safe',
      },
      {
        id: 'growth-nft',
        title: 'Pases de Acceso & VIP NFTs',
        description: 'Contratos ERC-721 para membresías y tiers de inversores.',
        isCompleted: Boolean(project.contractAddress || extra.nftPassConfigured),
        actionUrl: `/growth-os/organizations/${cleanSlug}/nft`,
        actionLabel: 'Crear Pase VIP',
      },
    ];

    const growthCompleted = growthChecklist.filter((c) => c.isCompleted).length;
    const growthStatus = growthProd ? (growthProd.status === 'active' ? 'ACTIVE' : 'TRIAL') : 'AVAILABLE';
    const growthState: ModuleSetupState = {
      productKey: 'GROWTH_OS',
      title: 'Growth OS Commercial Engine',
      status: growthStatus,
      progressPercentage: growthStatus === 'AVAILABLE' ? 0 : Math.round((growthCompleted / growthChecklist.length) * 100),
      totalSteps: growthChecklist.length,
      completedSteps: growthCompleted,
      checklist: growthChecklist,
      primaryActionUrl: `/growth-os/organizations/${cleanSlug}`,
      primaryActionLabel: growthStatus === 'AVAILABLE' ? 'Activar Growth OS' : 'Abrir Growth Console',
    };

    // ── PANDORAS RWA MODULE SETUP STATE ──
    const rwaChecklist: SetupChecklistItem[] = [
      {
        id: 'rwa-contract',
        title: 'Smart Contract en Red Base',
        description: 'Contrato de tokenización de activo real desplegado y verificado.',
        isCompleted: Boolean(project.contractAddress),
        actionUrl: `/profile/projects/${cleanSlug}/manage`,
        actionLabel: 'Verificar Contrato',
      },
      {
        id: 'rwa-tokenomics',
        title: 'Valuación & Tokenomics',
        description: 'Definición de precio del token, objetivo de recaudación y APY estimado.',
        isCompleted: Boolean(Number(project.targetAmount || project.totalValuationUsd || 0) > 0),
        actionUrl: `/profile/projects/${cleanSlug}/manage`,
        actionLabel: 'Configurar Fases',
      },
      {
        id: 'rwa-governance',
        title: 'Gobernanza DAO (Asamblea)',
        description: 'Contrato de gobernador y reglas de votación para tenedores.',
        isCompleted: Boolean(project.governorContractAddress),
        actionUrl: `/profile/projects/${cleanSlug}/manage`,
        actionLabel: 'Activar DAO',
      },
      {
        id: 'rwa-compliance',
        title: 'Legal & Risk Assessment Pack',
        description: 'Documentos de due diligence y estructura fiduciaria respaldada.',
        isCompleted: Boolean(project.valuationDocumentUrl || project.dueDiligenceReportUrl),
        actionUrl: `/profile/projects/${cleanSlug}/manage`,
        actionLabel: 'Cargar Dictamen',
      },
    ];

    const rwaCompleted = rwaChecklist.filter((c) => c.isCompleted).length;
    const rwaStatus = rwaProd ? (rwaProd.status === 'active' ? 'ACTIVE' : 'TRIAL') : (project.contractAddress ? 'ACTIVE' : 'AVAILABLE');
    const rwaState: ModuleSetupState = {
      productKey: 'PANDORAS_RWA',
      title: 'Pandoras Protocol & RWA',
      status: rwaStatus,
      progressPercentage: rwaStatus === 'AVAILABLE' ? 0 : Math.round((rwaCompleted / rwaChecklist.length) * 100),
      totalSteps: rwaChecklist.length,
      completedSteps: rwaCompleted,
      checklist: rwaChecklist,
      primaryActionUrl: `/profile/projects/${cleanSlug}/manage`,
      primaryActionLabel: rwaStatus === 'AVAILABLE' ? 'Activar RWA' : 'Gestionar Protocolo',
    };

    const modules = [hermesState, growthState, rwaState];
    const activeModules = modules.filter((m) => m.status !== 'AVAILABLE');
    const totalActive = activeModules.length;

    const overallPercentage = totalActive > 0
      ? Math.round(activeModules.reduce((acc, m) => acc + m.progressPercentage, 0) / totalActive)
      : 0;

    const completedModules = activeModules.filter((m) => m.progressPercentage === 100).length;

    return {
      organizationSlug: cleanSlug,
      overallPercentage,
      totalActiveModules: totalActive,
      completedModules,
      modules,
    };
  }
}

export const setupProgressService = new SetupProgressService();

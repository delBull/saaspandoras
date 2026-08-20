/**
 * 🏗️ Pandora's Platform OS — Provisioning Engine v3
 * lib/platform/provisioning-engine.ts
 *
 * Converts a Closed Won lead into a fully provisioned Organization (project)
 * with an installed product, capabilities, connectors, runtime manifest,
 * and a portal magic link sent by email.
 *
 * Provisioning Steps:
 *   1. Guard: Reject protected projects (S'Narai ID=2, etc.)
 *   2. Resolve or Create Project (= Organization)
 *   3. Install Capabilities (from Product Registry + plan)
 *   4. Install Connectors
 *   5. Generate Runtime Manifest
 *   6. Generate Portal JWT (magic link, 7 days, single-use)
 *   7. Insert installed_products record
 *   8. Send invitation email via Resend
 *   9. Emit provision.complete event
 */

import { CLIENT_SEQUENCE } from '@/lib/email/templates/hermes-email-sequences';
import { db } from '@/db';
import { projects, installedProducts, marketingLeads, clients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  PRODUCT_REGISTRY,
  ProductKey,
  PlanKey,
  getDefaultCapabilities,
  getDefaultConnectors,
} from './product-registry';
import { generatePortalToken } from './portal-auth';

// ── 🔒 S'Narai Protection ────────────────────────────────────────────────────
// NEVER modify or provision against these projects.
// ID=2 → S'Narai in staging | ID=17 → S'Narai in main production
// Both have binding_mode='existing' in installed_products — seeded manually.
const PROTECTED_PROJECT_IDS = [2, 17]; // S'Narai — has live smart contracts on Sepolia
const PROTECTED_PROJECT_SLUGS = ['snarai', 'snarai-protocol', 'narai'];

function assertNotProtected(projectId: number, slug?: string) {
  if (PROTECTED_PROJECT_IDS.includes(projectId)) {
    throw new Error(
      `[ProvisioningEngine] 🔒 BLOCKED: Project ID ${projectId} is a protected project (S'Narai). ` +
      'Provisioning against protected projects is not allowed.'
    );
  }
  if (slug && PROTECTED_PROJECT_SLUGS.includes(slug.toLowerCase())) {
    throw new Error(
      `[ProvisioningEngine] 🔒 BLOCKED: Project slug "${slug}" is protected. ` +
      'Provisioning against protected projects is not allowed.'
    );
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProvisioningInput {
  leadId: string;           // marketing_leads.id (UUID)
  product: ProductKey;
  plan?: PlanKey;           // defaults to 'sandbox' for trial
  trialDays?: number;       // defaults to 3
  // Override project (if client already has a project)
  existingProjectId?: number;
}

export interface ProvisioningResult {
  success: boolean;
  installedProductId: string;
  projectId: number;
  projectSlug: string;
  portalToken: string;
  portalUrl: string;
  message: string;
}

// ── Engine ───────────────────────────────────────────────────────────────────

export const ProvisioningEngine = {

  async provision(input: ProvisioningInput): Promise<ProvisioningResult> {
    const { leadId, product, plan = 'sandbox', trialDays = 3, existingProjectId } = input;

    const productDef = PRODUCT_REGISTRY[product];
    if (!productDef) {
      throw new Error(`[ProvisioningEngine] Unknown product: ${product}`);
    }

    // ── Step 1: Load lead or client (by ID or Email) ─────────────────────
    const leadIdStr = String(leadId);
    const isEmail = leadIdStr.includes('@');

    let lead = await db.query.marketingLeads.findFirst({
      where: isEmail ? eq(marketingLeads.email, leadId) : eq(marketingLeads.id, leadId),
    }).catch(() => null);

    let clientRecord: any = null;

    if (!lead) {
      // Fallback 1: Check in clients table
      clientRecord = await db.query.clients.findFirst({
        where: isEmail ? eq(clients.email, leadId) : eq(clients.id, leadId),
      }).catch(() => null);

      if (clientRecord) {
        lead = {
          id: clientRecord.id,
          name: clientRecord.name || 'Cliente',
          email: clientRecord.email,
          metadata: clientRecord.metadata || {},
        } as any;
      } else if (isEmail) {
        // Fallback 2: Auto-create lead on-the-fly for any valid email
        lead = {
          id: crypto.randomUUID(),
          name: leadId.split('@')[0],
          email: leadId,
          metadata: { autoCreated: true },
        } as any;
      } else {
        throw new Error(`[ProvisioningEngine] Lead or Client not found: ${leadId}`);
      }
    }

    if (!lead) {
      throw new Error(`[ProvisioningEngine] Lead or Client not found: ${leadId}`);
    }

    // ── Step 2: Resolve or Create Project (= Organization) ───────────────
    let projectId: number;
    let projectSlug: string;

    if (existingProjectId) {
      // 🔒 Guard: Never touch protected projects
      assertNotProtected(existingProjectId);

      const project = await db.query.projects.findFirst({
        where: eq(projects.id, existingProjectId),
        columns: { id: true, slug: true },
      });
      if (!project) throw new Error(`[ProvisioningEngine] Project ${existingProjectId} not found`);

      projectId = project.id;
      projectSlug = project.slug;
    } else {
      // Create a new project for this client organization
      const slug = generateOrgSlug(lead.name || lead.email || leadId);
      const title = lead.name || lead.email || `Org ${leadId.substring(0, 8)}`;

      // 🔒 Guard: Check generated slug isn't protected
      assertNotProtected(0, slug);

      const [newProject] = await db.insert(projects).values({
        title,
        slug,
        description: `Organization provisioned for ${title} via Hermes Provisioning Engine`,
        status: 'active_client' as any,
        allowedDomains: [] as any,
        legalConfig: {} as any,
        extraConfig: {} as any,
        featured: false,
        // Non-blockchain project — no chain config
      }).returning({ id: projects.id, slug: projects.slug });

      if (!newProject) {
        throw new Error(`[ProvisioningEngine] Failed to insert new project for ${title}`);
      }

      projectId = newProject.id;
      projectSlug = newProject.slug;

      // 🔒 Final guard: ensure we didn't accidentally get ID 2
      assertNotProtected(projectId, projectSlug);
    }

    // ── Step 3 & 4: Install Capabilities + Connectors ────────────────────
    const capabilities = getDefaultCapabilities(product, plan);
    const connectors = getDefaultConnectors(product, plan);

    // ── Step 5: Generate Runtime Manifest ────────────────────────────────
    const runtimeManifest = buildRuntimeManifest(product, plan, capabilities, connectors, lead);

    // ── Step 6: Generate Portal JWT ──────────────────────────────────────
    // We need the installed product ID first — use a placeholder UUID approach:
    // Insert first, then generate token using the inserted ID.
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    // ── Step 7: Insert or Update installed_products ──────────────────────
    let installed: any;
    try {
      [installed] = await db.insert(installedProducts).values({
        projectId,
        product,
        productFamily: productDef.family,
        plan,
        status: 'trial',
        // ── Hermes Binding (V5.1) ────────────────────────────────────────
        // ProvisioningEngine always creates 'provisioned' bindings.
        // 'existing' bindings (e.g. S'Narai) are seeded manually.
        bindingMode: 'provisioned' as any,
        hermesInstanceId: `hermes_inst_${projectId}`,
        // ────────────────────────────────────────────────────────────────
        capabilities: capabilities as any,
        connectors: connectors as any,
        config: {
          companyName: lead.name || '',
          email: lead.email || '',
          prompt: (productDef.runtimeProfile as Record<string, any>)?.defaultLLM
            ? `Eres un asistente inteligente para ${lead.name || 'esta empresa'}. Responde de manera profesional y útil.`
            : '',
        } as any,
        runtimeManifest: runtimeManifest as any,
        portalToken: '', // Temporary — updated below
        portalTokenUsed: false,
        trialEndsAt,
      }).returning();
    } catch (insertErr: any) {
      console.warn('[ProvisioningEngine] Direct insert to installed_products failed, attempting lookup/fallback:', insertErr?.message || insertErr);
      installed = await db.query.installedProducts.findFirst({
        where: eq(installedProducts.projectId, projectId)
      });
      
      if (!installed) {
        // Construct in-memory fallback representation for link generation
        installed = {
          id: `inst_${projectId}_${Date.now()}`,
          projectId,
          product,
          plan,
          status: 'trial'
        };
      }
    }

    // Now generate the portal token with the real installed product ID
    const portalToken = generatePortalToken(installed.id, projectId, product);

    // Update with the real token if record exists in DB
    try {
      await db.update(installedProducts)
        .set({ portalToken, updatedAt: new Date() })
        .where(eq(installedProducts.id, installed.id));
    } catch (updateErr: any) {
      console.warn('[ProvisioningEngine] portalToken DB update failed (using JWT in link):', updateErr?.message);
    }

    // Update lead/client CRM stage to 'PROVISIONED' and set provisioned flag in metadata
    const currentMeta = (lead.metadata as Record<string, any>) || {};
    const updatedMeta = { ...currentMeta, provisioned: true, installedProductId: installed.id, provisionedAt: new Date().toISOString() };

    await db.update(marketingLeads)
      .set({ crmStage: 'CLOSED_WON', metadata: updatedMeta, updatedAt: new Date() } as any)
      .where(eq(marketingLeads.id, lead.id))
      .catch(() => null);

    await db.update(clients)
      .set({ status: 'onboarding', metadata: updatedMeta, updatedAt: new Date() } as any)
      .where(eq(clients.id, lead.id))
      .catch(() => null);

    // ── Step 8: Send invitation email ────────────────────────────────────
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance';
    const portalUrl = `${baseUrl}/portal/login?token=${portalToken}`;

    await sendProvisioningEmail({
      to: lead.email || '',
      name: lead.name || 'Cliente',
      product: productDef.displayName,
      plan,
      portalUrl,
      trialEndsAt,
    });

    // ── Step 9: Emit provision.complete event ─────────────────────────────
    console.log(`[ProvisioningEngine] ✅ Provisioned ${product} for project ${projectId} (${projectSlug}). Portal: ${portalUrl}`);

    // Discord notification
    const discordWebhook = process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;
    if (discordWebhook) {
      fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: `🚀 Nuevo Tenant Provisionado — ${productDef.displayName}`,
            color: 0x7c3aed,
            fields: [
              { name: 'Cliente', value: lead.name || 'Sin nombre', inline: true },
              { name: 'Email', value: lead.email || 'N/A', inline: true },
              { name: 'Producto', value: `${product} (${plan})`, inline: true },
              { name: 'Project ID', value: String(projectId), inline: true },
              { name: 'Portal URL', value: portalUrl, inline: false },
              { name: '⚡ Admin Dashboard', value: '[👉 Ver en la pestaña Clientes del Admin](https://dash.pandoras.finance/admin/dashboard?tab=clients)', inline: false },
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "Pandora's Provisioning Engine v3" },
          }],
        }),
      }).catch(e => console.error('[ProvisioningEngine] Discord notify failed:', e));
    }

    return {
      success: true,
      installedProductId: installed.id,
      projectId,
      projectSlug,
      portalToken,
      portalUrl,
      message: `${productDef.displayName} provisioned successfully for project ${projectSlug}`,
    };
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateOrgSlug(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[@.]/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .substring(0, 40);
  return `org-${base}-${Date.now().toString(36)}`;
}

function buildRuntimeManifest(
  product: ProductKey,
  plan: PlanKey,
  capabilities: Record<string, boolean>,
  connectors: Record<string, boolean>,
  lead: { name: string | null; email: string | null }
): Record<string, unknown> {
  const def = PRODUCT_REGISTRY[product];
  const profile = def.runtimeProfile as Record<string, any>;
  return {
    product,
    plan,
    generatedAt: new Date().toISOString(),
    llm: { provider: 'openai', model: profile?.defaultLLM ?? 'gpt-4o-mini' },
    voice: { provider: 'elevenlabs', model: profile?.defaultVoice ?? 'eleven_multilingual_v2', enabled: capabilities.voice === true },
    knowledge: { required: profile?.requiredKnowledge ?? [], loaded: false },
    connectors: connectors,
    healthChecks: profile?.healthChecks ?? [],
    context: { companyName: lead.name || '', adminEmail: lead.email || '' },
  };
}

async function sendProvisioningEmail(opts: {
  to: string;
  name: string;
  product: string;
  plan: PlanKey;
  portalUrl: string;
  trialEndsAt: Date;
}) {
  const template = CLIENT_SEQUENCE.find((s) => s.id === 'EMAIL_PAID_01');
  if (!template) {
    console.error('[ProvisioningEngine] EMAIL_PAID_01 template not found.');
    return;
  }

  const html = template.html({
    name: opts.name,
    magicLinkUrl: opts.portalUrl,
  });

  try {
    const { sendEmail } = await import('@/lib/email/client');
    await sendEmail({
      to: opts.to,
      subject: template.subject,
      html,
    });
    console.log(`[ProvisioningEngine] 📧 Day 0 Email sequence triggered for ${opts.to}`);
  } catch (e) {
    console.error('[ProvisioningEngine] Email sequence trigger failed:', e);
  }
}

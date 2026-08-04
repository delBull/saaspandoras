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
const PROTECTED_PROJECT_IDS = [2]; // S'Narai — has live smart contracts on Sepolia
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
  trialDays?: number;       // defaults to 14
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
    const { leadId, product, plan = 'sandbox', trialDays = 14, existingProjectId } = input;

    const productDef = PRODUCT_REGISTRY[product];
    if (!productDef) {
      throw new Error(`[ProvisioningEngine] Unknown product: ${product}`);
    }

    // ── Step 1: Load lead or client (by ID or Email) ─────────────────────
    const isEmail = leadId.includes('@');

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
    const portalUrl = `${baseUrl}/portal?token=${portalToken}`;

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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !opts.to) return;

  const trialEnd = opts.trialEndsAt.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Pandora's Platform OS <hello@pandoras.finance>`,
      to: [opts.to],
      subject: `Tu acceso a ${opts.product} está listo`,
      html: `<!DOCTYPE html><html><body style="background:#08080C;color:#fff;font-family:Helvetica,sans-serif;padding:40px;">
        <div style="max-width:520px;margin:0 auto;background:#0F0F18;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:36px;">
          <img src="https://dash.pandoras.finance/apple-touch-icon.png" width="40" style="margin-bottom:16px;border-radius:8px;"/>
          <h2 style="margin:0 0 8px;font-size:22px;">Hola, ${opts.name}</h2>
          <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.7;">
            Tu acceso a <strong style="color:#a78bfa;">${opts.product}</strong> (Plan ${opts.plan}) ha sido activado.<br/>
            Tu período de prueba finaliza el <strong>${trialEnd}</strong>.
          </p>
          <a href="${opts.portalUrl}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">
            Acceder a tu Portal →
          </a>
          <p style="color:rgba(255,255,255,0.3);font-size:11px;margin-top:24px;">
            Este enlace es de un solo uso y expira en 7 días. Después de tu primer acceso, tu sesión se mantiene activa 30 días.
          </p>
        </div>
      </body></html>`,
    }),
  }).catch(e => console.error('[ProvisioningEngine] Email send failed:', e));
}

import { db } from '@/db';
import { projects, installedProducts, portalOnboardingState } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { generatePortalToken } from './portal-auth';

export interface BootstrapResult {
  projectId: number;
  projectSlug: string;
  installedProductId: string;
  isNew: boolean;
  portalToken: string;
}

/**
 * Ensures an initial workspace (Tenant/Organization) exists for a user.
 * Idempotent: If it exists, returns it. If not, bootstraps a 'draft' one.
 * Separates "Hermes Bootstrap" from "Commercial Purchase".
 */
export async function ensureInitialWorkspace(email: string): Promise<BootstrapResult> {
  const cleanEmail = email.trim().toLowerCase();
  // Safe slug logic
  const emailPrefix = cleanEmail.replace(/[^a-z0-9]/g, '-');
  const slugTarget = `workspace-${emailPrefix}`.substring(0, 100);

  // 1. Check for existing workspace
  const existingProject = await db.query.projects.findFirst({
    where: eq(projects.slug, slugTarget)
  });

  if (existingProject) {
    // Workspace exists. Ensure it has Hermes bootstrap installation.
    let installed = await db.query.installedProducts.findFirst({
      where: and(
        eq(installedProducts.projectId, existingProject.id),
        eq(installedProducts.product, 'HERMES')
      )
    });

    if (!installed) {
      const inserted = await db.insert(installedProducts).values({
        projectId: existingProject.id,
        product: 'HERMES',
        productFamily: 'GROWTH_OS',
        plan: 'bootstrap', // Non-commercial tier
        status: 'trial',
        bindingMode: 'provisioned' as any,
        hermesInstanceId: `hermes_inst_${existingProject.id}`,
        capabilities: { intelligence: true, knowledge: true, channels: true } as any,
        connectors: {} as any,
        config: {
          email: cleanEmail,
          companyName: existingProject.title || 'Workspace'
        } as any,
        runtimeManifest: {
          context: {
            adminEmail: cleanEmail
          }
        } as any,
        portalToken: '',
        portalTokenUsed: false,
      }).returning();
      
      if (!inserted || inserted.length === 0) {
        throw new Error("Failed to insert installed product");
      }
      installed = inserted[0];
    }

    const token = generatePortalToken(installed!.id, existingProject.id, 'HERMES');
    return {
      projectId: existingProject.id,
      projectSlug: existingProject.slug,
      installedProductId: installed!.id,
      isNew: false,
      portalToken: token
    };
  }

  // 2. Provision new Bootstrap Workspace sequentially (Neon HTTP compatible)
  const raceCheck = await db.query.projects.findFirst({
    where: eq(projects.slug, slugTarget)
  });
  if (raceCheck) {
    throw new Error("Workspace created concurrently. Please retry.");
  }

  // Create the organization/tenant record
  const insertedProject = await db.insert(projects).values({
    title: "Workspace en configuración",
    slug: slugTarget,
    description: `Auto-provisioned workspace for ${cleanEmail}`,
    applicantEmail: cleanEmail,
    status: 'draft' as any, // DRAFT maps to ONBOARDING
    allowedDomains: [] as any,
    legalConfig: {} as any,
    extraConfig: {} as any,
    featured: false,
  }).returning();
  
  const newProject = insertedProject[0];
  if (!newProject) throw new Error("Failed to insert new project");

  // Create Bootstrap Installation (NOT a commercial subscription)
  const insertedInstall = await db.insert(installedProducts).values({
    projectId: newProject.id,
    product: 'HERMES',
    productFamily: 'GROWTH_OS',
    plan: 'bootstrap', 
    status: 'trial',
    bindingMode: 'provisioned' as any,
    hermesInstanceId: `hermes_inst_${newProject.id}`,
    capabilities: { intelligence: true, knowledge: true, channels: false } as any, // Channels locked until onboarding is done
    connectors: {} as any,
    config: {
      email: cleanEmail,
      companyName: 'Workspace'
    } as any,
    runtimeManifest: {
      context: {
        adminEmail: cleanEmail
      }
    } as any,
    portalToken: '',
    portalTokenUsed: false,
  }).returning();
  
  const newInstall = insertedInstall[0];
  if (!newInstall) throw new Error("Failed to insert new install");

  // Initialize Onboarding State
  await db.insert(portalOnboardingState).values({
    tenantId: newProject.id.toString(),
    stage: 'BUSINESS_DISCOVERY',
    contextData: { 
      ownerEmail: cleanEmail,
      startedAt: new Date().toISOString()
    },
    updatedAt: new Date()
  } as any);

  const token = generatePortalToken(newInstall.id, newProject.id, 'HERMES');
  
  return {
    projectId: newProject.id,
    projectSlug: newProject.slug,
    installedProductId: newInstall.id,
    isNew: true,
    portalToken: token
  };
}

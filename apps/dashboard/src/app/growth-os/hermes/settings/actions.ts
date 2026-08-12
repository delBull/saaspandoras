'use server';

import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getHermesConfig(projectSlug: string) {
  const projectRecord = await db.query.projects.findFirst({
    where: eq(projects.slug, projectSlug)
  });

  if (!projectRecord) {
    throw new Error('Project not found');
  }

  const config = (projectRecord.tenantRuntimeConfig as Record<string, any>) || {};
  return config.domainPack || config.knowledgePack || null;
}

export async function saveHermesConfig(projectSlug: string, formData: any) {
  const projectRecord = await db.query.projects.findFirst({
    where: eq(projects.slug, projectSlug)
  });

  if (!projectRecord) {
    throw new Error('Project not found');
  }

  const currentConfig = (projectRecord.tenantRuntimeConfig as Record<string, any>) || {};
  
  // Create or update the domain pack
  const currentDomainPack = currentConfig.domainPack || {};
  
  const updatedDomainPack = {
    ...currentDomainPack,
    id: `${projectSlug}_domain_pack`,
    name: `${formData.companyName} Domain Pack`,
    version: currentDomainPack.version || '1.0.0',
    soul: {
      ...(currentDomainPack.soul || {}),
      agentName: formData.agentName || 'Hermes',
      proactivity: {
        ...(currentDomainPack.soul?.proactivity || {})
      }
    },
    knowledgeDef: {
      ...(currentDomainPack.knowledgeDef || {}),
      companyName: formData.companyName,
      industry: formData.industry,
      systemInstructions: formData.systemInstructions, // Add to manifest for easy access
      salesPitch: formData.salesPitch
    },
    evidenceLayer: formData.evidenceLayer || currentDomainPack.evidenceLayer || []
  };

  const updatedConfig = {
    ...currentConfig,
    domainPack: updatedDomainPack
  };

  await db.update(projects)
    .set({ tenantRuntimeConfig: updatedConfig })
    .where(eq(projects.slug, projectSlug));

  revalidatePath(`/growth-os/hermes/settings`);
  return { success: true };
}

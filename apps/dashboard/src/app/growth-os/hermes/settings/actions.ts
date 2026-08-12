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
  return config.knowledgePack || null;
}

export async function saveHermesConfig(projectSlug: string, formData: any) {
  const projectRecord = await db.query.projects.findFirst({
    where: eq(projects.slug, projectSlug)
  });

  if (!projectRecord) {
    throw new Error('Project not found');
  }

  const currentConfig = (projectRecord.tenantRuntimeConfig as Record<string, any>) || {};
  
  const updatedConfig = {
    ...currentConfig,
    knowledgePack: {
      ...(currentConfig.knowledgePack || {}),
      id: `${projectSlug}_pack_v1`,
      name: `${formData.companyName} Knowledge Pack`,
      version: '1.0.0',
      industry: formData.industry,
      systemInstructions: formData.systemInstructions,
      salesPitch: formData.salesPitch,
      publicKnowledge: {
        title: formData.companyName,
        summary: formData.salesPitch,
        pricingDetails: {},
        faqs: []
      },
      objectionRules: []
    }
  };

  await db.update(projects)
    .set({ tenantRuntimeConfig: updatedConfig })
    .where(eq(projects.slug, projectSlug));

  revalidatePath(`/growth-os/hermes/settings`);
  return { success: true };
}

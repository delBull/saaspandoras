'use server';

import { ProjectRepository } from '@/lib/domain/project-repository';
import { revalidatePath } from 'next/cache';

export async function getHermesConfig(projectSlug: string) {
  const projectRecord = await ProjectRepository.findBySlug(projectSlug);

  if (!projectRecord) {
    throw new Error('Project not found');
  }

  const config = (projectRecord.tenantRuntimeConfig as Record<string, any>) || {};
  return config.domainPack || config.knowledgePack || null;
}

export async function saveHermesConfig(projectSlug: string, formData: any) {
  const projectRecord = await ProjectRepository.findBySlug(projectSlug);

  if (!projectRecord) {
    throw new Error('Project not found');
  }

  const currentConfig = (projectRecord.tenantRuntimeConfig as Record<string, any>) || {};
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
      systemInstructions: formData.systemInstructions,
      salesPitch: formData.salesPitch
    },
    evidenceLayer: formData.evidenceLayer || currentDomainPack.evidenceLayer || []
  };

  const updatedConfig = {
    ...currentConfig,
    domainPack: updatedDomainPack
  };

  await ProjectRepository.updateTenantRuntimeConfig(projectSlug, updatedConfig);

  revalidatePath(`/growth-os/hermes/settings`);
  return { success: true };
}

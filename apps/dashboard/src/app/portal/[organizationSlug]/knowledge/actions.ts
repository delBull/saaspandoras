'use server';

import { revalidatePath } from 'next/cache';
import { DashApi } from '@/lib/dash-api';

import type { KnowledgeSourceView, AddKnowledgeSourceRequestDTO, AddKnowledgeSourceResponseDTO } from '@saasfly/shared';

export async function addKnowledgeAction(
  organizationSlug: string, 
  type: KnowledgeSourceView['type'], 
  content: string, 
  title: string
): Promise<AddKnowledgeSourceResponseDTO> {
  const mappedType: AddKnowledgeSourceRequestDTO['type'] = 
    type === 'URL' ? 'URL' : type === 'DOCUMENT' ? 'DOCUMENT' : 'TEXT';

  const result: AddKnowledgeSourceResponseDTO = await DashApi.knowledge.addSource({ 
    type: mappedType, 
    title, 
    content 
  });
  revalidatePath(`/portal/${organizationSlug}/knowledge`);
  return result;
}

export async function approveKnowledgeFact(organizationSlug: string, factId: string) {
  await DashApi.knowledge.updateFactStatus(factId, 'ACTIVE');
  revalidatePath(`/portal/${organizationSlug}/knowledge`);
}

export async function rejectKnowledgeFact(organizationSlug: string, factId: string) {
  await DashApi.knowledge.updateFactStatus(factId, 'REJECTED');
  revalidatePath(`/portal/${organizationSlug}/knowledge`);
}

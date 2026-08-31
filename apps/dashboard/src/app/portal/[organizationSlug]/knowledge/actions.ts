'use server';

import { revalidatePath } from 'next/cache';
import { DashApi } from '@/lib/dash-api';

export async function addKnowledgeAction(organizationSlug: string, type: any, content: string, title: string) {
  await DashApi.knowledge.addSource({ type, title, content });
  revalidatePath(`/portal/${organizationSlug}/knowledge`);
}

export async function approveKnowledgeFact(organizationSlug: string, factId: string) {
  await DashApi.knowledge.updateFactStatus(factId, 'ACTIVE');
  revalidatePath(`/portal/${organizationSlug}/knowledge`);
}

export async function rejectKnowledgeFact(organizationSlug: string, factId: string) {
  await DashApi.knowledge.updateFactStatus(factId, 'REJECTED');
  revalidatePath(`/portal/${organizationSlug}/knowledge`);
}

'use server';

import { revalidatePath } from 'next/cache';
import { DashApi } from '@/lib/dash-api';

export async function generateApiKey(organizationSlug: string, name: string, environment: string = 'production') {
  await DashApi.settings.createApiKey(name, ['hermes.chat', 'knowledge.read']);
  revalidatePath(`/portal/${organizationSlug}/identity`);
}

export async function revokeApiKey(organizationSlug: string, id: string) {
  await DashApi.settings.revokeApiKey(id);
  revalidatePath(`/portal/${organizationSlug}/identity`);
}

export async function inviteTeamMember(organizationSlug: string, email: string, name: string) {
  await DashApi.identity.inviteMember(email, 'Member');
  revalidatePath(`/portal/${organizationSlug}/identity`);
}

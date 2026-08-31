'use server';

import { DashApi } from '@/lib/dash-api';

export async function simulateHermesProposal(organizationId: string) {
  try {
    const result = await DashApi.controlPlane.simulateIntent(organizationId);
    return { success: true, intentId: result.intentId };
  } catch (err: any) {
    console.error('[simulateHermesProposal] Error via DashApi:', err);
    throw new Error(err.message || 'Failed to simulate Hermes proposal');
  }
}

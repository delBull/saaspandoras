import React from 'react';
import UnifiedOnboardingClient from './UnifiedOnboardingClient';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { db } from '@saasfly/db-core';
import { marketingLeads } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';

export const dynamic = 'force-dynamic';

export default async function UnifiedOnboardingPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('commercial_session')?.value;
  
  let commercialLead = null;

  if (sessionToken) {
    try {
      if (!process.env.PANDORAS_SECRET_KEY) {
        throw new Error('PANDORAS_SECRET_KEY is not configured');
      }
      const secret = new TextEncoder().encode(process.env.PANDORAS_SECRET_KEY);
      const { payload } = await jose.jwtVerify(sessionToken, secret);
      
      if (payload.scope && typeof payload.scope === 'string' && payload.scope.includes('commercial:lead_read') && payload.leadId) {
        const leadRecord = await db.query.marketingLeads.findFirst({
          where: eq(marketingLeads.id, payload.leadId as string)
        });

        if (leadRecord) {
          commercialLead = {
            id: leadRecord.id,
            name: leadRecord.name || '',
            company: (leadRecord.metadata as any)?.company || leadRecord.name || '',
            crmStage: leadRecord.crmStage
          };
        }
      }
    } catch (err) {
      console.warn('[Onboarding] Invalid or expired commercial_session token');
    }
  }

  return <UnifiedOnboardingClient commercialLead={commercialLead} />;
}

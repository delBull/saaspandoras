import { NextResponse } from 'next/server';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { CognitiveContextBuilder } from '@/lib/pandoras/core/domains/hermes/addons/context-merger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken =
      searchParams.get('sessionToken') ||
      (request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim() || '');

    if (!sessionToken) {
      return NextResponse.json({ error: 'sessionToken is required' }, { status: 400 });
    }

    const session = await validatePortalSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const organization = await OrganizationSDK.resolve(session.projectId, session.product as any);
    const intelligenceScores = await CognitiveContextBuilder.getIntelligenceScores(session.projectId.toString());

    // Check if tenant has active facts in hermes_knowledge (e.g. newly provisioned tenant without injected info)
    let activeFactsCount = 0;
    try {
      const { db } = await import('@/db');
      const { hermesKnowledge } = await import('@/db/schema');
      const { eq, or } = await import('drizzle-orm');
      
      const orgId = organization?.organizationId || session.projectId.toString();
      const orgSlug = organization?.slug || '';
      
      const facts = await db
        .select()
        .from(hermesKnowledge)
        .where(
          or(
            eq(hermesKnowledge.organizationId, orgId),
            eq(hermesKnowledge.organizationId, orgSlug)
          )
        );
      activeFactsCount = facts.length;
    } catch {
      // Fallback
    }

    const needsOnboarding = activeFactsCount === 0;

    return NextResponse.json({ 
      organization, 
      intelligenceScores,
      activeFactsCount,
      needsOnboarding 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch session' }, { status: 500 });
  }
}

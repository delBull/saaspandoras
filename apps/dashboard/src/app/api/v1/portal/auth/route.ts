import { NextResponse } from 'next/server';
import { consumePortalToken, validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const session = await consumePortalToken(token);
    const organization = await OrganizationSDK.resolve(session.projectId, session.product as any);

    return NextResponse.json({
      sessionToken: session.sessionToken,
      organization,
    });
  } catch (error: any) {
    console.error('[Portal Auth API Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Authentication failed' },
      { status: 401 }
    );
  }
}

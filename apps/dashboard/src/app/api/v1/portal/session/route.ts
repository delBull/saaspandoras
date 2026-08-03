import { NextResponse } from 'next/server';
import { validatePortalSession } from '@/lib/platform/portal-auth';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionToken = searchParams.get('sessionToken');

    if (!sessionToken) {
      return NextResponse.json({ error: 'sessionToken is required' }, { status: 400 });
    }

    const session = await validatePortalSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const organization = await OrganizationSDK.resolve(session.projectId, session.product as any);

    return NextResponse.json({ organization });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch session' }, { status: 500 });
  }
}

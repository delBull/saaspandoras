import { NextRequest, NextResponse } from 'next/server';
import { EntryRuntime } from '@/lib/hermes/runtimes/entry-runtime';
import { SessionManager } from '@/lib/hermes/runtimes/session-manager';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    // 1. Resolve Entry Context
    const entryRuntime = new EntryRuntime();
    const contactContext = await entryRuntime.resolveGoldenLink(slug);

    // 2. Resolve Tenant Details to get their public landing URL
    const [tenant] = await db.select({
      id: projects.id,
      slug: projects.slug,
      website: projects.website,
    })
    .from(projects)
    .where(eq(projects.id, contactContext.tenantId))
    .limit(1);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // 3. Start Session (Anonymous initially)
    const sessionManager = new SessionManager();
    const { sessionId } = await sessionManager.startSession(
      contactContext.tenantId, 
      undefined, 
      contactContext, 
      'web_widget'
    );

    // 4. Construct Public URL to Redirect
    const isDev = process.env.NODE_ENV === 'development';
    let targetUrl = tenant.website 
      ? tenant.website 
      : isDev ? 'http://localhost:3000' : `https://${tenant.slug}.pandoras.finance`;

    // Special case for S'Narai during dev
    if (tenant.id === 2 && isDev) {
      targetUrl = 'http://localhost:3001'; // Assuming S'Narai is on port 3001 locally
    } else if (tenant.id === 2 && !isDev) {
      targetUrl = 'https://snarai.com'; // or whatever the exact URL is
    }

    const response = NextResponse.redirect(targetUrl, 302);

    // 5. Set HttpOnly Cookie for the Widget to consume later via /session/current
    response.cookies.set('hermes_session', sessionId, {
      httpOnly: true,
      secure: !isDev,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;

  } catch (error: any) {
    console.error('Error resolving golden link:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

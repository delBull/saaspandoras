import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, clientIpFromHeaders } from '@/lib/hermes/auth/rate-limiter';
import { resolveCanonicalAuthSession } from '@/lib/hermes/auth/canonical-resolver';
import { notifyUpgradeIntent } from '@/lib/discord';
import { db } from '@/db';
import { projects, administrators } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromHeaders(req.headers);
    const rl = checkRateLimit(`growth-upgrade-intent:${ip}`, 10, 60_000); // Max 10 intents per min per IP
    if (!rl.allowed) {
      return NextResponse.json({ code: 'RATE_LIMITED', message: 'Too many requests.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const { capability } = body;

    // Resolve Canonical Session to know who is calling
    const session = await resolveCanonicalAuthSession(req);
    if (!session) {
      return NextResponse.json({ code: 'UNAUTHENTICATED', message: 'Auth required.' }, { status: 401 });
    }

    // De-dup policy: 1 notification per tenant, per capability, every 12 hours (43200000ms)
    const dedup = checkRateLimit(`intent-spam:${session.projectSlug}:${capability}`, 1, 43_200_000);
    if (!dedup.allowed) {
      // Drop silently to avoid spamming the admin Discord, but return success to UI
      return NextResponse.json({ success: true, message: 'Intent logged (deduplicated).' });
    }

    // Lookup project and its assigned admin (if any) to route the alert.
    const [projectWithAdmin] = await db
      .select({ adminWebhook: administrators.discordWebhookUrl })
      .from(projects)
      .leftJoin(administrators, eq(projects.assignedAdminId, administrators.id))
      .where(eq(projects.slug, session.projectSlug))
      .limit(1);

    let adminWebhook = projectWithAdmin?.adminWebhook;
    if (adminWebhook && !/^https:\/\/(discord\.com|discordapp\.com)\/api\/webhooks\//.test(adminWebhook)) {
      adminWebhook = undefined; // Invalid format
    }

    // Fire Discord Notification (falls back to the global channel if the
    // assigned admin has no private webhook configured)
    await notifyUpgradeIntent(session.projectSlug, capability || 'Unknown Capability', session.actorWallet ?? undefined, adminWebhook ?? undefined);

    return NextResponse.json({ success: true, message: 'Intent logged successfully.' });
  } catch (error: any) {
    console.error('[Growth API: upgrade-intent POST] Error:', error);
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: error.message }, { status: 500 });
  }
}

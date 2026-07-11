import { NextResponse } from 'next/server';
import { db } from '@/db';
import { ambassadors, partnerCertifications, partnerReputationEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { IntegrationKeyService } from '@/lib/integrations/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/external/users/[wallet]/certifications
 * 
 * Used by external properties (e.g. S'Narai Academy) to submit a passing certification result.
 * It inserts a certification record, grants reputation points, and automatically upgrades
 * the ambassador's status if they were in TRAINING.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    const { wallet } = await params;
    const body = await req.json();
    const { course_name, academy_version, score } = body;

    if (!course_name || score === undefined) {
      return NextResponse.json({ error: 'Missing course_name or score' }, { status: 400 });
    }

    // 1. Authenticate Request
    const rawAuth = req.headers.get('authorization');
    const apiKey = req.headers.get('x-api-key') || (rawAuth?.startsWith('Bearer ') ? rawAuth.substring(7) : null);
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const client = await IntegrationKeyService.validateKey(apiKey);
    if (!client) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 403 });
    }

    // 2. Resolve Ambassador
    const ambassador = await db.query.ambassadors.findFirst({
      where: eq(ambassadors.walletAddress, wallet.toLowerCase())
    });

    if (!ambassador) {
      return NextResponse.json({ error: 'Ambassador not found for this wallet' }, { status: 404 });
    }

    // 3. Insert Certification & Upgrade Status atomically
    await db.transaction(async (tx) => {
      await tx.insert(partnerCertifications).values({
        ambassadorId: ambassador.id,
        courseName: course_name,
        academyVersion: academy_version || 'v1.0',
        score: score,
        status: score >= 80 ? 'passed' : 'failed',
        completedAt: new Date()
      });

      if (score >= 80) {
        // Upgrade status if they were in training
        if (ambassador.status === 'TRAINING') {
          await tx.update(ambassadors)
            .set({ status: 'ACCREDITED' })
            .where(eq(ambassadors.id, ambassador.id));
        }

        // Grant 100 points for passing
        await tx.insert(partnerReputationEvents).values({
          ambassadorId: ambassador.id,
          event: `ACADEMY_PASSED_${course_name.toUpperCase()}`,
          points: 100
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Certification logged successfully' });
  } catch (error: any) {
    console.error('Error logging certification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

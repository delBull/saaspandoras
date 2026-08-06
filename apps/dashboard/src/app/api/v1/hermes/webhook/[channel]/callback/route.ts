import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Scheduler } from '@/lib/hermes/kernel/scheduler/scheduler';
import { ExecutionResult } from '@/lib/hermes/contracts/universal';
import { DecisionJournal } from '@/lib/hermes/kernel/intelligence/decision-journal';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  try {
    const { channel } = await params;
    const providerId = channel;
    const body = await req.json();
    
    // The incoming payload from the external provider should contain:
    // { executionId, result, signature }
    const { executionId, result, signature } = body;

    if (!executionId || !result || !signature) {
      return NextResponse.json({ error: 'Missing required callback fields' }, { status: 400 });
    }

    const job = await Scheduler.getJob(executionId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.providerId !== providerId) {
      console.error(`[Hermes OS] Callback channel mismatch for job ${executionId}. Expected ${job.providerId}, got ${providerId}`);
      return NextResponse.json({ error: 'Channel mismatch' }, { status: 400 });
    }

    if (job.expiresAt && new Date() > new Date(job.expiresAt)) {
      console.error(`[Hermes OS] Callback expired for job ${executionId}`);
      await Scheduler.deleteJob(executionId);
      return NextResponse.json({ error: 'Callback expired' }, { status: 410 });
    }

    if (job.state !== 'Waiting Callback') {
      return NextResponse.json({ error: `Job is in state ${job.state}, not expecting callback` }, { status: 400 });
    }

    if (!job.callbackSecret) {
      return NextResponse.json({ error: 'Job has no callback secret configured' }, { status: 500 });
    }

    // Verify HMAC signature
    const expectedSignature = crypto.createHmac('sha256', job.callbackSecret).update(executionId).digest('hex');
    
    if (signature !== expectedSignature) {
      console.error(`[Hermes OS] Invalid callback signature for job ${executionId}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log(`[Hermes OS] Valid callback received for job ${executionId} from provider ${providerId}`);

    // Update job state
    await Scheduler.updateState(executionId, 'Completed', result as ExecutionResult);

    // In a real scenario, here we would route the result back to the user via the original channel (e.g. Telegram)
    // or trigger the next step in the workflow. For now, it's marked as Completed in the Scheduler.
    // DecisionJournal log for callback completion (Sprint 9 extension)
    await DecisionJournal.logDecision(job.request as any, undefined, { id: providerId } as any, result as ExecutionResult);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Hermes OS] Callback Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

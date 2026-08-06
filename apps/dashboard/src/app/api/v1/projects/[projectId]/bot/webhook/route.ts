import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';
import { HermesExecutionEngine } from '@/lib/hermes/kernel/execution/execution-api';
import { TelegramAdapter } from '@/lib/hermes/adapters/telegram-adapter';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';

/**
 * 📡 Pandora's Platform OS v5 — Autonomous Webhook Endpoint powered by ExecutionEngine Kernel
 * Route: /api/v1/projects/[projectId]/bot/webhook
 */
async function handler(req: Request, props: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await props.params;
    const { projectId: projectSlug } = params;

    // 0. Find Project
    const projectRecord = await db.query.projects.findFirst({
      where: eq(projects.slug, projectSlug),
    });

    if (!projectRecord) {
      console.warn(`[Telegram Bot] Webhook received for unknown project: ${projectSlug}`);
      return NextResponse.json({ error: "Unknown project" }, { status: 400 });
    }

    const projectId = projectRecord.id;
    const metadata = (projectRecord.w2eConfig as any) || {};
    const storedSecret = metadata?.botConfig?.webhookSecret;

    // 1. Validate Telegram secret token (anti-forgery)
    if (storedSecret) {
      const requestSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (!requestSecret || requestSecret !== storedSecret) {
        console.warn(`[Telegram Bot] Invalid secret token for project: ${projectSlug}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // 2. Resolve token for execution context
    const orgContext = await OrganizationSDK.resolve(projectId, 'HERMES');
    let botToken = metadata?.botConfig?.telegramToken || (orgContext.activeProduct?.connectors as any)?.telegram?.botToken;
    
    if (projectSlug === 'snarai') {
      botToken = process.env.TELEGRAM_SNARAI_BOT_TOKEN || botToken;
    }

    const body = await req.json();
    body.botToken = botToken;
    body.projectRecord = projectRecord;
    body.metadata = metadata;

    // 3. Parse request into ExecutionContext via Channel Adapter
    const context = TelegramAdapter.parse(projectId, body);
    
    // Ignore updates that have no content or we don't care about
    if (!context.payload.userMessage && !context.payload.raw?.callback_query) {
      return NextResponse.json({ success: true, note: 'Ignored non-message update' });
    }

    // 3. Delegate to the Kernel (Unified Execution API)
    const engine = new HermesExecutionEngine();
    const result = await engine.execute(context);

    // 4. Render the ExecutionResult back to the Channel
    const reply = TelegramAdapter.render(result);

    // 6. Send back to Telegram
    if (botToken && reply) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: context.payload.chatId, text: reply })
      }).catch(e => console.error('[Webhook Telegram Send Error]:', e));
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Telegram Bot] Webhook Error:", error);
    // If we fail catastrophically, we must return 500 so Telegram retries the delivery.
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow enough time for LLM generation

export const POST = withSecurity(handler as any, { rateLimit: apiRateLimiter });

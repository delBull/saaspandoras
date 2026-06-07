import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';

async function handler(req: Request, props: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await props.params;
    const { projectId } = params;
    
    const body = await req.json();
    const { botToken } = body;

    if (!botToken) {
      return NextResponse.json({ success: false, error: "Bot token is required" }, { status: 400 });
    }

    const { session } = await getAuth(await headers());
    const walletAddress = session?.address;

    if (!walletAddress) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const projectRecord = await db.query.projects.findFirst({
      where: eq(projects.slug, projectId)
    });

    if (!projectRecord || projectRecord.applicantWalletAddress?.toLowerCase() !== walletAddress.toLowerCase()) {
      return NextResponse.json({ success: false, error: "Forbidden: Only project owner can register bot" }, { status: 403 });
    }

    // Generate a unique secret token for webhook validation
    const webhookSecret = crypto.randomUUID();

    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    
    // Register webhook with Telegram, including secret_token for request validation
    const webhookUrl = `${protocol}://${host}/api/v1/projects/${projectId}/bot/webhook`;
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}&secret_token=${webhookSecret}`
    );
    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to register webhook with Telegram",
        details: telegramData.description 
      }, { status: 400 });
    }

    let botUsername = null;
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const meData = await meRes.json();
      if (meData.ok && meData.result?.username) {
        botUsername = meData.result.username;
      }
    } catch (e) {
      console.warn("[Telegram Registration] Failed to fetch bot username:", e);
    }

    // Save token, username, and webhookSecret into the database
    if (projectRecord) {
      const config = (projectRecord.w2eConfig as any) || {};
      
      const newConfig = {
        ...config,
        aiBotUrl: botUsername ? `https://t.me/${botUsername}` : config.aiBotUrl,
        botConfig: {
          ...config.botConfig,
          telegramToken: botToken,
          telegramUsername: botUsername,
          webhookSecret,
          enabled: true,
        }
      };

      await db.update(projects)
        .set({ w2eConfig: newConfig })
        .where(eq(projects.slug, projectId));
    }

    return NextResponse.json({ 
      success: true, 
      message: "Webhook registered successfully",
      webhookUrl,
      botUsername
    });

  } catch (error: any) {
    console.error("[Telegram Registration] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const POST = withSecurity(handler as any, { rateLimit: apiRateLimiter, maxBodySize: 1024 * 50 });

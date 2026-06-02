import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request, props: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await props.params;
    const { projectId } = params;
    
    const body = await req.json();
    const { botToken } = body;

    if (!botToken) {
      return NextResponse.json({ success: false, error: "Bot token is required" }, { status: 400 });
    }

    // Get the base URL from the request (e.g. https://staging.dash.pandoras.finance)
    // We assume this endpoint is called by the frontend on the correct domain.
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    
    // Construct the Webhook URL using the exact route we created earlier
    const webhookUrl = `${protocol}://${host}/api/v1/projects/${projectId}/bot/webhook`;

    // 1. Call Telegram API to register the webhook
    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${webhookUrl}`);
    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to register webhook with Telegram",
        details: telegramData.description 
      }, { status: 400 });
    }

    // 2. Save the token into the database (w2eConfig.botConfig)
    const projectRecord = await db.query.projects.findFirst({
      where: eq(projects.slug, projectId)
    });

    if (projectRecord) {
      const config = (projectRecord.w2eConfig as any) || {};
      
      const newConfig = {
        ...config,
        botConfig: {
          ...config.botConfig,
          telegramToken: botToken,
          enabled: true
        }
      };

      await db.update(projects)
        .set({ w2eConfig: newConfig })
        .where(eq(projects.slug, projectId));
    }

    return NextResponse.json({ 
      success: true, 
      message: "Webhook registered successfully",
      webhookUrl
    });

  } catch (error: any) {
    console.error("[Telegram Registration] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

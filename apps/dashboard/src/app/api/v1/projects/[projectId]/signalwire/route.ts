import { NextRequest, NextResponse } from 'next/server';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { SignalWireService } from '@/lib/integrations/signalwire-service';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 📞 POST /api/v1/projects/[projectId]/signalwire
 * Omnichannel Adapter for SignalWire SMS & Voice calls
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Resolve project record
    const projectRecord = await db.query.projects.findFirst({
      where: eq(projects.slug, projectId),
    });

    if (!projectRecord) {
      console.warn(`[SignalWire Adapter] Unknown project slug: ${projectId}`);
      return new NextResponse('Project Not Found', { status: 404 });
    }

    // Parse SignalWire LaML webhook parameters (URL encoded)
    const formData = await req.formData();
    const fromNumber = (formData.get('From') as string) || '';
    const bodyText = (formData.get('Body') as string) || '';
    const callSid = formData.get('CallSid') as string;
    const isVoiceCall = !!callSid;

    console.info(`[SignalWire Adapter] Event for ${projectId}: From ${fromNumber}, IsVoice: ${isVoiceCall}`);

    // Case 1: Incoming Phone Call (Voice Channel)
    if (isVoiceCall) {
      const userMessage = bodyText || "El usuario ha llamado por teléfono para solicitar informes del proyecto.";
      
      const botResponseObj = await generateBotResponse({
        projectName: projectRecord.title,
        userMessage,
        projectContext: {
          title: projectRecord.title,
          slug: projectRecord.slug,
          industry: (projectRecord as any).tenantRuntimeConfig?.industry || 'real_estate'
        },
        chatId: `voice-${fromNumber.replace(/\+/g, '')}`
      });

      const botResponseText = botResponseObj.replyText || '';

      const lamlXml = SignalWireService.generateLaMLVoiceResponse({
        text: botResponseText
      });

      return new NextResponse(lamlXml, {
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    // Case 2: Incoming SMS Message (SMS Channel)
    if (bodyText) {
      const botResponseObj = await generateBotResponse({
        projectName: projectRecord.title,
        userMessage: bodyText,
        projectContext: {
          title: projectRecord.title,
          slug: projectRecord.slug,
          industry: (projectRecord as any).tenantRuntimeConfig?.industry || 'real_estate'
        },
        chatId: `sms-${fromNumber.replace(/\+/g, '')}`
      });
      const botResponseText = botResponseObj.replyText || '';

      // Reply back via SignalWire REST SMS
      await SignalWireService.sendSMS({
        to: fromNumber,
        body: botResponseText
      });

      return NextResponse.json({ success: true, channel: 'sms' });
    }

    return NextResponse.json({ success: true, message: 'No action taken' });
  } catch (err: any) {
    console.error('[SignalWire Adapter Error]:', err);
    return NextResponse.json({ error: 'SignalWire Adapter Exception', details: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { SignalWireService } from '@/lib/integrations/signalwire-service';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendTelegramAlert } from '@/lib/telegram';

// In-memory ring buffer for recent incoming SMS & OTP verification codes
interface SignalWireEvent {
  timestamp: string;
  projectId: string;
  from: string;
  body: string;
  isVoice: boolean;
  recordingUrl?: string;
  transcriptionText?: string;
  isVerificationCode?: boolean;
}

const recentSignalWireEvents: SignalWireEvent[] = [];

/**
 * 🔍 GET /api/v1/projects/[projectId]/signalwire
 * Returns the most recent incoming SMS, Voice events, recordings, and OTP verification codes.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const projectEvents = recentSignalWireEvents.filter(e => e.projectId === projectId || projectId === 'all');
  
  return NextResponse.json({
    projectId,
    totalEvents: projectEvents.length,
    events: projectEvents.slice(-20).reverse()
  }, {
    headers: { 'Cache-Control': 'no-store' }
  });
}

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
    const recordingUrl = (formData.get('RecordingUrl') as string) || '';
    const transcriptionText = (formData.get('TranscriptionText') as string) || '';
    const callStatus = (formData.get('CallStatus') as string) || '';
    const isVoiceCall = !!callSid || !!recordingUrl;

    console.info(`[SignalWire Adapter] Event for ${projectId}: From ${fromNumber}, IsVoice: ${isVoiceCall}, CallSid: ${callSid}, Recording: ${recordingUrl}, Transcription: "${transcriptionText}", Body: "${bodyText}"`);

    // Check if this is a Transcription Callback from a Voice Call
    if (transcriptionText || recordingUrl) {
      const isVoiceOtp = /\b(\d{3}[-\s]?\d{3}|\d{4,8}|c[oó]digo|whatsapp|meta|verification|code)\b/i.test(transcriptionText);
      
      const eventRecord: SignalWireEvent = {
        timestamp: new Date().toISOString(),
        projectId,
        from: fromNumber,
        body: transcriptionText ? `[Voz Transcrita]: ${transcriptionText}` : `[Grabación de Voz]: ${recordingUrl}`,
        isVoice: true,
        recordingUrl,
        transcriptionText,
        isVerificationCode: true
      };
      recentSignalWireEvents.push(eventRecord);
      if (recentSignalWireEvents.length > 50) recentSignalWireEvents.shift();

      try {
        await sendTelegramAlert(
          `🎙️ *[SignalWire ${isVoiceOtp ? 'CÓDIGO DE VERIFICACIÓN POR LLAMADA' : 'Grabación de Llamada'}]*\n` +
          `*Proyecto:* ${projectRecord.title} (${projectId})\n` +
          `*De:* \`${fromNumber || 'Llamada de Meta'}\`\n` +
          (transcriptionText ? `*Transcripción:* \`${transcriptionText}\`\n` : '') +
          (recordingUrl ? `*Audio Grabado:* [Escuchar Audio](${recordingUrl})` : '')
        );
      } catch (tgErr) {
        console.warn('[SignalWire] Telegram recording alert warning:', tgErr);
      }

      return NextResponse.json({ success: true, recorded: true });
    }

    // Check if this looks like a Meta / WhatsApp / 2FA Verification Code in SMS
    const isOtp = /\b(\d{3}[-\s]?\d{3}|\d{4,8}|c[oó]digo|whatsapp|meta|verification|code)\b/i.test(bodyText);

    // Save event in buffer
    const eventRecord: SignalWireEvent = {
      timestamp: new Date().toISOString(),
      projectId,
      from: fromNumber,
      body: bodyText,
      isVoice: isVoiceCall,
      isVerificationCode: isOtp
    };
    recentSignalWireEvents.push(eventRecord);
    if (recentSignalWireEvents.length > 50) recentSignalWireEvents.shift();

    // If OTP or incoming verification SMS, alert Telegram immediately
    if (bodyText) {
      console.info(`🔔 [SIGNALWIRE INBOUND SMS] From: ${fromNumber} | Text: ${bodyText}`);
      try {
        await sendTelegramAlert(
          `📱 *[SignalWire ${isOtp ? 'OTP / CÓDIGO DE VERIFICACIÓN' : 'SMS Entrante'}]*\n` +
          `*Proyecto:* ${projectRecord.title} (${projectId})\n` +
          `*De:* \`${fromNumber}\`\n` +
          `*Mensaje:* \`${bodyText}\``
        );
      } catch (tgErr) {
        console.warn('[SignalWire] Telegram dispatch warning:', tgErr);
      }
    }

    // Case 1: Incoming Phone Call (Voice Channel)
    if (isVoiceCall && !recordingUrl) {
      console.info(`📞 [SIGNALWIRE INBOUND CALL] CallSid: ${callSid} From: ${fromNumber}`);
      
      try {
        await sendTelegramAlert(
          `📞 *[SignalWire LLAMADA ENTRANTE]*\n` +
          `*Proyecto:* ${projectRecord.title} (${projectId})\n` +
          `*De:* \`${fromNumber || 'Desconocido'}\`\n` +
          `*Estado:* Grabando audio de la llamada para capturar el código dictado...`
        );
      } catch (tgErr) {
        console.warn('[SignalWire] Telegram call alert warning:', tgErr);
      }

      // LaML: Answer immediately without beep, pause and record the robocall audio for up to 60s with automatic transcription
      const lamlXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Pause length="1"/>
    <Record maxLength="60" playBeep="false" transcribe="true" transcribeCallback="/api/v1/projects/${projectId}/signalwire" action="/api/v1/projects/${projectId}/signalwire" />
    <Pause length="30"/>
</Response>`;

      return new NextResponse(lamlXml, {
        headers: { 'Content-Type': 'application/xml' }
      });
    }

    // Case 2: Incoming SMS Message (SMS Channel)
    if (bodyText) {
      // If it's a verification code, acknowledge without confusing conversational LLM
      if (isOtp) {
        return NextResponse.json({ success: true, otpReceived: true, body: bodyText });
      }

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



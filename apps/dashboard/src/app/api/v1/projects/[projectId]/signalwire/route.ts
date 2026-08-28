import { NextRequest, NextResponse } from 'next/server';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { SignalWireService } from '@/lib/integrations/signalwire-service';
import { db } from '@/db';
import { projects, securityEvents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
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
 * Returns the most recent incoming SMS, Voice events, recordings, and OTP verification codes
 * from in-memory, DB persistence (securityEvents), and SignalWire REST API.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  // 1. Fetch from DB persistence
  let dbEvents: any[] = [];
  try {
    const rawDbEvents = await db.select()
      .from(securityEvents)
      .where(eq(securityEvents.type, 'SIGNALWIRE_EVENT'))
      .orderBy(desc(securityEvents.createdAt))
      .limit(20);
    
    dbEvents = rawDbEvents.map(e => ({
      id: e.id,
      timestamp: e.createdAt,
      ...(e.metadata as any)
    }));
  } catch (dbErr) {
    console.warn('[SignalWire GET] DB fetch warning:', dbErr);
  }

  // 2. Fetch live from SignalWire REST API if credentials exist on server
  let liveRecordings: any[] = [];
  let liveTranscriptions: any[] = [];
  let liveMessages: any[] = [];

  const swProjectId = process.env.SIGNALWIRE_PROJECT_ID;
  const swApiToken = process.env.SIGNALWIRE_API_TOKEN;
  const swSpaceUrl = process.env.SIGNALWIRE_SPACE_URL || 'pandoras.signalwire.com';

  if (swProjectId && swApiToken) {
    const authHeader = 'Basic ' + Buffer.from(`${swProjectId}:${swApiToken}`).toString('base64');
    try {
      const [recRes, transRes, msgRes] = await Promise.allSettled([
        fetch(`https://${swSpaceUrl}/api/laml/2010-04-01/Accounts/${swProjectId}/Recordings.json?PageSize=10`, {
          headers: { Authorization: authHeader }
        }).then(r => r.json()),
        fetch(`https://${swSpaceUrl}/api/laml/2010-04-01/Accounts/${swProjectId}/Transcriptions.json?PageSize=10`, {
          headers: { Authorization: authHeader }
        }).then(r => r.json()),
        fetch(`https://${swSpaceUrl}/api/laml/2010-04-01/Accounts/${swProjectId}/Messages.json?PageSize=10`, {
          headers: { Authorization: authHeader }
        }).then(r => r.json()),
      ]);

      if (recRes.status === 'fulfilled' && recRes.value?.recordings) {
        liveRecordings = recRes.value.recordings;
      }
      if (transRes.status === 'fulfilled' && transRes.value?.transcriptions) {
        liveTranscriptions = transRes.value.transcriptions;
      }
      if (msgRes.status === 'fulfilled' && msgRes.value?.messages) {
        liveMessages = msgRes.value.messages;
      }
    } catch (apiErr) {
      console.warn('[SignalWire GET] Live API query warning:', apiErr);
    }
  }

  const projectEvents = recentSignalWireEvents.filter(e => e.projectId === projectId || projectId === 'all');
  
  return NextResponse.json({
    projectId,
    totalInMemoryEvents: projectEvents.length,
    events: projectEvents.slice(-20).reverse(),
    dbEvents,
    liveRecordings,
    liveTranscriptions,
    liveMessages
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

    // Save event in buffer and DB persistence
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

    try {
      await db.insert(securityEvents).values({
        type: 'SIGNALWIRE_EVENT',
        ip: 'signalwire',
        userAgent: 'SignalWire-LaML',
        metadata: {
          projectId,
          from: fromNumber,
          body: bodyText,
          isVoice: isVoiceCall,
          callSid,
          isVerificationCode: isOtp
        }
      });
    } catch (dbErr) {
      console.warn('[SignalWire POST] DB insert warning:', dbErr);
    }

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



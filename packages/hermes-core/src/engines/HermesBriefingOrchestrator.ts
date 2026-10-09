import { db } from '@saasfly/db-core';
import { eq, and, gt, isNull, sql } from '@saasfly/db-core';
import { hermesMeetings, hermesBriefingPreferences, hermesBriefings, hermesKnowledge } from '@saasfly/db-core/schema';
import OpenAI from 'openai';

// Importa tus utilidades de notificaciones o canales aquí, por ejemplo:
// import { EmailRenderer } from '../infrastructure/emails';
// import { WhatsAppAdapter } from '../channels/whatsapp';

export class HermesBriefingOrchestrator {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /**
   * Explora todas las reuniones próximas y dispara briefings para aquellos tenants
   * que tengan las preferencias habilitadas y que no hayan recibido el briefing aún.
   */
  async processUpcomingMeetings() {
    // 1. Encontrar reuniones que empiezan en las próximas 2 horas y aún no tienen briefing
    const now = new Date();
    const lookahead = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

    const pendingMeetings = await db.select({
      meeting: hermesMeetings,
      prefs: hermesBriefingPreferences,
    })
    .from(hermesMeetings)
    .innerJoin(hermesBriefingPreferences, eq(hermesMeetings.organizationId, hermesBriefingPreferences.organizationId))
    .leftJoin(hermesBriefings, eq(hermesMeetings.id, hermesBriefings.meetingId))
    .where(
      and(
        gt(hermesMeetings.startTime, now),
        sql`${hermesMeetings.startTime} <= ${lookahead}`,
        eq(hermesBriefingPreferences.enabled, true),
        isNull(hermesBriefings.id) // No briefing sent yet
      )
    );

    for (const record of pendingMeetings) {
      const { meeting, prefs } = record;
      
      // Checar si estamos dentro de la ventana de lead_time_minutes
      const timeToMeeting = meeting.startTime.getTime() - now.getTime();
      const leadTimeMs = prefs.leadTimeMinutes * 60 * 1000;
      
      if (timeToMeeting <= leadTimeMs) {
        await this.dispatchBriefing(meeting, prefs);
      }
    }
  }

  private async dispatchBriefing(meeting: any, prefs: any) {
    try {
      let contextStr = '';
      
      if (prefs.includeFacts && meeting.attendees?.length > 0) {
        contextStr = await this.compileFacts(meeting.organizationId, meeting.attendees);
      }

      const prompt = `
        Genera un Briefing Ejecutivo conciso para la siguiente reunión.
        Reunión: ${meeting.title}
        Hora: ${meeting.startTime}
        Plataforma: ${meeting.platform}
        
        ${contextStr ? `Contexto Previo (Knowledge Vault):\n${contextStr}` : ''}
        
        El tono debe ser profesional y preparado para el ejecutivo o equipo de ventas.
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }]
      });
      const briefingContent = response.choices[0]?.message?.content || '';

      // TODO: Renderizar y enviar por el canal seleccionado
      if (prefs.channel === 'EMAIL') {
        const emails = prefs.targetEmails || [meeting.organizerEmail];
        // await EmailRenderer.send(emails, `Briefing: ${meeting.title}`, briefingContent);
        console.log(`[BriefingOrchestrator] Enviando EMAIL a ${emails.join(', ')}`);
      } else if (prefs.channel === 'WHATSAPP') {
        const phones = prefs.targetPhones || [];
        // await WhatsAppAdapter.send(phones, briefingContent);
        console.log(`[BriefingOrchestrator] Enviando WHATSAPP a ${phones.join(', ')}`);
      }

      // Registrar el envío exitoso
      await db.insert(hermesBriefings).values({
        id: crypto.randomUUID(),
        organizationId: meeting.organizationId,
        meetingId: meeting.id,
        channel: prefs.channel,
        destination: prefs.channel === 'EMAIL' ? (prefs.targetEmails?.join(',') || '') : (prefs.targetPhones?.join(',') || ''),
        status: 'SENT',
        sentAt: new Date(),
      });

    } catch (error: any) {
      console.error(`[BriefingOrchestrator] Failed to dispatch briefing for meeting ${meeting.id}:`, error);
      
      // Registrar la falla
      await db.insert(hermesBriefings).values({
        id: crypto.randomUUID(),
        organizationId: meeting.organizationId,
        meetingId: meeting.id,
        channel: prefs.channel,
        destination: 'UNKNOWN',
        status: 'FAILED',
        errorReason: error.message,
      });
    }
  }

  private async compileFacts(organizationId: string, attendees: any[]): Promise<string> {
    const emails = attendees.map(a => a.email).filter(Boolean);
    if (emails.length === 0) return '';

    const facts = await db.select()
      .from(hermesKnowledge)
      .where(
        and(
          eq(hermesKnowledge.organizationId, organizationId),
          eq(hermesKnowledge.status, 'ACTIVE')
          // En la práctica real, deberías buscar matches semánticos con los emails 
          // o usar embeddings para recuperar facts relevantes.
        )
      )
      .limit(10); // Limitamos para el briefing

    if (facts.length === 0) return 'No se encontraron facts recientes en el Knowledge Vault.';
    
    return facts.map((f: any) => `- [${f.sourceType}] ${f.content}`).join('\n');
  }
}

'use server';

import { headers } from 'next/headers';
import { LeadDomainService } from "@/lib/domain/lead-domain-service";
import crypto from 'crypto';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60_000;

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

export async function registerForEvent(prevState: any, formData: FormData) {
    try {
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || 'unknown';
        const now = Date.now();

        const rateKey = `event_reg:${ip}`;
        const rateEntry = rateLimitMap.get(rateKey);
        if (rateEntry && now < rateEntry.resetAt) {
            if (rateEntry.count >= RATE_LIMIT_MAX) {
                return { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' };
            }
            rateEntry.count++;
        } else {
            rateLimitMap.set(rateKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
        }

        const nombre = formData.get('nombre') as string;
        const email = formData.get('email') as string;
        const telefono = formData.get('telefono') as string;
        const perfil = formData.get('perfil') as string;
        const eventIdStr = formData.get('eventId') as string;
        const projectIdStr = formData.get('projectId') as string;
        const selectedDateTimeStr = formData.get('selectedDateTime') as string;
        const meetingPreference = formData.get('meetingPreference') as string;

        if (!nombre || !email || !eventIdStr || !projectIdStr) {
            return { error: 'Faltan campos obligatorios' };
        }

        if (!isValidEmail(email)) {
            return { error: 'El formato del correo electrónico no es válido.' };
        }

        const eventId = Number(eventIdStr);
        const projectId = Number(projectIdStr);

        const result = await LeadDomainService.registerForEvent({
            eventId,
            projectId,
            nombre,
            email,
            telefono: telefono || '',
            perfil: perfil || '',
            selectedDateTimeStr: selectedDateTimeStr || null,
            meetingPreference: meetingPreference || ''
        });

        if (!result.success || !result.project || !result.event) {
            return { error: result.error || 'Ocurrió un error al registrar el evento.' };
        }

        const { project, event, config, finalLocation, jitsiLink, finalSelectedDate } = result;

        const dateTimeWithTz = selectedDateTimeStr ? `${selectedDateTimeStr}-06:00` : null;

        // DISCORD WEBHOOK NOTIFICATION
        try {
            if (project?.discordWebhookUrl) {
                const eventDateFormatted = dateTimeWithTz 
                    ? new Date(dateTimeWithTz).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' })
                    : event?.date ? new Date(event.date).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' }) : 'Fecha por confirmar';

                // Create a Google Calendar link
                let gcalLink = '';
                if (dateTimeWithTz || event?.date) {
                    const d = dateTimeWithTz ? new Date(dateTimeWithTz) : new Date(event.date as Date);
                    const endD = new Date(d.getTime() + 60 * 60 * 1000); // add 1 hour
                    const fmt = (dt: Date) => dt.toISOString().replace(/-|:|\.\d\d\d/g, '');
                    const title = encodeURIComponent(event?.title || "Private Briefing");
                    const details = encodeURIComponent(`Reunión con ${nombre} (${email} - ${telefono})`);
                    const loc = encodeURIComponent(event?.location || '');
                    gcalLink = `\n\n[📅 Agregar a Google Calendar](https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(d)}/${fmt(endD)}&details=${details}&location=${loc})`;
                }

                const embed = {
                    title: `🎫 Nueva Confirmación de Asistencia`,
                    color: 0xD4A853, // Gold color
                    description: gcalLink,
                    fields: [
                        { name: "Proyecto", value: project.title, inline: true },
                        { name: "Evento", value: event?.title || "Evento Privado", inline: true },
                        { name: "Nombre", value: nombre, inline: false },
                        { name: "Email", value: email, inline: true },
                        { name: "Teléfono", value: telefono || "No especificado", inline: true },
                        { name: "Perfil / Modo", value: (perfil || "No especificado") + (meetingPreference ? ` (${meetingPreference})` : ''), inline: true },
                        { name: "Fecha/Hora", value: eventDateFormatted, inline: false },
                        { name: "Ubicación", value: finalLocation, inline: false }
                    ],
                    timestamp: new Date().toISOString()
                };

                await fetch(project.discordWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ embeds: [embed] })
                });
            }
        } catch (webhookError) {
            console.error("Error sending Discord webhook:", webhookError);
        }

        // EMAIL CONFIRMATION TO USER
        try {
            const { sendEmail } = await import('@/lib/email/client');
            const eventDateFormatted = dateTimeWithTz 
                ? new Date(dateTimeWithTz).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' })
                : event?.date ? new Date(event.date).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' }) : 'Fecha por confirmar';
                
            const attachments: any[] = [];
            
            const startDate = dateTimeWithTz ? new Date(dateTimeWithTz) : (event?.date ? new Date(event.date) : null);
            if (startDate) {
                const duration = config.durationMinutes || 45;
                const endDate = new Date(startDate.getTime() + duration * 60000);
                
                const formatDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
                const safeSummary = `${event?.title || 'Private Briefing'} - ${project?.title || ''}`.replace(/[\\;,\n]/g, ' ');
                const safeDescription = `Sesión privada. Link: ${jitsiLink || ''}`.replace(/[\\;,\n]/g, ' ');
                const safeLocationLine = (jitsiLink || event?.location || '').replace(/[\\;,\n]/g, ' ');

                const icsContent = [
                    "BEGIN:VCALENDAR",
                    "VERSION:2.0",
                    "PRODID:-//Pandoras//Events//EN",
                    "BEGIN:VEVENT",
                    `UID:${Date.now()}-${crypto.randomUUID()}`,
                    `DTSTAMP:${formatDate(new Date())}`,
                    `DTSTART:${formatDate(startDate)}`,
                    `DTEND:${formatDate(endDate)}`,
                    `SUMMARY:${safeSummary}`,
                    `DESCRIPTION:${safeDescription}`,
                    `LOCATION:${safeLocationLine}`,
                    "END:VEVENT",
                    "END:VCALENDAR"
                ].join("\\r\\n");

                attachments.push({
                    filename: 'invite.ics',
                    content: Buffer.from(icsContent).toString('base64'),
                    content_type: 'text/calendar'
                });
            }

            const safeLocation = escapeHtml(event?.location || 'Presencial');
            const safeMapsLink = config.mapsLink && isValidUrl(config.mapsLink) ? config.mapsLink : null;
            const safeJitsiLink = escapeHtml(jitsiLink);

            let locationHtml = `<span style="color: #000; font-weight: normal;">${safeLocation}</span>`;
            if (meetingPreference === 'VIRTUAL' || config.meetingType === 'VIRTUAL') {
                locationHtml = `<a href="${safeJitsiLink}" style="color: #2563EB; font-weight: normal; text-decoration: underline;">Enlace de Reunión Virtual</a>`;
            } else if (safeMapsLink) {
                locationHtml = `<a href="${escapeHtml(safeMapsLink)}" style="color: #2563EB; font-weight: normal; text-decoration: underline;">${safeLocation} (Ver en Google Maps)</a>`;
            }

            const safeName = escapeHtml(nombre);
            const safeEventTitle = escapeHtml(event?.title || 'Private Briefing');
            const safeProjectTitle = escapeHtml(project?.title || "S'Narai");

            await sendEmail({
                to: email,
                from: `${project?.title} <${project?.slug || 'hello'}@pandoras.finance>`,
                subject: `Confirmación de Asistencia - ${project?.title || "S'Narai"}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #000000; padding: 40px; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <h1 style="color: #000000; text-transform: uppercase; font-size: 24px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 20px;">Asistencia Confirmada</h1>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hola ${safeName},</p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Gracias por agendar tu espacio para la presentación privada de <strong>${safeProjectTitle}</strong>. Tu registro ha sido exitoso.</p>
                        
                        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 30px 0;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Evento</p>
                            <p style="margin: 0 0 20px 0; color: #000; font-weight: 600;">${safeEventTitle}</p>
                            
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Fecha y Hora</p>
                            <p style="margin: 0 0 20px 0; color: #000; font-weight: 600;">${eventDateFormatted}</p>
                            
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Lugar / Acceso</p>
                            <p style="margin: 0; color: #000; font-weight: 600;">${locationHtml}</p>
                        </div>
                        
                        <p style="color: #4b5563; font-size: 14px;">Te hemos adjuntado una invitación para que puedas agregar este evento a tu calendario. Te esperamos puntualmente.</p>
                        <p style="color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 20px;">Este es un mensaje automático generado por el sistema.</p>
                    </div>
                `,
                attachments: attachments.length > 0 ? attachments : undefined
            });
        } catch (emailError) {
            console.error("Error sending confirmation email:", emailError);
        }

        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { error: 'Ocurrió un error al procesar tu solicitud.' };
    }
}

'use server';

import { db } from "@/db";
import { eventRegistrations, projectEvents, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function registerForEvent(prevState: any, formData: FormData) {
    try {
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

        const eventId = Number(eventIdStr);
        const projectId = Number(projectIdStr);

        // Fetch project and event data early for capacity and notifications
        const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
        const [event] = await db.select().from(projectEvents).where(eq(projectEvents.id, eventId));

        if (!event || !project) return { error: 'Evento o proyecto no encontrado' };

        // Capacity check
        const config = typeof event.config === 'string' ? JSON.parse(event.config) : event.config || {};
        
        if (event.type === 'CALENDAR' && selectedDateTimeStr) {
            // Check slots for this specific date/time
            const regs = await db.select().from(eventRegistrations).where(
                and(
                    eq(eventRegistrations.eventId, eventId),
                    eq(eventRegistrations.selectedDateTime, new Date(selectedDateTimeStr)),
                    eq(eventRegistrations.status, 'CONFIRMED')
                )
            );
            const slotCapacity = config.maxCapacityPerSlot || 1;
            if (regs.length >= slotCapacity) {
                return { error: 'Este horario ya no está disponible. Por favor selecciona otro.' };
            }
        } else if (event.type === 'MACRO') {
            // Check macro event capacity
            const regs = await db.select().from(eventRegistrations).where(
                and(
                    eq(eventRegistrations.eventId, eventId),
                    eq(eventRegistrations.status, 'CONFIRMED')
                )
            );
            const maxCapacity = config.maxCapacity || 20;
            if (regs.length >= maxCapacity) {
                return { error: 'El cupo para este evento se ha agotado.' };
            }
        }

        // Generate meeting link if VIRTUAL
        let finalLocation = event.location || 'Presencial';
        let jitsiLink = '';
        if (meetingPreference === 'VIRTUAL' || config.meetingType === 'VIRTUAL') {
            jitsiLink = `https://meet.jit.si/pandoras-${project.slug}-${Date.now().toString(36)}`;
            finalLocation = jitsiLink;
        } else if (config.mapsLink) {
            finalLocation = `${event.location} - ${config.mapsLink}`;
        }

        // Append -06:00 (Mexico City) to ensure the parsed date is correct regardless of server timezone
        const dateTimeWithTz = selectedDateTimeStr ? `${selectedDateTimeStr}-06:00` : null;

        await db.insert(eventRegistrations).values({
            eventId,
            projectId,
            nombre,
            email,
            telefono: telefono || '',
            perfil: (perfil || '') + (meetingPreference ? ` (${meetingPreference})` : ''),
            status: 'CONFIRMED',
            selectedDateTime: dateTimeWithTz ? new Date(dateTimeWithTz) : null
        });

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
                const icsContent = [
                    "BEGIN:VCALENDAR",
                    "VERSION:2.0",
                    "PRODID:-//Pandoras//Events//EN",
                    "BEGIN:VEVENT",
                    `UID:${Date.now()}-${Math.random().toString(36).substring(2)}`,
                    `DTSTAMP:${formatDate(new Date())}`,
                    `DTSTART:${formatDate(startDate)}`,
                    `DTEND:${formatDate(endDate)}`,
                    `SUMMARY:${event?.title || 'Private Briefing'} - ${project?.title || ''}`,
                    `DESCRIPTION:Sesión privada.\\nLink: ${jitsiLink || config.mapsLink || ''}`,
                    `LOCATION:${jitsiLink || event?.location || ''}`,
                    "END:VEVENT",
                    "END:VCALENDAR"
                ].join("\\r\\n");

                attachments.push({
                    filename: 'invite.ics',
                    content: Buffer.from(icsContent).toString('base64'),
                    content_type: 'text/calendar'
                });
            }

            let locationHtml = `<span style="color: #000; font-weight: normal;">${event?.location || 'Presencial'}</span>`;
            if (meetingPreference === 'VIRTUAL' || config.meetingType === 'VIRTUAL') {
                locationHtml = `<a href="${jitsiLink}" style="color: #2563EB; font-weight: normal; text-decoration: underline;">Reunión Virtual (Google Meet / Jitsi)</a>`;
            } else if (config.mapsLink) {
                locationHtml = `<a href="${config.mapsLink}" style="color: #2563EB; font-weight: normal; text-decoration: underline;">${event?.location} (Ver en Google Maps)</a>`;
            }

            await sendEmail({
                to: email,
                from: `${project?.title} <${project?.slug || 'hello'}@pandoras.finance>`,
                subject: `Confirmación de Asistencia - ${project?.title || "S'Narai"}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; color: #000000; padding: 40px; border-radius: 8px; border: 1px solid #e5e7eb;">
                        <h1 style="color: #000000; text-transform: uppercase; font-size: 24px; font-weight: 700; letter-spacing: 0.05em; margin-bottom: 20px;">Asistencia Confirmada</h1>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hola ${nombre},</p>
                        <p style="color: #374151; font-size: 16px; line-height: 1.6;">Gracias por agendar tu espacio para la presentación privada de <strong>${project?.title || "S'Narai"}</strong>. Tu registro ha sido exitoso.</p>
                        
                        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 30px 0;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Evento</p>
                            <p style="margin: 0 0 20px 0; color: #000; font-weight: 600;">${event?.title || 'Private Briefing'}</p>
                            
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

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

        await db.insert(eventRegistrations).values({
            eventId,
            projectId,
            nombre,
            email,
            telefono: telefono || '',
            perfil: perfil || null,
            status: 'CONFIRMED',
            selectedDateTime: selectedDateTimeStr ? new Date(selectedDateTimeStr) : null
        });

        // DISCORD WEBHOOK NOTIFICATION
        try {
            if (project?.discordWebhookUrl) {
                const eventDateFormatted = selectedDateTimeStr 
                    ? new Date(selectedDateTimeStr).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
                    : event?.date ? new Date(event.date).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }) : 'Fecha por confirmar';

                // Create a Google Calendar link
                let gcalLink = '';
                if (selectedDateTimeStr || event?.date) {
                    const d = selectedDateTimeStr ? new Date(selectedDateTimeStr) : new Date(event.date as Date);
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
                        { name: "Perfil", value: perfil || "No especificado", inline: true },
                        { name: "Fecha/Hora", value: eventDateFormatted, inline: false }
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
            const eventDateFormatted = selectedDateTimeStr 
                ? new Date(selectedDateTimeStr).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' })
                : event?.date ? new Date(event.date).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Mexico_City' }) : 'Fecha por confirmar';
                
            await sendEmail({
                to: email,
                from: `${project?.title} <${project?.slug || 'hello'}@pandoras.finance>`,
                subject: `Confirmación de Asistencia - ${project?.title || "S'Narai"}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 8px;">
                        <h1 style="color: #D4A853; text-transform: uppercase; font-size: 24px;">Asistencia Confirmada</h1>
                        <p style="color: #ccc; font-size: 16px; line-height: 1.6;">Hola ${nombre},</p>
                        <p style="color: #ccc; font-size: 16px; line-height: 1.6;">Gracias por agendar tu espacio para la presentación privada de <strong>${project?.title || "S'Narai"}</strong>. Tu registro ha sido exitoso.</p>
                        
                        <div style="border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 20px 0; margin: 30px 0;">
                            <p style="margin: 0 0 10px 0; color: #D4A853; font-weight: bold;">Evento: <span style="color: #fff; font-weight: normal;">${event?.title || 'Private Briefing'}</span></p>
                            <p style="margin: 0 0 10px 0; color: #D4A853; font-weight: bold;">Fecha y Hora: <span style="color: #fff; font-weight: normal;">${eventDateFormatted}</span></p>
                            <p style="margin: 0; color: #D4A853; font-weight: bold;">Lugar / Acceso: <span style="color: #fff; font-weight: normal;">${event?.location || 'Presencial'}</span></p>
                        </div>
                        
                        <p style="color: #ccc; font-size: 14px;">Te esperamos puntualmente. Si necesitas hacer algún cambio, contáctanos respondiendo a este correo.</p>
                        <p style="color: #666; font-size: 12px; margin-top: 40px;">Este es un mensaje automático generado por el sistema.</p>
                    </div>
                `
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

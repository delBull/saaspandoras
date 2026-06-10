'use server';

import { db } from "@/db";
import { eventRegistrations, projectEvents, projects } from "@/db/schema";
import { eq } from "drizzle-orm";

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

        // Fetch project and event data for notifications
        const [project] = await db.select({ 
            title: projects.title,
            discordWebhookUrl: projects.discordWebhookUrl
        }).from(projects).where(eq(projects.id, projectId));

        const [event] = await db.select({ 
            title: projectEvents.title,
            date: projectEvents.date,
            location: projectEvents.location
        }).from(projectEvents).where(eq(projectEvents.id, eventId));

        // DISCORD WEBHOOK NOTIFICATION
        try {

            if (project?.discordWebhookUrl) {
                const embed = {
                    title: `🎫 Nueva Confirmación de Asistencia`,
                    color: 0xD4A853, // Gold color
                    fields: [
                        { name: "Proyecto", value: project.title, inline: true },
                        { name: "Evento", value: event?.title || "Evento Privado", inline: true },
                        { name: "Nombre", value: nombre, inline: false },
                        { name: "Email", value: email, inline: true },
                        { name: "Teléfono", value: telefono || "No especificado", inline: true },
                        { name: "Perfil", value: perfil || "No especificado", inline: true }
                    ],
                    timestamp: new Date().toISOString()
                };

                if (selectedDateTimeStr) {
                    embed.fields.push({
                        name: "Fecha/Hora Seleccionada",
                        value: new Date(selectedDateTimeStr).toLocaleString('es-MX'),
                        inline: false
                    });
                }

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
                subject: `Confirmación de Asistencia - ${project?.title || "S'Narai"}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 8px;">
                        <h1 style="color: #D4A853; text-transform: uppercase; font-size: 24px;">Confirmación de Asistencia</h1>
                        <p style="color: #ccc; font-size: 16px; line-height: 1.6;">Hola ${nombre},</p>
                        <p style="color: #ccc; font-size: 16px; line-height: 1.6;">Gracias por confirmar tu asistencia a la presentación privada de <strong>${project?.title || "S'Narai"}</strong>.</p>
                        
                        <div style="border-top: 1px solid #333; border-bottom: 1px solid #333; padding: 20px 0; margin: 30px 0;">
                            <p style="margin: 0 0 10px 0; color: #D4A853; font-weight: bold;">Evento: <span style="color: #fff; font-weight: normal;">${event?.title || 'Private Briefing'}</span></p>
                            <p style="margin: 0 0 10px 0; color: #D4A853; font-weight: bold;">Fecha: <span style="color: #fff; font-weight: normal;">${eventDateFormatted}</span></p>
                            <p style="margin: 0; color: #D4A853; font-weight: bold;">Lugar: <span style="color: #fff; font-weight: normal;">${event?.location || 'Presencial'}</span></p>
                        </div>
                        
                        <p style="color: #ccc; font-size: 14px;">En los próximos días recibirás más detalles sobre el acceso.</p>
                        <p style="color: #666; font-size: 12px; margin-top: 40px;">Este es un mensaje automático, por favor no respondas a este correo.</p>
                    </div>
                `
            });
        } catch (emailError) {
            console.error("Error sending confirmation email:", emailError);
        }

        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { error: e.message?.includes('relation "event_registrations" does not exist')
            ? 'La tabla de registros aún no está disponible. Ejecuta la migración de BD primero.'
            : 'Ocurrió un error al procesar tu solicitud.' };
    }
}

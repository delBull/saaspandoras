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

        // DISCORD WEBHOOK NOTIFICATION
        try {
            const [project] = await db.select({ 
                title: projects.title,
                discordWebhookUrl: projects.discordWebhookUrl
            }).from(projects).where(eq(projects.id, projectId));

            const [event] = await db.select({ title: projectEvents.title }).from(projectEvents).where(eq(projectEvents.id, eventId));

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

        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { error: e.message?.includes('relation "event_registrations" does not exist')
            ? 'La tabla de registros aún no está disponible. Ejecuta la migración de BD primero.'
            : 'Ocurrió un error al procesar tu solicitud.' };
    }
}

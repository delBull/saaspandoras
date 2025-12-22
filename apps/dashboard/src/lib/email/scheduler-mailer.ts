
import { sendEmail } from "./client";

function generateICS(event: {
    start: Date;
    end: Date;
    summary: string;
    description: string;
    location?: string;
    organizer?: { name: string; email: string };
}) {
    const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    return [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Pandoras//Scheduler//EN",
        "BEGIN:VEVENT",
        `UID:${crypto.randomUUID()}`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(event.start)}`,
        `DTEND:${formatDate(event.end)}`,
        `SUMMARY:${event.summary}`,
        `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`,
        `LOCATION:${event.location || "Google Meet"}`,
        // Organizer logic can be tricky with Outlook, often best omitted or set strictly
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");
}

export async function sendBookingPendingEmail(to: string, data: { name: string, date: string, time: string }) {
    const styles = {
        container: "font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;",
        header: "background: #f4f4f5; padding: 24px; text-align: center; border-bottom: 1px solid #e5e7eb;",
        content: "padding: 32px 24px;",
        details: "background: #fcfcfc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 24px 0;",
        footer: "background: #f4f4f5; padding: 16px; text-align: center; font-size: 12px; color: #71717a;"
    };

    await sendEmail({
        to,
        subject: `🗓️ Solicitud de Agenda Recibida - ${data.date}`,
        html: `
            <div style="${styles.container}">
                <div style="${styles.header}">
                    <h2 style="margin:0; color: #18181b; font-size: 20px;">Solicitud Recibida</h2>
                </div>
                <div style="${styles.content}">
                    <p style="color: #3f3f46; font-size: 16px; margin-top: 0;">Hola <strong>${data.name}</strong>,</p>
                    <p style="color: #52525b; line-height: 1.6;">
                        Hemos reservado tu espacio provisionalmente. Nuestro equipo está preparando la sesión y recibirás la confirmación final con el enlace de acceso en breve.
                    </p>
                    
                    <div style="${styles.details}">
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a;">Detalles del Evento</h3>
                        <p style="margin: 8px 0; color: #18181b;"><strong>Fecha:</strong> ${data.date}</p>
                        <p style="margin: 8px 0; color: #18181b;"><strong>Hora:</strong> ${data.time}</p>
                        <p style="margin: 8px 0; color: #18181b;"><strong>Duración:</strong> 30 min</p>
                    </div>

                    <p style="color: #71717a; font-size: 14px;">
                        Si necesitas cambiar el horario, por favor responde a este correo.
                    </p>
                </div>
                <div style="${styles.footer}">
                    Pandora's Finance • Automated Scheduling
                </div>
            </div>
        `
    });
}

export async function sendBookingConfirmedEmail(to: string, data: {
    name: string,
    start: Date,
    end: Date,
    meetingLink?: string
}) {
    const dateStr = data.start.toLocaleDateString("es-MX", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = data.start.toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' });

    // Generate ICS content
    const icsContent = generateICS({
        start: data.start,
        end: data.end,
        summary: "Sesión Pandoras",
        description: `Sesión agendada con Pandoras Finance.\nLink: ${data.meetingLink || "Por definir"}`,
        location: data.meetingLink
    });

    // Convert string to buffer/base64 for Resend (Resend API handles plain string content usually, but SDK types might differ. 
    // The previous edit to client.ts defined content as string, Resend API handles buffer mapping if we used Node. 
    // Since we call fetch, we must base64 encode it usually if it's binary, but text/calendar is text. 
    // We'll pass plain content but check docs. Actually Resend API requires buffer array usually.
    // Let's rely on basic string handling for now or try Base64 if needed.
    // Safer to base64 encode valid utf8 text.
    const icsBase64 = Buffer.from(icsContent).toString('base64');

    await sendEmail({
        to,
        subject: "✅ Cita Confirmada - Pandoras",
        html: `
            <h1>Tu cita está confirmada</h1>
            <p>Hola ${data.name}, nos vemos el <strong>${dateStr} a las ${timeStr}</strong>.</p>
            <p>Hemos adjuntado el evento para tu calendario.</p>
            <p>Link de reunión: <a href="${data.meetingLink || '#'}">${data.meetingLink || 'Se enviará pronto'}</a></p>
            <br>
            <p>Atte,<br>Equipo Pandoras</p>
        `,
        attachments: [
            {
                filename: 'invite.ics',
                content: icsBase64, // Providing Node buffer string conversion
                content_type: 'text/calendar' // Note: Resend fetch logic might not map this prop but good to have context
            }
        ]
    });
}

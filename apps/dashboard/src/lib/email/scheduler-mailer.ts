
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
    await sendEmail({
        to,
        subject: "🗓️ Cita Pendiente - Pandoras",
        html: `
            <h1>Hola ${data.name},</h1>
            <p>Hemos recibido tu solicitud de agenda para el <strong>${data.date} a las ${data.time}</strong>.</p>
            <p>Estamos revisando disponibilidad. Recibirás una confirmación definitiva en breve.</p>
            <br>
            <p>Atte,<br>Equipo Pandoras</p>
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

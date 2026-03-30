
import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Text,
    Section,
    Hr,
    Button,
    Tailwind
} from "@react-email/components";
import * as React from "react";

interface B2BCallReminderEmailProps {
    name?: string;
    meetingDate?: string;
    meetingTime?: string;
    type?: 'D-3' | 'D-1' | 'D-0';
    agendaUrl?: string;
}

export const B2BCallReminderEmail = ({
    name = "Founder",
    meetingDate = "pronto",
    meetingTime = "en el horario agendado",
    type = 'D-1',
    agendaUrl = "https://dash.pandoras.finance/admin/dashboard"
}: B2BCallReminderEmailProps) => {

    const getContent = () => {
        switch (type) {
            case 'D-3':
                return {
                    title: "Preparando nuestra sesión",
                    message: `Hola ${name}, nos vemos en 3 días para revisar el roadmap de tu protocolo. Solo quería asegurarme de que tienes el espacio reservado.`,
                    cta: "Ver Detalles de la Reunión"
                };
            case 'D-1':
                return {
                    title: "Mañana nos vemos",
                    message: `Hola ${name}, solo un recordatorio rápido: mañana tenemos nuestra sesión estratégica a las ${meetingTime}. Trae tus dudas sobre infraestructura y monetización.`,
                    cta: "Confirmar Asistencia"
                };
            case 'D-0':
                return {
                    title: "Hoy es el día",
                    message: `¡Hola ${name}! Nuestra llamada es hoy a las ${meetingTime}. Te espero para empezar a construir el futuro de tu proyecto.`,
                    cta: "Unirse a la Llamada"
                };
            default:
                return {
                    title: "Recordatorio de Sesión",
                    message: `Hola ${name}, te recordamos tu sesión agendada para el ${meetingDate} a las ${meetingTime}.`,
                    cta: "Ver Agenda"
                };
        }
    };

    const content = getContent();

    return (
        <Html>
            <Head />
            <Preview>{content.title} — Pandora’s Foundation</Preview>
            <Tailwind>
                <Body style={{ ...main, backgroundColor: "#ffffff" }} className="bg-white font-sans px-2">
                    <Container style={container} className="mx-auto py-10 max-w-[580px]">
                        <Section className="mb-8 text-center">
                            <Text className="text-black text-[10px] tracking-[4px] font-bold uppercase">
                                PANDORA'S FINANCE
                            </Text>
                        </Section>

                        <Heading className="text-black text-2xl font-bold text-left mb-6">
                            {content.title}
                        </Heading>

                        <Text className="text-zinc-700 text-base leading-relaxed mb-6">
                            {content.message}
                        </Text>

                        <Section className="p-6 bg-zinc-50 border border-zinc-200 rounded-lg my-8">
                            <Text className="text-black text-sm font-bold mb-2">
                                📅 Cuándo: {meetingDate}
                            </Text>
                            <Text className="text-black text-sm font-bold mb-6">
                                ⏰ Hora: {meetingTime}
                            </Text>
                            
                            <Button 
                                className="bg-black text-white text-sm font-bold no-underline text-center px-10 py-4 rounded-lg w-full mb-3"
                                href={agendaUrl}
                            >
                                {content.cta}
                            </Button>
                        </Section>

                        <Hr className="border-zinc-200 my-8" />

                        <Text className="text-zinc-400 text-xs leading-relaxed mb-6 italic text-center">
                            Si necesitas reprogramar, por favor hazlo con al menos 24h de anticipación para liberar el espacio para otro proyecto.
                        </Text>

                        <Text className="text-black text-base font-bold mt-8">
                            — Equipo de Estrategia, Pandora’s
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default B2BCallReminderEmail;

const main = {
    backgroundColor: "#ffffff",
};

const container = {
    margin: "0 auto",
};

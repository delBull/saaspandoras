import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Link,
  Hr,
  Button,
  Tailwind
} from "@react-email/components";
import * as React from "react";

interface RealEstateDiscoveryCallConfirmedProps {
  leadName?: string;
  developmentName?: string;
  appointmentDateTime?: string;
  meetingLink?: string;
  brokerName?: string;
  brokerPhone?: string;
}

export const RealEstateDiscoveryCallConfirmedEmail = ({
  leadName = "Inversionista",
  developmentName = "Desarrollo Residencial",
  appointmentDateTime = "Mañana a las 4:00 PM",
  meetingLink = "https://meet.google.com/abc-defg-hij",
  brokerName = "Carlos Mendoza",
  brokerPhone = "+52 1 322 123 4567"
}: RealEstateDiscoveryCallConfirmedProps) => {
  return (
    <Html>
      <Head />
      <Preview>Cita Confirmada para {developmentName} — {appointmentDateTime}</Preview>
      <Tailwind>
        <Body className="bg-[#070709] text-zinc-200 font-sans my-auto mx-auto p-4">
          <Container className="border border-zinc-800 bg-[#09090D] rounded-2xl mx-auto p-8 max-w-[580px] shadow-2xl">
            
            {/* Header */}
            <Section className="text-center pb-6 border-b border-zinc-800">
              <Text className="text-xs uppercase font-mono tracking-widest text-emerald-400 m-0">
                Sesión Estratégica Confirmada
              </Text>
              <Heading className="text-2xl font-light text-white mt-2 mb-1">
                {developmentName}
              </Heading>
              <Text className="text-xs text-zinc-400 m-0">
                Agenda Soberana · Videollamada Google Meet
              </Text>
            </Section>

            {/* Content */}
            <Section className="pt-6 pb-4">
              <Text className="text-sm text-zinc-300 leading-relaxed">
                Hola <strong className="text-white">{leadName}</strong>, tu cita ejecutiva ha quedado confirmada exitosamente.
              </Text>
            </Section>

            {/* Appointment Box */}
            <Section className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 my-4 text-center">
              <Text className="text-xs font-mono uppercase text-emerald-400 mb-1 font-semibold">
                Fecha & Hora de tu Sesión
              </Text>
              <Text className="text-lg font-semibold text-white my-1">
                {appointmentDateTime}
              </Text>
              <Text className="text-xs text-zinc-400 mt-2 mb-4">
                Asesor asignado: <strong className="text-zinc-200">{brokerName}</strong> ({brokerPhone})
              </Text>

              <Button
                href={meetingLink}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs px-6 py-3 rounded-xl no-underline inline-block shadow-lg"
              >
                Unirse a la Videollamada (Google Meet)
              </Button>
            </Section>

            {/* Preparation Checklist */}
            <Section className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 my-4">
              <Text className="text-xs font-mono uppercase text-zinc-400 mb-2 font-semibold">
                Puntos a Revisar en la Sesión
              </Text>
              <Text className="text-xs text-zinc-300 m-1">
                ✓ Disponibilidad viva de unidades y planos arquitectónicos
              </Text>
              <Text className="text-xs text-zinc-300 m-1">
                ✓ Esquema de financiamiento directo y descuentos de contado
              </Text>
              <Text className="text-xs text-zinc-300 m-1">
                ✓ Proyecciones de plusvalía y certeza fiduciaria
              </Text>
            </Section>

            <Hr className="border-zinc-800 my-6" />

            {/* Footer */}
            <Section>
              <Text className="text-[11px] text-zinc-500 text-center leading-relaxed">
                Si requieres reagendar o tienes un imprevisto, puedes responder directamente a este correo o escribir a tu asesor asignado.
              </Text>
              <Text className="text-[10px] text-zinc-600 text-center mt-2 font-mono">
                Hermes Revenue Closer · Agenda Soberana
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default RealEstateDiscoveryCallConfirmedEmail;

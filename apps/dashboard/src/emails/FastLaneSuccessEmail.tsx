import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  Hr,
  Button,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface FastLaneSuccessEmailProps {
  projectName?: string;
  projectSlug?: string;
  subject?: string;
  body?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const FastLaneSuccessEmail = ({
  projectName = "S'Narai",
  projectSlug = "snarai",
  subject = "Intención de Participación (Fast-Lane) Recibida",
  body = "Hemos registrado exitosamente tu solicitud a través del Fast-Lane. Tu lugar está temporalmente asegurado mientras finalizas el proceso.",
  ctaText = "COMPLETAR PROCESO",
  ctaUrl = "https://dash.pandoras.finance/projects/snarai/dao",
}: FastLaneSuccessEmailProps) => {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{subject}</Preview>
        <Body className="bg-[#050505] font-sans text-white">
          <Container className="mx-auto w-full max-w-[600px] p-0 border border-zinc-800 rounded-[2rem] overflow-hidden mt-10 shadow-2xl bg-[#0a0a0a]">
            {/* Premium Header */}
            <Section className="p-8 pb-4 text-center">
              <Text className="text-[10px] uppercase font-black tracking-[0.4em] text-emerald-500 mb-2">
                PANDORA'S // FAST-LANE
              </Text>
              <Hr className="border-zinc-800 my-4" />
            </Section>

            {/* Main Hero Section */}
            <Section className="px-10 pb-10">
              <Section className="text-center mb-8">
                 <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <Text className="text-[10px] font-black text-emerald-400 uppercase tracking-widest m-0">
                       ESTADO: INTENCIÓN CAPTURADA
                    </Text>
                 </div>
                 <Heading className="my-2 text-4xl font-black leading-tight text-white uppercase italic tracking-tighter">
                    {subject}
                 </Heading>
              </Section>

              <Section className="space-y-6 text-center mb-10">
                {body.split('\n\n').map((paragraph, i) => (
                  <Text key={i} className="text-zinc-400 text-lg leading-relaxed m-0 mb-4">
                    {paragraph}
                  </Text>
                ))}
              </Section>

              {/* Visual Progress Blocks */}
              <Section className="bg-[#0f0f0f] border border-zinc-800 rounded-[2rem] p-8 mb-10 shadow-inner">
                 <Row className="mb-8">
                    <Column className="w-1/2 pr-4 border-r border-zinc-800">
                       <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">PROYECTO</Text>
                       <Text className="text-sm font-bold text-white uppercase">{projectName}</Text>
                    </Column>
                    <Column className="w-1/2 pl-4">
                       <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">TU POSICIÓN</Text>
                       <Text className="text-sm font-bold text-yellow-400 uppercase">RESERVADA (ON HOLD)</Text>
                    </Column>
                 </Row>
                 <Section className="text-center">
                    <Text className="text-zinc-400 text-xs italic m-0">
                        * Tu participación será confirmada oficialmente en el sistema una vez que el pago sea validado.
                    </Text>
                 </Section>
              </Section>

              {/* Primary CTA */}
              <Section className="text-center mt-8">
                <Button 
                  href={ctaUrl}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black px-12 py-5 rounded-2xl font-black text-[12px] tracking-[0.3em] uppercase mx-auto block w-[320px] transition-all"
                >
                  {ctaText}
                </Button>
                <Text className="text-[9px] text-zinc-500 mt-6 uppercase tracking-widest font-bold">
                  Conoce el estatus de tu participación o sube tu comprobante.
                </Text>
              </Section>
            </Section>

            {/* Premium Footer */}
            <Section className="bg-[#080808] p-10 text-center border-t border-zinc-800">
                <Text className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">
                   ESTADO: LEAD FAST-LANE // INFRAESTRUCTURA PANDORAS
                </Text>
                <Hr className="border-zinc-800 my-6" />
                <Text className="text-[9px] text-zinc-600 leading-relaxed uppercase font-bold">
                  Tu intención está registrada en el sistema. <br />
                  Este mensaje es una confirmación técnica de tu posición reservada en {projectName}.
                </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default FastLaneSuccessEmail;

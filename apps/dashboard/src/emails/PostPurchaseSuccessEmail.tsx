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
  Link,
  Hr,
  Button,
  Row,
  Column,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface PostPurchaseSuccessEmailProps {
  projectName?: string;
  projectSlug?: string;
  subject?: string;
  body?: string;
  fundingPercentage?: number;
  currentPhase?: string;
  ctaText?: string;
  ctaUrl?: string;
  shareUrl?: string;
}

export const PostPurchaseSuccessEmail = ({
  projectName = "S'Narai",
  projectSlug = "snarai",
  subject = "Tu participación está activa",
  body = "Has dado el paso más importante. Ahora eres parte de la infraestructura que está redefiniendo el sector.",
  fundingPercentage = 65,
  currentPhase = "Pre-Seed / Private Sale",
  ctaText = "ACCEDER A MI PANEL",
  ctaUrl = "https://dash.pandoras.finance/projects/snarai/dao",
  shareUrl = "https://twitter.com/intent/tweet?text=Acabo%20de%20asegurar%20mi%20participación%20en%20S'Narai.%20El%20futuro%20es%20vibrante.",
}: PostPurchaseSuccessEmailProps) => {
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
                PANDORA'S // PROTOCOLO DE CONVERSIÓN
              </Text>
              <Hr className="border-zinc-800 my-4" />
            </Section>

            {/* Main Hero Section */}
            <Section className="px-10 pb-10">
              <Section className="text-center mb-8">
                 <div className="inline-block px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <Text className="text-[10px] font-black text-emerald-400 uppercase tracking-widest m-0">
                       ESTADO: OPERACIÓN CONFIRMADA
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

              {/* Visual Progress Blocks (The "Wow" Factor) */}
              <Section className="bg-[#0f0f0f] border border-zinc-800 rounded-[2rem] p-8 mb-10 shadow-inner">
                 <Row className="mb-8">
                    <Column className="w-1/2 pr-4 border-r border-zinc-800">
                       <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">FASE ACTUAL</Text>
                       <Text className="text-sm font-bold text-white uppercase">{currentPhase}</Text>
                    </Column>
                    <Column className="w-1/2 pl-4">
                       <Text className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">TU POSICIÓN</Text>
                       <Text className="text-sm font-bold text-emerald-400 uppercase">ACTIVA & ASEGURADA</Text>
                    </Column>
                 </Row>

                 <Section>
                    <div className="flex justify-between items-center mb-2">
                       <Text className="text-[10px] font-black text-zinc-400 uppercase tracking-widest m-0">PROGRESO DE FINANCIACIÓN</Text>
                       <Text className="text-[10px] font-black text-emerald-400 m-0">{fundingPercentage}%</Text>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full border border-white/5 overflow-hidden">
                       <div 
                          className="h-full bg-gradient-to-r from-emerald-600 to-lime-400" 
                          style={{ width: `${fundingPercentage}%` }}
                       />
                    </div>
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
                  Acceso directo a la infraestructura descentralizada.
                </Text>
              </Section>

              {/* Share / Viral Action */}
              <Section className="mt-12 p-8 bg-zinc-900/50 rounded-[2rem] border border-emerald-500/10 text-center">
                 <Text className="text-[11px] font-black uppercase text-white mb-4">¿QUIERES AUMENTAR TU IMPACTO?</Text>
                 <Text className="text-[13px] text-zinc-400 mb-6">Como inversor inicial, tu voz tiene peso. Invita a otros a ser parte del cambio.</Text>
                 <Row>
                    <Column className="pr-2">
                       <Button 
                          href={shareUrl}
                          className="w-full bg-[#1da1f2]/10 border border-[#1da1f2]/20 text-[#1da1f2] px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                       >
                          Compartir en X
                       </Button>
                    </Column>
                    <Column className="pl-2">
                       <Button 
                          href="https://t.me/snarai_community"
                          className="w-full bg-[#0088cc]/10 border border-[#0088cc]/20 text-[#0088cc] px-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                       >
                          Comunidad Telegram
                       </Button>
                    </Column>
                 </Row>
              </Section>
            </Section>

            {/* Premium Footer */}
            <Section className="bg-[#080808] p-10 text-center border-t border-zinc-800">
                <Text className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">
                   ESTADO: INVERSOR DE GÉNESIS // INFRAESTRUCTURA PANDORAS
                </Text>
                <Hr className="border-zinc-800 my-6" />
                <Text className="text-[9px] text-zinc-600 leading-relaxed uppercase font-bold">
                  Tu participación está registrada en la red. <br />
                  Este mensaje es una confirmación técnica de tu posición en {projectName}.
                </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default PostPurchaseSuccessEmail;

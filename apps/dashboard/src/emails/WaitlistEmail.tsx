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
} from '@react-email/components';

interface WaitlistEmailProps {
  subject: string;
  body: string;
  step: number | string;
  projectName?: string;
  brandHeader?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export default function WaitlistEmail({
  subject,
  body,
  step,
  projectName = "Narai",
  brandHeader = "PANDORA'S FINANCE // ACCESO EXCLUSIVO",
  ctaText,
  ctaUrl,
}: WaitlistEmailProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{subject}</Preview>
        <Body className="bg-white font-sans text-black">
          <Container className="mx-auto w-full max-w-[600px] p-0 border border-zinc-200 rounded-lg overflow-hidden mt-10 shadow-sm">
            {/* Header / Brand */}
            <Section className="p-8 pb-4 text-center">
               <Text className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-400 mb-2">
                 {brandHeader}
               </Text>
               <Hr className="border-zinc-100 my-4" />
            </Section>

            {/* Main Content */}
            <Section className="px-10 pb-10">
              <Heading className="my-6 text-3xl font-bold leading-tight text-black text-center">
                {subject}
              </Heading>

              <Section className="space-y-6">
                {body.split('\n\n').map((paragraph, i) => (
                  <Text key={i} className="text-zinc-700 text-lg leading-relaxed">
                    {paragraph}
                  </Text>
                ))}
              </Section>

              {ctaText && ctaUrl && (
                <Section className="text-center mt-12 mb-6">
                  <Button 
                    href={ctaUrl}
                    className="bg-[#a3e635] text-black px-8 py-5 rounded-xl font-black text-[12px] tracking-[0.3em] uppercase w-full max-w-[400px]"
                  >
                    {ctaText}
                  </Button>
                </Section>
              )}

              {/* Signature */}
              <Section className="mt-10 pt-6 border-t border-zinc-100">
                 <Text className="text-zinc-600 font-bold">
                   — {projectName}
                 </Text>
              </Section>
            </Section>

            {/* Footer / Status */}
            <Section className="bg-zinc-50 p-8 text-center border-t border-zinc-100">
                <Text className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  {typeof step === 'number' ? `PASO ${step} DE 4 // SECUENCIA DE INICIACIÓN // IDENTIDAD EN REVISIÓN` : `ESTADO: GENESIS // PANDORA'S ACCESS // ACCESO CONFIRMADO`}
                </Text>
               <Text className="text-[9px] text-zinc-400 mt-4 leading-relaxed">
                 Este mensaje es confidencial y solo para perfiles en proceso de evaluación.<br />
                 No compartir el contenido de esta comunicación.
               </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

WaitlistEmail.PreviewProps = {
  subject: "Tu acceso está en revisión.",
  step: 1,
  body: "Recibimos tu solicitud.\n\nNo estamos abriendo esto al público.\n\nEstamos seleccionando perfiles con visión y timing.\n\nEn los próximos días recibirás más contexto.\n\nSi estás dentro… lo sabrás antes que el resto."
};

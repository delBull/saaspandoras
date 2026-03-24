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
} from '@react-email/components';

interface WaitlistEmailProps {
  subject: string;
  body: string;
  step: number | string;
}

export default function WaitlistEmail({
  subject,
  body,
  step,
}: WaitlistEmailProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{subject}</Preview>
        <Body className="bg-black font-sans text-white">
          <Container className="mx-auto w-full max-w-[600px] p-0 border border-zinc-800 rounded-lg overflow-hidden mt-10">
            {/* Header / Brand */}
            <Section className="p-8 pb-4 text-center">
               <Text className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500 mb-2">
                 PANDORA'S FINANCE // ACCESO EXCLUSIVO
               </Text>
               <Hr className="border-zinc-800 my-4" />
            </Section>

            {/* Main Content */}
            <Section className="px-10 pb-10">
              <Heading className="my-6 text-3xl font-bold leading-tight text-white text-center">
                {subject}
              </Heading>

              <Section className="space-y-6">
                {body.split('\n\n').map((paragraph, i) => (
                  <Text key={i} className="text-zinc-300 text-lg leading-relaxed">
                    {paragraph}
                  </Text>
                ))}
              </Section>

              {/* Signature */}
              <Section className="mt-10 pt-6 border-t border-zinc-900">
                 <Text className="text-zinc-400 font-bold">
                   — Narai
                 </Text>
              </Section>
            </Section>

            {/* Footer / Status */}
            <Section className="bg-zinc-950 p-8 text-center border-t border-zinc-900">
               <Text className="text-[10px] text-zinc-600 uppercase tracking-widest">
                 {typeof step === 'number' ? `PASO ${step} DE 4 // SECUENCIA DE ACTIVACIÓN DE PROTOCOLO` : `ESTADO: ${step} // PANDORA GENESIS DROP`}
               </Text>
               <Text className="text-[9px] text-zinc-700 mt-4 leading-relaxed">
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

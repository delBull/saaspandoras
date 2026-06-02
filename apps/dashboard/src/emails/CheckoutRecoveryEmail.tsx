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

interface CheckoutRecoveryEmailProps {
  projectName?: string;
  ctaUrl?: string;
}

export default function CheckoutRecoveryEmail({
  projectName = "S'Narai",
  ctaUrl = "https://dash.pandoras.finance",
}: CheckoutRecoveryEmailProps) {
  const subject = `Tu asignación en ${projectName} expira pronto`;

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
                 {projectName.toUpperCase()} // RESCATE DE INVERSIÓN
               </Text>
               <Hr className="border-zinc-100 my-4" />
            </Section>

            {/* Main Content */}
            <Section className="px-10 pb-10">
              <Heading className="my-6 text-3xl font-bold leading-tight text-black text-center">
                Vimos que estuviste a punto de asegurar tus beneficios en {projectName}.
              </Heading>

              <Section className="space-y-6 text-center">
                <Text className="text-zinc-700 text-lg leading-relaxed m-0 mb-4">
                  Sabemos que a veces las wallets, tarjetas o transferencias fallan o toman más tiempo de lo esperado en la pantalla de "Activa tu acceso".
                </Text>

                <Text className="text-zinc-700 text-lg leading-relaxed m-0 mb-4">
                  Hemos congelado tu lugar y asegurado tus beneficios fundadores **por 24 horas más**.
                </Text>
              </Section>

              <Section className="text-center mt-10 mb-6">
                <Button 
                  href={ctaUrl}
                  className="bg-[#a3e635] text-black px-10 py-5 rounded-xl font-black text-[12px] tracking-[0.3em] uppercase mx-auto block w-[280px]"
                >
                  FINALIZAR MI INVERSIÓN
                </Button>
                <Text className="text-[9px] text-zinc-400 mt-6 uppercase tracking-widest font-bold">
                  *Si ya completaste tu inversión recientemente, puedes hacer caso omiso de este correo.
                </Text>
              </Section>

              {/* Signature */}
              <Section className="mt-10 pt-6 border-t border-zinc-100 text-center">
                 <Text className="text-zinc-600 font-bold m-0">
                   — El Equipo de {projectName}
                 </Text>
              </Section>
            </Section>

            {/* Footer / Status */}
            <Section className="bg-zinc-50 p-8 text-center border-t border-zinc-100">
                <Text className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  ESTADO: ASIGNACIÓN EN ESPERA // 24 HORAS RESTANTES
                </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

CheckoutRecoveryEmail.PreviewProps = {
  projectName: "S'Narai",
  ctaUrl: "https://dash.pandoras.finance"
};

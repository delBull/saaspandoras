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
} from '@react-email/components';

interface PandorasSimpleWelcomeEmailProps {
  email: string;
  name?: string;
  source?: string;
}

export default function PandorasSimpleWelcomeEmail({
  email,
  name = 'Futuro Creador',
  source = 'landing',
}: PandorasSimpleWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>¡Bienvenido, Futuro Creador! - La Evolución del Creador ya comenzó</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto w-full max-w-[600px] p-0">
            <Section className="p-8">
              <Heading className="my-4 font-medium text-4xl leading-tight text-black">
                ¡Bienvenido, Futuro Creador!
              </Heading>

              <Text className="mb-4 text-xl font-medium text-black">
                La Evolución del Creador ya comenzó
              </Text>

              <Text className="mb-6 text-black text-lg leading-6">
                ¡Gracias por unirte a la revolución de las comunidades soberanas! 🎉
              </Text>

              <Text className="text-gray-700 text-base leading-6 mb-6">
                Estás a punto de descubrir cómo transformar audiencias pasivas en comunidades activas mediante protocolos de utilidad, membresías NFT y sistemas Work-to-Earn.
              </Text>

              <Section className="bg-gray-100 p-6 rounded-lg mb-6">
                <Text className="text-black text-xl font-medium mb-4">
                  🔮 Próximamente recibirás:
                </Text>
                <Text className="text-gray-700 mb-3">Guías paso a paso para crear tu primer protocolo</Text>
                <Text className="text-gray-700 mb-3">Plantillas de contratos pre-auditados</Text>
                <Text className="text-gray-700 mb-3">Casos de estudio de creadores exitosos</Text>
                <Text className="text-gray-700 mb-3">Acceso prioritario a nuevas funcionalidades</Text>
              </Section>

              <Text className="text-gray-700 text-base leading-6 mb-6">
                Mientras tanto, puedes comenzar explorando nuestra plataforma en desarrollo. ¿Alguna pregunta? Responde a este email y te ayudaremos personalmente.
              </Text>

              <Section className="bg-black text-center p-6 rounded-lg">
                <Text className="text-white text-xl font-medium mb-2">
                  © 2025 Pandora's Finance.
                </Text>
                <Text className="text-gray-300 text-sm">
                  Construyendo el futuro de las comunidades digitales.
                </Text>
                <Text className="text-gray-400 text-xs mt-4">
                  Email enviado desde {source}
                </Text>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Preview para desarrollo
PandorasSimpleWelcomeEmail.PreviewProps = {
  email: 'usuario@ejemplo.com',
  name: 'Futuro Creador',
  source: 'landing-start',
};

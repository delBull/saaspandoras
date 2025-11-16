import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface PandorasWelcomeEmailProps {
  email: string;
  name?: string;
  source?: string;
}

export default function PandorasWelcomeEmail({
  email,
  name = 'Futuro Creador',
  source = 'creator-marketing',
}: PandorasWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>¡Bienvenido a Pandora's - Construyendo el futuro del contenido creativo!</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto w-full max-w-[600px] p-0">
            {/* Header */}
            <Section className="p-8 text-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
              <Text className="mx-0 mt-4 mb-8 p-0 text-center font-normal text-2xl">
                <span className="font-bold tracking-tighter">Pandora's</span>
              </Text>
              <Text className="font-normal text-sm uppercase tracking-wider text-zinc-300">
                Bienvenido a la comunidad
              </Text>
              <Heading className="my-4 font-medium text-4xl leading-tight text-white">
                ¡Tu viaje comienza ahora!
              </Heading>
              <Text className="text-zinc-300 text-base">
                {name}, prepárate para descubrir cómo revolucionar el mundo del contenido.
              </Text>
            </Section>

            {/* Hero Section - Main CTA */}
            <Section className="p-8 text-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
              <Heading className="m-0 font-medium text-3xl text-white">
                ¡Bienvenido a Pandora's!
              </Heading>
              <Text className="my-4 font-normal text-lg text-white">
                Gracias por unirte a la revolución de las comunidades soberanas.
              </Text>
              <Text className="mb-6 text-white text-sm leading-6">
                Estás a punto de transformar cómo interactúas con tu comunidad digital.
                Sin intermediarios, sin comisiones abusivas, solo poder creativo puro.
              </Text>
              <Link
                href="https://dash.pandoras.finance/"
                className="inline-flex items-center rounded-full bg-white px-8 py-4 text-center font-bold text-lg text-black no-underline hover:bg-zinc-100 transition-colors"
              >
                Crear mi primer protocolo
              </Link>
            </Section>

            {/* What You'll Learn */}
            <Section className="my-6 rounded-2xl bg-zinc-50 p-8 text-center">
              <Heading className="m-0 font-medium text-3xl text-zinc-800">
                ¿Qué podrás hacer?
              </Heading>
              <Text className="text-zinc-600 text-sm leading-5 mb-6">
                Descubre las herramientas que nuestros creadores más exitosos ya están usando
              </Text>

              <Row className="mt-6">
                <Column className="w-1/3 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Text className="text-white font-bold text-xl">📄</Text>
                  </div>
                  <Text className="font-medium text-blue-600 text-sm mb-2">
                    Membresías NFT
                  </Text>
                  <Text className="text-zinc-600 text-xs">
                    Crea acceso exclusivo con NFTs inteligentes
                  </Text>
                </Column>
                <Column className="w-1/3 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Text className="text-white font-bold text-xl">🎯</Text>
                  </div>
                  <Text className="font-medium text-green-600 text-sm mb-2">
                    Work-to-Earn
                  </Text>
                  <Text className="text-zinc-600 text-xs">
                    Activa tu comunidad con recompensas automáticas
                  </Text>
                </Column>
                <Column className="w-1/3 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Text className="text-white font-bold text-xl">🚀</Text>
                  </div>
                  <Text className="font-medium text-purple-600 text-sm mb-2">
                    Creator Economy
                  </Text>
                  <Text className="text-zinc-600 text-xs">
                    Protocolos diseñados para creadores independientes
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Testimonials Section */}
            <Section className="my-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-center text-white">
              <Heading className="m-0 font-medium text-2xl text-white">
                Lo que dicen nuestros creadores
              </Heading>

              <div className="mt-6 p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Text className="font-medium italic text-base text-white mb-2">
                  "Llevé mi Patreon con 5k/mes a 25k/mes solo con los primeros 3 protocolos que lancé en Pandora's"
                </Text>
                <Text className="text-zinc-400 text-sm">
                  - Laura, Artista Digital en Web3
                </Text>
              </div>

              <div className="mt-4 p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                <Text className="font-medium italic text-base text-white mb-2">
                  "Desde que usé Pandora's, mis usuarios no solo consumen contenido - construyen mi proyecto conmigo"
                </Text>
                <Text className="text-zinc-400 text-sm">
                  - DevCore, Comunidades Open Source
                </Text>
              </div>
            </Section>

            {/* Next Steps */}
            <Section className="my-6 rounded-2xl bg-blue-50 p-8 text-center">
              <Heading className="m-0 font-medium text-2xl text-blue-800">
                Próximos pasos
              </Heading>

              <div className="text-left mt-4 space-y-4">
                <Row>
                  <Column className="w-12 text-center pr-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      1
                    </div>
                  </Column>
                  <Column>
                    <Text className="font-medium text-blue-800 text-sm mb-1">
                      Inicia sesión en tu dashboard
                    </Text>
                    <Text className="text-zinc-600 text-xs">
                      Accede a herramientas avanzadas de analytics y gestión comunitaria
                    </Text>
                  </Column>
                </Row>

                <Row>
                  <Column className="w-12 text-center pr-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      2
                    </div>
                  </Column>
                  <Column>
                    <Text className="font-medium text-green-800 text-sm mb-1">
                      Explora plantillas
                    </Text>
                    <Text className="text-zinc-600 text-xs">
                      Desde membresías NFT hasta programas grants automáticos
                    </Text>
                  </Column>
                </Row>

                <Row>
                  <Column className="w-12 text-center pr-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      3
                    </div>
                  </Column>
                  <Column>
                    <Text className="font-medium text-purple-800 text-sm mb-1">
                      Lanza tu protocolo
                    </Text>
                    <Text className="text-zinc-600 text-xs">
                      Configura en minutos y empieza a construir comunidad activa
                    </Text>
                  </Column>
                </Row>
              </div>
            </Section>

            {/* CTA Final */}
            <Section className="pb-8 text-center">
              <Text className="text-zinc-800 text-xl leading-8 mb-6">
                ¿Preguntas? ¿Necesitas ayuda configurando tu primer protocolo?<br />
                Responde a este email o únete a nuestro Discord.
              </Text>
              <div className="flex gap-4 justify-center mb-6">
                <Link
                  href="https://dash.pandoras.finance/"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-center font-bold text-sm text-white no-underline hover:from-blue-500 hover:to-purple-500 transition-all"
                >
                  Ir al Dashboard
                </Link>
                <Link
                  href="{{DISCORD_INVITE}}"
                  className="inline-flex items-center rounded-full bg-zinc-900 px-8 py-4 text-center font-bold text-sm text-white no-underline hover:bg-zinc-800 transition-colors"
                >
                  Únete al Discord
                </Link>
              </div>
              <Text className="text-zinc-500 text-xs leading-5">
                Si no solicitaste este email, puedes ignorarlo con seguridad.
              </Text>
            </Section>

            {/* Footer */}
            <Section className="pb-6 text-center bg-zinc-50 pt-8">
              <Hr className="my-6" />
              <Text className="text-zinc-600 text-sm">
                © 2025 Pandora's Finance. Construyendo el futuro de las comunidades digitales.
              </Text>
              <Text className="text-zinc-400 text-xs mt-2">
                Email enviado desde {source} • {new Date().getFullYear()}
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

// Preview para desarrollo
PandorasWelcomeEmail.PreviewProps = {
  email: 'usuario@ejemplo.com',
  name: 'Futuro Creador',
  source: 'landing-start',
};

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
  source = 'creator-onboarding',
}: PandorasWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>¡Bienvenido! Empieza la Conversación para lanzar tu Protocolo.</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto w-full max-w-[600px] p-0">

            {/* HEADER */}
            <Section className="p-8 text-center">
              <Text className="mx-0 mt-4 mb-6 p-0 text-center font-normal text-2xl">
                <span className="font-bold tracking-tighter">Pandora's Finance</span>
              </Text>
              <Text className="font-normal text-sm uppercase tracking-wider text-gray-600">
                Bienvenido a la comunidad
              </Text>

              <Heading className="my-4 font-medium text-4xl leading-tight text-gray-900">
                ¡Tu viaje comienza ahora!
              </Heading>

              <Text className="mb-6 text-lg leading-8 text-gray-700">
                {name}, prepárate para descubrir cómo revolucionar el mundo del contenido.
              </Text>

              <Link
                href="https://dash.pandoras.finance/apply"
                className="inline-flex items-center rounded-full bg-gray-900 px-12 py-4 text-center font-bold text-sm text-white no-underline"
              >
                ¡Empezar a Crear!
              </Link>
            </Section>

            {/* HERO / CTA */}
            <Section className="my-6 rounded-2xl bg-fuchsia-500/10 bg-[radial-gradient(circle_at_bottom_right,#6214f0_0%,transparent_60%)] p-8 text-center">
              <Heading className="m-0 font-medium text-3xl text-fuchsia-900">
                ¡Bienvenido a Pandora's!
              </Heading>
              <Text className="my-4 font-medium text-xl text-gray-900 leading-7">
                Gracias por unirte a la revolución de las comunidades soberanas.
              </Text>
              <Text className="text-gray-700 text-sm leading-6 mb-6">
                Estás a punto de transformar cómo interactúas con tu comunidad digital.  
                Sin intermediarios, sin comisiones abusivas, solo poder creativo puro.
              </Text>

              <Link
                href="https://dash.pandoras.finance/apply"
                className="inline-flex items-center rounded-full bg-gray-900 px-10 py-4 text-center font-bold text-sm text-white no-underline"
              >
                ¡Empezar a Crear!
              </Link>
            </Section>

            {/* FEATURES */}
            <Section className="my-6 rounded-2xl bg-zinc-50 p-8 text-center">
              <Heading className="m-0 font-medium text-3xl text-zinc-800">
                ¿Qué podrás hacer?
              </Heading>
              <Text className="text-zinc-600 text-sm leading-5 mb-6">
                Descubre las herramientas que nuestros creadores más exitosos ya están usando.
              </Text>

              <Row className="mt-6">

                <Column className="w-1/3 text-center">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Text className="text-fuchsia-700 font-bold text-xl">📄</Text>
                  </div>
                  <Text className="font-medium text-fuchsia-700 text-sm mb-1">Membresías NFT</Text>
                  <Text className="text-zinc-600 text-xs">Acceso con NFTs inteligentes</Text>
                </Column>

                <Column className="w-1/3 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Text className="text-green-600 font-bold text-xl">🎯</Text>
                  </div>
                  <Text className="font-medium text-green-700 text-sm mb-1">Work-to-Earn</Text>
                  <Text className="text-zinc-600 text-xs">Activa tu comunidad con recompensas</Text>
                </Column>

                <Column className="w-1/3 text-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Text className="text-purple-600 font-bold text-xl">🚀</Text>
                  </div>
                  <Text className="font-medium text-purple-700 text-sm mb-1">Creator Economy</Text>
                  <Text className="text-zinc-600 text-xs">Protocolos para creadores</Text>
                </Column>

              </Row>
            </Section>

            {/* TESTIMONIOS */}
            <Section className="my-6 rounded-2xl bg-zinc-800/10 bg-[radial-gradient(circle_at_bottom_right,#4b5563_0%,transparent_60%)] p-8 text-center">
              <Heading className="m-0 font-medium text-3xl text-zinc-900">
                Lo que dicen nuestros creadores
              </Heading>

              <div className="mt-6 p-6 bg-white shadow-sm rounded-lg">
                <Text className="font-medium italic text-base text-gray-900 mb-2">
                  "Llevé mi Patreon con 5k/mes a 25k/mes solo con los primeros 3 protocolos que lancé en Pandora's"
                </Text>
                <Text className="text-zinc-600 text-sm">
                  – Laura, Artista Digital
                </Text>
              </div>

              <div className="mt-4 p-6 bg-white shadow-sm rounded-lg">
                <Text className="font-medium italic text-base text-gray-900 mb-2">
                  "Mis usuarios no solo consumen contenido – construyen mi proyecto conmigo"
                </Text>
                <Text className="text-zinc-600 text-sm">
                  – DevCore, Comunidades Open Source
                </Text>
              </div>
            </Section>

            {/* PASOS */}
            <Section className="my-6 rounded-2xl bg-fuchsia-50 p-8 text-center">
              <Heading className="m-0 font-medium text-3xl text-purple-900">
                El Mapa de tu Éxito
              </Heading>

              <div className="text-left mt-6 space-y-6">

                {/* Step 1 */}
                <Row>
                  <Column className="w-12 text-center pr-3">
                    <div className="w-9 h-9 bg-fuchsia-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                  </Column>
                  <Column>
                    <Text className="font-medium text-purple-900 text-sm mb-1">
                      Inicia la Conversación: Identidad y Comunidad
                    </Text>
                    <Text className="text-zinc-600 text-xs">
                      Crea tu perfil público y conecta tus redes sociales.
                    </Text>
                  </Column>
                </Row>

                {/* Step 2 */}
                <Row>
                  <Column className="w-12 text-center pr-3">
                    <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                  </Column>
                  <Column>
                    <Text className="font-medium text-purple-900 text-sm mb-1">
                      Define la Utilidad y Economía
                    </Text>
                    <Text className="text-zinc-600 text-xs">
                      Mecánica de Utilidad, Monetización y Recompensas.
                    </Text>
                  </Column>
                </Row>

                {/* Step 3 */}
                <Row>
                  <Column className="w-12 text-center pr-3">
                    <div className="w-9 h-9 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                  </Column>
                  <Column>
                    <Text className="font-medium text-red-900 text-sm mb-1">
                      Revisión Final y Aprobación
                    </Text>
                    <Text className="text-zinc-600 text-xs">
                      Tu proyecto pasa a revisión por el comité.
                    </Text>
                  </Column>
                </Row>

              </div>
            </Section>

            {/* CTA FINAL */}
            <Section className="pb-8 text-center">
              <Text className="text-gray-900 text-xl leading-8 mb-6">
                ¿Preguntas? ¿Necesitas ayuda con tu primer protocolo?
              </Text>

              <Link
                href="https://dash.pandoras.finance/apply"
                className="inline-flex items-center rounded-full bg-gray-900 px-12 py-4 text-center font-bold text-sm text-white no-underline"
              >
                ¡Lanzar Mi Protocolo!
              </Link>

              <Link
                href="{{DISCORD_INVITE}}"
                className="mt-4 inline-flex items-center rounded-full bg-gray-700 px-10 py-3 text-center font-bold text-sm text-white no-underline"
              >
                Únete al Discord
              </Link>

              <Text className="mt-6 text-zinc-500 text-xs">
                Si no solicitaste este email, ignóralo con seguridad.
              </Text>
            </Section>

            {/* FOOTER */}
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

PandorasWelcomeEmail.PreviewProps = {
  email: 'usuario@ejemplo.com',
  name: 'Futuro Creador',
  source: 'landing-start',
};

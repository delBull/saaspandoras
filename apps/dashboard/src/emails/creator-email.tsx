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
  whatsappLink?: string;
}

// Valores por defecto
const DEFAULT_EIGHT_Q_MESSAGE = encodeURIComponent("Hola, quiero iniciar mi evaluación de 8 preguntas");
const DEFAULT_WHATSAPP_LINK = `https://wa.me/5213221374392?text=${DEFAULT_EIGHT_Q_MESSAGE}`;

export default function PandorasWelcomeEmail({
  email,
  name = 'Futuro Creador',
  source = 'creator-onboarding',
  whatsappLink = DEFAULT_WHATSAPP_LINK,
}: PandorasWelcomeEmailProps) {
  const previewText = "Tu acceso al Dossier Técnico de Protocolos – Pandora's";
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>{previewText}</Preview>
        <Body className="bg-white font-sans">
          <Container className="mx-auto w-full max-w-[600px] p-0">

            {/* HEADER */}
            <Section className="p-8 text-center">
              <Text className="mx-0 mt-4 mb-6 p-0 text-center font-normal text-2xl">
                <span className="font-bold tracking-tighter">Pandora's Finance</span>
              </Text>
              <Text className="font-normal text-sm uppercase tracking-wider text-gray-600">
                Dossier Técnico de Protocolos
              </Text>

              <Heading className="my-4 font-medium text-4xl leading-tight text-gray-900">
                Tu acceso al Dossier Técnico de Protocolos
              </Heading>

              <Text className="mb-6 text-lg leading-8 text-gray-700">
                {name}, gracias por registrarte en el Panel de Control de Pandora's.
              </Text>

              <Link
                href="https://dash.pandoras.finance/apply"
                className="inline-flex items-center rounded-full bg-blue-600 px-12 py-4 text-center font-bold text-sm text-white no-underline hover:bg-blue-700"
              >
                🏗️ Lanzar Mi Primer Protocolo
              </Link>
            </Section>

            {/* MAIN CONTENT */}
            <Section className="my-6 rounded-2xl bg-gray-50 p-8">
              <Heading className="m-0 font-medium text-2xl text-gray-900 mb-4 text-left">
                Antes de lanzar tu Protocolo de Utilidad, aquí tienes los tres recursos clave que necesitarás:
              </Heading>

              <Text className="text-gray-700 text-base leading-6 mb-6">
                Construir un protocolo de utilidad requiere entender exactamente cómo funcionan internamente estos mecanismos de participación verificable.
              </Text>

              {/* RESOURCE 1 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Text className="text-white font-bold text-sm">1</Text>
                  </div>
                  <div className="flex-grow">
                    <Heading className="text-lg font-bold text-blue-900 mb-2">
                      📋 Guía de Implementación de Protocolos (Litepaper Técnico)
                    </Heading>
                    <Text className="text-gray-800 mb-3">
                      <strong>Una explicación clara sobre:</strong>
                    </Text>
                    <div className="ml-4 space-y-2">
                      <Text className="text-gray-700 text-sm">• Qué es un Protocolo de Utilidad (vs tokens especulativos)</Text>
                      <Text className="text-gray-700 text-sm">• Cómo funcionan internamente (acciones verificables, flujos, roles)</Text>
                      <Text className="text-gray-700 text-sm">• Cómo se diferencia de un token especulativo</Text>
                    </div>
                    <Text className="text-gray-600 text-xs italic mt-3 mb-1">
                      "Este Litepaper define el marco técnico bajo el cual operamos. Su lectura es clave antes de avanzar."
                    </Text>
                    <Link
                      href="https://dash.pandoras.finance/uploads/Lanza_tu_protcolo_de_utilidad.pdf"
                      className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium mt-4 hover:bg-blue-700 no-underline"
                    >
                      📥 Descargar Guía (PDF)
                    </Link>
                  </div>
                </div>
              </div>

              {/* RESOURCE 2 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Text className="text-white font-bold text-sm">2</Text>
                  </div>
                  <div className="flex-grow">
                    <Heading className="text-lg font-bold text-green-900 mb-2">
                      🔧 Contratos Pre-Auditadas
                    </Heading>
                    <Text className="text-gray-700 mb-3">
                      Ssmart contracts para protocolos de utilidad, ya auditados y listos para deploy.
                      Evitan costos de auditorías mientras mantienen la seguridad blockchain.
                    </Text>
                  </div>
                </div>
              </div>

              {/* RESOURCE 3 */}
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <Text className="text-white font-bold text-sm">3</Text>
                  </div>
                  <div className="flex-grow">
                    <Heading className="text-lg font-bold text-purple-900 mb-2">
                      ⚖️ Cumplimiento Regulatorio
                    </Heading>
                    <Text className="text-gray-700 mb-3">
                      Verificamos que tu protocolo se mantiene en la zona verde legal para protocolos de utilidad.
                      Evita problemas con reguladores de valores.
                    </Text>
                  </div>
                </div>
              </div>
            </Section>

            {/* TECHNICAL CTA */}
            <Section className="my-6 rounded-2xl bg-slate-800 p-8 text-center text-white">
              <Heading className="m-0 font-medium text-2xl text-white mb-4">
                ¿Listo para la Revolución Técnica?
              </Heading>
              <Text className="text-gray-300 text-base leading-6 mb-6">
                Los protocolos de utilidad no son hype - son la arquitectura que sostiene las comunidades del futuro.
                Cada protocolo que construyes en Pandora's contribuye a esta nueva infraestructura.
              </Text>

              <Link
                href="https://dash.pandoras.finance/apply"
                className="inline-flex items-center rounded-full bg-blue-600 px-8 py-4 text-center font-bold text-sm text-white no-underline hover:bg-blue-700"
              >
                🔧 Ir al Dashboard de Construcción
              </Link>
            </Section>

            {/* SUPPORT CTA */}
            <Section className="pb-8 text-center">
              <Text className="text-gray-900 text-lg leading-8 mb-6">
                ¿Tienes preguntas técnicas sobre protocolos de utilidad?
                ¿Necesitas clarification sobre algún punto específico?
              </Text>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={whatsappLink}
                  className="inline-flex items-center rounded-full bg-green-600 px-8 py-4 text-center font-bold text-sm text-white no-underline hover:bg-green-700"
                >
                  🚀 Comenzar ahora
                </Link>

                <Link
                  href="{{DISCORD_INVITE}}"
                  className="inline-flex items-center rounded-full bg-gray-700 px-8 py-4 text-center font-bold text-sm text-white no-underline hover:bg-gray-600"
                >
                  💬 Comunidad Discord
                </Link>
              </div>
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

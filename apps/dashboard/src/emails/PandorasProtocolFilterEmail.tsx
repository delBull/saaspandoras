import {
  Html,
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface PandorasProtocolFilterEmailProps {
  name?: string;
  applyLink?: string;
  whatsappLink?: string;
}

// Valores por defecto
const DEFAULT_APPLY_LINK = "https://dash.pandoras.finance/apply";
const DEFAULT_UTILITY_MESSAGE = encodeURIComponent("Estoy interesado en crear un utility protocol funcional");
const DEFAULT_WHATSAPP_LINK = `https://wa.me/5213221374392?text=${DEFAULT_UTILITY_MESSAGE}`;
const ACCENT_COLOR_BLUE = '#2563EB';
const ACCENT_COLOR_GREEN = '#10B981';

export default function PandorasProtocolFilterEmail({
  name = "Creador",
  applyLink = DEFAULT_APPLY_LINK,
  whatsappLink = DEFAULT_WHATSAPP_LINK,
}: PandorasProtocolFilterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Desbloquea el Potencial: Únete a la Próxima Generación de Utilidad Web3 con Utility-Protocol.</Preview>

      <Tailwind>
        <Body className="bg-white font-sans text-gray-900">

          <Container className="mx-auto w-full max-w-[600px] p-0">

            {/* HEADER / INTRO */}
            <Section className="p-8 text-center">
              <Text className="font-bold tracking-tighter text-2xl m-0 mb-2">
                Utility-Protocol
              </Text>
              <Text className="text-gray-600 text-xs uppercase tracking-wider">
                Filtro de Viabilidad de Arquitectura
              </Text>

              <Heading className="mt-6 mb-4 text-4xl font-semibold leading-tight">
                Desbloquea el Potencial de tu Utilidad Web3.
              </Heading>

              <Text className="text-lg text-gray-700 leading-7 mb-6">
                {name}, estamos redefiniendo cómo se crea, se valida y se recompensa el valor en la cadena de bloques. No hablamos solo de tokens; hablamos de sistemas reales de Work-to-Earn (W2E) verificable.
              </Text>
            </Section>

            {/* VALUE PROPOSITION BLOCK (W2E FOCUS) */}
            <Section className="bg-blue-50 p-8 rounded-2xl my-4 border border-blue-200">
              <Heading className="text-2xl font-semibold mb-3 text-gray-900 text-center">
                Tu Oportunidad en la Nueva Economía Digital
              </Heading>

              <Row className="space-y-3 text-left">
                <Column>
                  <Text className="text-gray-800 text-base leading-6 mb-1">
                    🌟 Impacto Real: Participa en un protocolo que asegura que cada contribución de trabajo se entrelace con una recompensa verificable y automatizada.
                  </Text>
                  <Text className="text-gray-800 text-base leading-6 mb-1">
                    🏛️ Asegura tu Lugar en el DAO: Conviértete en un validador clave y ejerce influencia sobre el futuro del protocolo.
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* DUAL CTA BLOCK (APPLY / 8 QUESTIONS) */}
            <Section className="p-8 rounded-2xl bg-gray-900 my-4 text-center text-white">
              <Heading className="text-3xl font-semibold text-white mb-4">
                ¿Listo para dar el primer paso?
              </Heading>

              <Text className="text-gray-400 text-base leading-6 mb-8">
                Creemos en la transparencia. Elige el camino que mejor se adapte a tu nivel de claridad actual.
              </Text>

              <Row>
                <Column className="w-1/2 p-2">
                  <Text className="text-xl font-bold text-yellow-400 mb-2">
                    1. Aplicar Directamente
                  </Text>
                  <Text className="text-gray-400 text-sm mb-4">
                    Si ya tienes clara la visión y la estructura de tu W2E, inicia tu proceso de validación.
                  </Text>
                  <Link
                    href={applyLink}
                    className="inline-block bg-yellow-500 text-black font-bold text-base rounded-full px-6 py-3 no-underline"
                    style={{
                      backgroundColor: '#EAB308',
                      color: '#000',
                      padding: '12px 24px',
                      textDecoration: 'none',
                      borderRadius: '50px'
                    }}
                  >
                    APLICAR AHORA
                  </Link>
                </Column>
                <Column className="w-1/2 p-2">
                  <Text className="text-xl font-bold text-green-400 mb-2">
                    2. Ver 8 Preguntas Clave
                  </Text>
                  <Text className="text-gray-400 text-sm mb-4">
                    Si prefieres entender mejor los requisitos de utilidad que buscamos, consúltalas vía WhatsApp.
                  </Text>
                  <Link
                    href={whatsappLink}
                    className="inline-block bg-transparent border border-green-500 text-green-500 font-bold text-base rounded-full px-6 py-3 no-underline"
                    style={{
                      color: ACCENT_COLOR_GREEN,
                      padding: '12px 24px',
                      textDecoration: 'none',
                      borderRadius: '50px',
                      border: `2px solid ${ACCENT_COLOR_GREEN}`
                    }}
                  >
                    VER PREGUNTAS (WA)
                  </Link>
                </Column>
              </Row>
            </Section>

            {/* CLOSING */}
            <Section className="p-8 text-center">
              <Text className="text-gray-800 text-base leading-7 italic mb-4">
                No dejes pasar la oportunidad de ser parte de la infraestructura que está tejiendo el futuro del trabajo digital.
              </Text>

              <Text className="text-gray-700 text-sm leading-6 mt-4">
                ¡Te esperamos en Utility-Protocol!
              </Text>
            </Section>

            {/* FOOTER */}
            <Section className="pb-8 text-center bg-gray-50 pt-8 mt-4">
              <Hr className="my-6" />
              <Text className="text-gray-600 text-sm">
                © {new Date().getFullYear()} Pandora's Finance
              </Text>
              <Text className="text-gray-500 text-xs mt-1">
                Construyendo protocolos inmutables de utilidad.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

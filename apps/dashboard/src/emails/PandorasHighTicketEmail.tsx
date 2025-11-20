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

interface PandorasHighTicketEmailProps {
  name?: string;
  whatsappLink?: string;
  source?: string;
}

const DEFAULT_WHATSAPP_NUMBER = "5213221374392";
const DEFAULT_FOUNDERS_MESSAGE = encodeURIComponent("Hola, soy founder y quiero aplicar al programa de Pandora's. Tengo capital disponible.");

export default function PandorasHighTicketEmail({
  name = "Founder",
  whatsappLink = `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}?text=${DEFAULT_FOUNDERS_MESSAGE}`,
  source = "founders-program",
}: PandorasHighTicketEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Pandora’s Inner Circle — Solo 5 fundadores ingresan cada ciclo.</Preview>

      <Tailwind>
        <Body className="bg-white font-sans text-gray-900">

          <Container className="mx-auto w-full max-w-[600px] p-0">

            {/* HEADER */}
            <Section className="p-8 text-center">
              <Text className="font-bold tracking-tighter text-2xl m-0 mb-2">
                Pandora's Finance
              </Text>
              <Text className="text-gray-600 text-xs uppercase tracking-wider">
                Programa inner Circle
              </Text>

              <Heading className="mt-6 mb-4 text-4xl font-semibold leading-tight">
                {name}, sabes que estás aquí por algo importante.
              </Heading>

              <Text className="text-lg text-gray-700 leading-7 mb-6">
                No cualquier founder construye con capital. El programa Founders de Pandora's está hecho para quienes están listos para ejecutar a un nivel superior.
              </Text>
            </Section>

            {/* VALUE PROP BLOCK */}
            <Section className="bg-yellow-50 p-8 rounded-2xl my-4 border border-yellow-200">
              <Text className="text-base text-gray-800 leading-7">
                Abriendo solo para <strong>5 founders por semestre</strong> — necesitamos preservar la calidad del programa. Los lugares van rápido.
              </Text>

              <Text className="mt-4 text-base text-gray-800 leading-7">
                Los founders que aplican aquí entienden: no se trata de hype o especulación. Se trata de construir infraestructura Web3 preparada para producción real.
              </Text>
            </Section>

            {/* CRITERIA BLOCK */}
            <Section className="p-8 rounded-2xl bg-gray-50 my-4">
              <Heading className="text-2xl font-semibold text-center mb-3 text-gray-900">
                ¿Es este programa para ti?
              </Heading>

              <Text className="text-gray-700 text-sm leading-6 text-center mb-6">
                Evalúa si cumples con estos criterios básicos:
              </Text>

              <Row className="space-y-4 text-left">
                <Column>
                  <Text className="text-gray-800 text-base leading-6 mb-3">
                    ✅ Tienes un producto web con al menos 100 usuarios activos<br/>
                    ✅ Cuentas con capital para cubrir desarrollo ($5,000-13,000)<br/>
                    ✅ Estás preparado para invertir tiempo en una transición Web3<br/>
                    ✅ Entiendes que el éxito va más allá de smart contracts
                  </Text>
                </Column>
              </Row>

              <Text className="text-center text-sm text-gray-600 mt-4 italic">
                Si marcaste al menos 3 de las 4... definitivamente deberías continuar leyendo.
              </Text>
            </Section>

            {/* PROCESS BLOCK */}
            <Section className="p-8">
              <Heading className="text-2xl font-semibold mb-4 text-gray-900">
                Qué incluye el proceso Innver Circle:
              </Heading>

              <Row className="text-left space-y-3">
                <Column>
                  <Text className="text-gray-700 leading-6">
                    <strong>Diagnóstico técnico inicial:</strong> Evaluación detallada de tu producto, comunidad y análisis técnico (2-3 días).<br/><br/>

                    <strong>Arquitectura a medida:</strong> Diseño de 3-5 protocolos de utilidad básicos + tokenomics preliminares.<br/><br/>

                    <strong>Desarrollo acelerado:</strong> Deployment en nuestra plataforma ModularFactory + plantillas pre-auditadas.<br/><br/>

                    <strong>Apoyo post-lanzamiento:</strong> 30 días de soporte técnico + consejos para community building.
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* BLACK CTA BLOCK */}
            <Section className="bg-black p-8 rounded-2xl text-center text-white">
              <Heading className="text-3xl font-semibold text-yellow-400 mb-4">
                ¿Listo para dar el paso?
              </Heading>

              <Text className="text-gray-200 text-base leading-6 mb-6">
                El formulario inicial toma unos 15 minutos y nos ayuda a prepararte mejor. Te garantizamos respuesta en 24 horas.
              </Text>

              <Link
                href="https://dash.pandoras.finance/apply"
                className="inline-block bg-yellow-500 text-black font-bold text-lg rounded-full px-8 py-4 no-underline"
                style={{
                  backgroundColor: '#EAB308',
                  color: '#000',
                  padding: '16px 32px',
                  textDecoration: 'none',
                  borderRadius: '50px'
                }}
              >
                Aplicar Ahora - Inner Circle
              </Link>

              <Text className="mt-4 text-gray-400 text-sm">
                Sin compromiso. Solo founders serios. Nuestro equipo es igual de selectivo.
              </Text>

              {/* Secondary CTA */}
              <Link
                href={whatsappLink}
                className="mt-6 inline-block bg-transparent border border-white text-white font-bold text-sm rounded-full px-6 py-3 no-underline"
                style={{
                  backgroundColor: 'transparent',
                  color: '#fff',
                  padding: '12px 24px',
                  textDecoration: 'none',
                  borderRadius: '50px',
                  border: '1px solid #fff',
                  marginTop: '24px'
                }}
              >
                O agendar una llamada directa →
              </Link>
            </Section>

            {/* SOCIAL PROOF */}
            <Section className="p-8 text-center bg-gray-50">
              <Text className="text-gray-700 text-sm italic mb-4">
                "Invirtieron tiempo en entender mi visión antes de tocar código. Eso dice mucho de la calidad de su equipo."
              </Text>
              <Text className="text-gray-500 text-xs">
                — Founder que acaba de lanzar su protocolo membrecías premium
              </Text>
            </Section>

            {/* CLOSING */}
            <Section className="p-8 text-center">
              <Text className="text-gray-800 text-base leading-7 italic mb-4">
                El mundo Web3 necesita más constructores y menos especuladores. Si eres un constructor, este programa está hecho para ti.
              </Text>

              <Link
                href="https://pandoras.finance/apply"
                className="underline text-blue-600"
                style={{
                  color: '#2563EB',
                  textDecoration: 'underline'
                }}
              >
                pandoras.finance/apply →
              </Link>

              <Text className="text-gray-700 text-sm leading-6 mt-4">
                Estamos aquí para responder cualquier duda previa a aplicar.
              </Text>
            </Section>

            {/* FOOTER */}
            <Section className="pb-8 text-center bg-yellow-50 pt-8 mt-4">
              <Hr className="my-6" />
              <Text className="text-gray-600 text-sm">
                © {new Date().getFullYear()} Pandora's Finance
              </Text>
              <Text className="text-yellow-700 text-xs mt-1">
                Correo exclusivo del Inner Circle Program — Espacio limitado de 5 fundadores al semestre
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

PandorasHighTicketEmail.PreviewProps = {
  name: "Founder",
  whatsappLink: `https://wa.me/${DEFAULT_WHATSAPP_NUMBER}?text=${DEFAULT_FOUNDERS_MESSAGE}`,
  source: "founders-preview",
};

export { PandorasHighTicketEmail };

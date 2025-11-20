import {
  Html,
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
  Button,
} from "@react-email/components";

interface PandorasProtocolFilterEmailProps {
  name?: string;
  contactEmail?: string;
  whatsappLink?: string;
}

const mainColor = "#4F46E5"; // Indigo-600
const accentColor = "#06B6D4"; // Cyan-500

export default function PandorasProtocolFilterEmail({
  name = "Creador",
  contactEmail = "arquitectura@pandoras.finance",
  whatsappLink,
}: PandorasProtocolFilterEmailProps) {
  const previewText = "Tu Protocolo ha entrado a la Fase de Viabilidad de Arquitectura. Próximos pasos.";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>

      <Tailwind>
        <Body className="bg-white font-sans text-gray-900">

          <Container className="mx-auto w-full max-w-[600px] p-0 shadow-lg border border-gray-100">

            {/* HEADER / LOGO */}
            <Section className="p-8 text-center bg-gray-50 border-b border-gray-100">
              <Text className="font-extrabold tracking-tighter text-3xl m-0 mb-1 text-gray-900">
                Pandora's Finance
              </Text>
              <Text className="text-gray-500 text-xs uppercase tracking-widest">
                Protocolos de Utilidad y Arquitectura SC
              </Text>
            </Section>

            {/* CONTENIDO PRINCIPAL */}
            <Section className="p-8">
              <Heading className="mt-0 mb-4 text-3xl font-bold leading-tight text-gray-900">
                {name}, tu Arquitectura de Utilidad está en Revisión.
              </Heading>

              <Text className="text-lg text-gray-700 leading-7 mb-6">
                Hemos recibido las respuestas a las <strong>8 Preguntas Clave</strong>. Esto nos da la información crítica para evaluar la **Viabilidad Funcional** y la **Claridad Operativa** de tu Creación.
              </Text>

              <Section className="my-6 p-4 rounded-xl border-l-4" style={{ borderColor: accentColor, backgroundColor: '#F0FFFF' }}>
                <Text className="text-base font-semibold text-gray-800 m-0">
                    Siguiente Etapa: Análisis de Arquitectura
                </Text>
                <Text className="text-sm text-gray-600 mt-2 m-0">
                    Nuestro equipo técnico revisará los siguientes puntos extraídos de tu aplicación: **Mecanismo W2E**, **Flujo de Usuario**, y **Claridad de Roles Operativos**.
                </Text>
              </Section>

              <Text className="text-base text-gray-700 leading-7 mt-6">
                Este proceso de *due diligence* asegura que solo los Protocolos más sólidos avancen al **Fuzz Testing** y a la **ModularFactory** de *Deployment*.
              </Text>

              {/* WhatsApp CTA */}
              {whatsappLink && (
                <Section className="mt-6 text-center">
                  <Text className="text-sm text-gray-600 mb-2">Necesitas hablar con un estratega inmediatamente?</Text>
                  <Button
                    href={whatsappLink}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                    style={{ backgroundColor: '#059669', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    📱 Hablar por WhatsApp
                  </Button>
                </Section>
              )}
            </Section>

            {/* CTA BLOCK */}
            <Section className="py-6 px-8 text-center bg-indigo-50/50">
              <Text className="text-xl font-bold text-gray-900 m-0 mb-4">
                ¿Tienes dudas sobre tu Mecanismo W2E?
              </Text>
              <Button
                href={`mailto:${contactEmail}?subject=${encodeURIComponent("Consulta Rápida sobre Filtro de 8 Preguntas")}`}
                className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-md hover:bg-indigo-700 transition-colors"
                style={{ backgroundColor: mainColor }}
              >
                Contactar a un Estratega
              </Button>
            </Section>

            {/* FOOTER */}
            <Section className="p-8 text-center bg-gray-900">
              <Hr className="border-gray-700 my-4" />
              <Text className="text-xs text-gray-500 m-0">
                © {new Date().getFullYear()} Pandora's Finance. Todos los derechos reservados.
              </Text>
              <Text className="text-xs text-gray-500 m-0 mt-1">
                Construyendo protocolos inmutables de utilidad.
              </Text>
            </Section>

          </Container>

        </Body>
      </Tailwind>
    </Html>
  );
}

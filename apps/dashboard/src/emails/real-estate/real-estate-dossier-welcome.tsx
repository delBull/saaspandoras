import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Link,
  Hr,
  Button,
  Tailwind
} from "@react-email/components";
import * as React from "react";

interface RealEstateDossierWelcomeEmailProps {
  leadName?: string;
  developmentName?: string;
  location?: string;
  legalStructure?: string;
  dataRoomUrl?: string;
  whatsappUrl?: string;
}

export const RealEstateDossierWelcomeEmail = ({
  leadName = "Inversionista",
  developmentName = "Desarrollo Residencial",
  location = "Riviera Nayarit, México",
  legalStructure = "Fideicomiso Fiduciario Irrevocable",
  dataRoomUrl = "https://dash.pandoras.finance",
  whatsappUrl = "https://wa.me/5213221374392"
}: RealEstateDossierWelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Dossier Ejecutivo de Inversión — {developmentName}</Preview>
      <Tailwind>
        <Body className="bg-[#070709] text-zinc-200 font-sans my-auto mx-auto p-4">
          <Container className="border border-zinc-800 bg-[#09090D] rounded-2xl mx-auto p-8 max-w-[580px] shadow-2xl">
            
            {/* Header / Brand */}
            <Section className="text-center pb-6 border-b border-zinc-800">
              <Text className="text-xs uppercase font-mono tracking-widest text-[#D4AF37] m-0">
                Data Room Oficial · Expediente de Inversión
              </Text>
              <Heading className="text-2xl font-light text-white mt-2 mb-1">
                {developmentName}
              </Heading>
              <Text className="text-xs text-zinc-400 m-0">
                {location}
              </Text>
            </Section>

            {/* Greeting */}
            <Section className="pt-6 pb-4">
              <Text className="text-sm text-zinc-300 leading-relaxed">
                Estimado/a <strong className="text-white">{leadName}</strong>,
              </Text>
              <Text className="text-sm text-zinc-400 leading-relaxed">
                Ponemos a tu disposición el expediente ejecutivo y la documentación jurídica autorizada para el proyecto <strong className="text-white">{developmentName}</strong>.
              </Text>
            </Section>

            {/* Key Project Highlights */}
            <Section className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 my-4">
              <Text className="text-xs font-mono uppercase text-zinc-400 mb-2 font-semibold">
                Ficha Técnica Resumida
              </Text>
              <Text className="text-xs text-zinc-300 m-1">
                📍 <strong>Ubicación:</strong> {location}
              </Text>
              <Text className="text-xs text-zinc-300 m-1">
                🏛️ <strong>Certeza Jurídica:</strong> {legalStructure}
              </Text>
              <Text className="text-xs text-zinc-300 m-1">
                📂 <strong>Documentos Disponibles:</strong> Permisos, planos arquitectónicos y corrida financiera
              </Text>
            </Section>

            {/* CTA Button */}
            <Section className="text-center py-6">
              <Button
                href={dataRoomUrl}
                className="bg-[#D4AF37] text-black font-semibold text-xs px-6 py-3.5 rounded-xl no-underline inline-block shadow-lg"
              >
                Abrir Data Room del Proyecto
              </Button>
            </Section>

            <Text className="text-xs text-zinc-400 text-center leading-relaxed">
              ¿Deseas atención inmediata o revisar opciones de financiamiento directo?{" "}
              <Link href={whatsappUrl} className="text-[#D4AF37] underline">
                Escríbenos por WhatsApp
              </Link>.
            </Text>

            <Hr className="border-zinc-800 my-6" />

            {/* Safe Harbor Footer */}
            <Section>
              <Text className="text-[11px] text-zinc-500 text-center leading-relaxed">
                ⚠️ <strong>Aviso de Transparencia:</strong> Toda la información contenida en este expediente proviene de los expedientes oficiales del desarrollo. Las proyecciones de plusvalía no constituyen rendimientos financieros garantizados.
              </Text>
              <Text className="text-[10px] text-zinc-600 text-center mt-2 font-mono">
                Hermes Revenue Closer · Pandoras Growth OS
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default RealEstateDossierWelcomeEmail;

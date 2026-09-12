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

interface RealEstateCalculatorSummaryProps {
  leadName?: string;
  developmentName?: string;
  propertyType?: string;
  simulatedPriceUsd?: string;
  downPaymentUsd?: string;
  monthlyPaymentUsd?: string;
  termMonths?: number;
  projectedAppreciationPercentage?: string;
  portalCalculatorUrl?: string;
  whatsappUrl?: string;
}

export const RealEstateCalculatorSummaryEmail = ({
  leadName = "Inversionista",
  developmentName = "Desarrollo Residencial",
  propertyType = "Lote Residencial",
  simulatedPriceUsd = "$45,000 USD",
  downPaymentUsd = "$9,000 USD (20%)",
  monthlyPaymentUsd = "$1,000 USD",
  termMonths = 36,
  projectedAppreciationPercentage = "18% anual",
  portalCalculatorUrl = "https://dash.pandoras.finance",
  whatsappUrl = "https://wa.me/5213221374392"
}: RealEstateCalculatorSummaryProps) => {
  return (
    <Html>
      <Head />
      <Preview>Resumen de Simulación Financiera — {developmentName}</Preview>
      <Tailwind>
        <Body className="bg-[#070709] text-zinc-200 font-sans my-auto mx-auto p-4">
          <Container className="border border-zinc-800 bg-[#09090D] rounded-2xl mx-auto p-8 max-w-[580px] shadow-2xl">
            
            {/* Header */}
            <Section className="text-center pb-6 border-b border-zinc-800">
              <Text className="text-xs uppercase font-mono tracking-widest text-[#D4AF37] m-0">
                Simulador Financiero Oficial
              </Text>
              <Heading className="text-2xl font-light text-white mt-2 mb-1">
                {developmentName}
              </Heading>
              <Text className="text-xs text-zinc-400 m-0">
                Proyección de Inversión y Corrida Financiera
              </Text>
            </Section>

            {/* Content */}
            <Section className="pt-6 pb-4">
              <Text className="text-sm text-zinc-300 leading-relaxed">
                Hola <strong className="text-white">{leadName}</strong>, aquí tienes el resumen detallado de la simulación que realizaste en el portal oficial de <strong className="text-white">{developmentName}</strong>.
              </Text>
            </Section>

            {/* Simulation Results Box */}
            <Section className="p-5 rounded-xl bg-zinc-900/80 border border-zinc-800 my-4 space-y-2">
              <Text className="text-xs font-mono uppercase text-zinc-400 mb-3 font-semibold">
                Parámetros de tu Corrida
              </Text>
              
              <div className="flex justify-between py-1 border-b border-zinc-800/60 text-xs">
                <span className="text-zinc-400">Tipo de Propiedad:</span>
                <span className="text-white font-medium">{propertyType}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/60 text-xs">
                <span className="text-zinc-400">Valor Simulado:</span>
                <span className="text-white font-semibold">{simulatedPriceUsd}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/60 text-xs">
                <span className="text-zinc-400">Enganche Estimado:</span>
                <span className="text-amber-400 font-medium">{downPaymentUsd}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-zinc-800/60 text-xs">
                <span className="text-zinc-400">Mensualidad ({termMonths} meses):</span>
                <span className="text-white font-medium">{monthlyPaymentUsd}</span>
              </div>

              <div className="flex justify-between py-1 text-xs">
                <span className="text-zinc-400">Plusvalía Estimada Zona:</span>
                <span className="text-emerald-400 font-medium">{projectedAppreciationPercentage}</span>
              </div>
            </Section>

            {/* CTA */}
            <Section className="text-center py-6">
              <Button
                href={portalCalculatorUrl}
                className="bg-[#D4AF37] text-black font-semibold text-xs px-6 py-3.5 rounded-xl no-underline inline-block shadow-lg"
              >
                Ajustar Simulación en el Portal
              </Button>
            </Section>

            <Text className="text-xs text-zinc-400 text-center leading-relaxed">
              ¿Deseas bloquear esta unidad con precio preferente?{" "}
              <Link href={whatsappUrl} className="text-[#D4AF37] underline">
                Habla con un asesor por WhatsApp
              </Link>.
            </Text>

            <Hr className="border-zinc-800 my-6" />

            {/* Footer */}
            <Section>
              <Text className="text-[11px] text-zinc-500 text-center leading-relaxed">
                ⚠️ <strong>Aviso de Transparencia:</strong> Esta corrida financiera es ilustrativa y no representa un compromiso contractual vinculante. Las condiciones definitivas se establecen al firmar la promesa de compraventa.
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

export default RealEstateCalculatorSummaryEmail;

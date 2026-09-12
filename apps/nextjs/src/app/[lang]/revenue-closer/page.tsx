import { RevenueCloserLanding } from "~/components/marketing/revenue-closer/RevenueCloserLanding";

export const metadata = {
  title: "Hermes Revenue Closer | Tu Equipo Comercial Inmobiliario 24/7",
  description: "Convierte WhatsApp, tu sitio web y tus campañas en una máquina de ventas inmobiliarias que responde, califica, da seguimiento, resuelve objeciones y agenda compradores listos.",
  openGraph: {
    title: "Hermes Revenue Closer | Tu Equipo Comercial Inmobiliario 24/7",
    description: "Capa de conversión cognitiva para desarrolladores, agencias y brokers inmobiliarios.",
  }
};

export default async function RevenueCloserPage(props: {
  params: Promise<{
    lang: string;
  }>;
}) {
  const params = await props.params;
  const { lang } = params;

  return <RevenueCloserLanding lang={lang} />;
}

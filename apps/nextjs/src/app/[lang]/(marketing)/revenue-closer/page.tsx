import { RevenueCloserLanding } from "~/components/marketing/revenue-closer/RevenueCloserLanding";

export const metadata = {
  title: "Hermes Revenue Closer | Tu Equipo Comercial Inmobiliario 24/7",
  description: "Convierte WhatsApp, tu sitio web y tus campañas en una máquina de ventas inmobiliarias que responde, califica, da seguimiento, resuelve objeciones y agenda compradores listos.",
  openGraph: {
    title: "Hermes Revenue Closer | Tu Equipo Comercial Inmobiliario 24/7",
    description: "Capa de conversión cognitiva para desarrolladores, agencias y brokers inmobiliarios.",
    images: ["https://images.openai.com/static-rsc-4/sK2ugWU0lXvoxSFu1vNXPj9jE2WyL8b2ySOMUgnvjEa9eyWjaANfHdmL3EulnBc6O8ys9-TppGiLsWWUQLHRIzil3PD9s2Nv8uiprSATnKQ3aff0eBnqcYGM0O1gBs2VUowdxbGpjTZ82K3rhWHt62NcgF89c8R66Xm5eAbqI_LSdbXLJ0A8o4h06sMyuImv?purpose=fullsize"]
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

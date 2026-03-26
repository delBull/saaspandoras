import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Pandora's Growth OS | Asymmetric Advantage Infrastructure",
  description: "The distributed operating system for high-intent financial access. Track, rank, and activate early-stage accumulation.",
  openGraph: {
    title: "Pandora's Growth OS",
    description: "Distributed Access Orchestration for the Genesis Window.",
    images: ["/images/og-founders.jpg"],
  },
};

export default function GrowthOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

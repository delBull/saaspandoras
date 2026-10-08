import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pandora's Pitch",
  description: "Institutional Agent OS",
};

export default function PitchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white selection:bg-white/20">
      {children}
    </div>
  );
}

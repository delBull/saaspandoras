import { Metadata } from "next";
import NexusClient from "./components/NexusClient";

export const metadata: Metadata = {
  title: "Pandora's Nexus",
  description: "Explore the entire Pandora's ecosystem in one place.",
};

export default function NexusPage() {
  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-background text-foreground flex items-center justify-center">
      <NexusClient />
    </main>
  );
}

import { Metadata } from "next";
import { SovereignMeetClient } from "@/components/meet/SovereignMeetClient";

export const metadata: Metadata = {
    title: "Sovereign Meet | Pandora's",
    description: "Espacio soberano de colaboración.",
};

export default async function MeetPage({ params }: { params: Promise<{ meetingId: string }> }) {
    const meetingId = (await params).meetingId;

    return (
        <main className="w-full h-screen bg-black overflow-hidden">
            <SovereignMeetClient meetingId={meetingId} />
        </main>
    );
}

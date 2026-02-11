import { NextResponse } from "next/server";
import { type ApplicationData, sendApplicationAlert } from "@/lib/discord/alert-notifier";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, contact, concept, capital, time } = body;

        // Simple validation
        if (!name || !contact || !capital || !time) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios." },
                { status: 400 }
            );
        }

        const applicationData: ApplicationData = {
            name,
            contact,
            concept: concept || "No especificado",
            capital,
            time
        };

        await sendApplicationAlert(applicationData);

        return NextResponse.json({ success: true, message: "Aplicación enviada correctamente." });
    } catch (error) {
        console.error("Error processing application:", error);
        return NextResponse.json(
            { error: "Error interno del servidor." },
            { status: 500 }
        );
    }
}

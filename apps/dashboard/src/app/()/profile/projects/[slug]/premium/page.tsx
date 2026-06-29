'use server';

import { notFound } from "next/navigation";
import { db } from "~/db";
import { projects } from "~/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { PDFClient } from "@/components/premium/PDFClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, slug),
    });
    if (!project) return { title: "Premium PDF" };

    return {
        title: `${project.title} | Premium Profile | Pandora's`,
        description: `Descarga el perfil premium de ${project.title} — disponible en 3 formatos: Cliente Final, Realtor e Inversor.`,
        openGraph: {
            title: `${project.title} — Perfil Premium`,
            description: project.tagline || project.description?.slice(0, 160) || 'Perfil de proyecto en Pandora\'s',
            images: [project.logoUrl || '/og-image.jpg'].filter(Boolean),
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${project.title} | Premium Profile`,
            description: project.tagline || project.description?.slice(0, 160) || '',
            images: [project.logoUrl || '/og-image.jpg'].filter(Boolean),
        },
    };
}

export default async function PremiumPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const project = await db.query.projects.findFirst({
        where: eq(projects.slug, slug),
    });
    if (!project) notFound();

    return (
        <div className="w-full min-h-screen bg-black text-white">
            <PDFClient project={project} />
        </div>
    );
}

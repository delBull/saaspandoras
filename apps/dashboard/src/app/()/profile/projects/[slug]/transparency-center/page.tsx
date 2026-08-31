import { notFound } from "next/navigation";
import { ProjectRepository } from "@/lib/domain/project-repository";
import TransparencyCenterClient from "./client";

export default async function TransparencyCenterPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    const project = await ProjectRepository.findBySlug(slug);

    if (!project) {
        notFound();
    }

    return (
        <div className="w-full min-h-screen bg-black text-white p-4 sm:p-6 md:p-8 md:pt-10">
            <TransparencyCenterClient project={project} />
        </div>
    );
}

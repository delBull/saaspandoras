import ManagedPortalView from "@/components/portal/ManagedPortalView";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    return {
        title: `Portal de Inversor | ${slug.toUpperCase()}`,
        description: "Gestiona tus activos y participa en la gobernanza del proyecto.",
    };
}

export default async function PortalPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    
    return (
        <div className="min-h-screen bg-black">
            <ManagedPortalView slug={slug} />
        </div>
    );
}

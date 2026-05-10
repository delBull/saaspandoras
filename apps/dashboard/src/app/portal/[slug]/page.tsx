import ManagedPortalView from "@/components/portal/ManagedPortalView";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    return {
        title: `Portal de Inversor | ${params.slug.toUpperCase()}`,
        description: "Gestiona tus activos y participa en la gobernanza del proyecto.",
    };
}

export default async function PortalPage({ params }: { params: { slug: string } }) {
    const { slug } = params;
    
    return (
        <div className="min-h-screen bg-black">
            <ManagedPortalView slug={slug} />
        </div>
    );
}

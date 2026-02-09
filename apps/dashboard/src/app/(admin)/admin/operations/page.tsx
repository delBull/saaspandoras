import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuth, isAdmin } from "@/lib/auth";
import { OperationsPanel } from "@/components/admin/OperationsPanel";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function OperationsPage() {
    // Server-side auth check
    const { session } = await getAuth(await headers());

    if (!session?.userId || !await isAdmin(session.userId)) {
        return <UnauthorizedAccess authError="Super Admin access required" />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with Back Link */}
                <div className="mb-8">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors group mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Volver al Admin Dashboard
                    </Link>

                    <div className="border-l-4 border-red-500 pl-4">
                        <h1 className="text-3xl font-bold tracking-tight">Operations Control</h1>
                        <p className="text-muted-foreground mt-2">
                            Emergency controls and infrastructure monitoring
                        </p>
                    </div>
                </div>

                {/* Operations Panel */}
                <OperationsPanel />
            </div>
        </div>
    );
}

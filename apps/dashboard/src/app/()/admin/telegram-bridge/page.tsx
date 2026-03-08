import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAuth, isSuperAdmin } from "@/lib/auth";
import { UnauthorizedAccess } from "@/components/admin/UnauthorizedAccess";
import { TelegramBridgePanel } from "@/components/admin/TelegramBridgePanel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
    title: "Telegram Bridge Control | Pandoras Admin",
    description: "Kill switches, economy controls, observability and playbooks for the Telegram Bridge.",
};

export default async function TelegramBridgePage() {
    const { session } = await getAuth(await headers());

    if (!session?.userId || !isSuperAdmin(session.userId)) {
        return <UnauthorizedAccess authError="Super Admin access required" />;
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/admin/dashboard"
                        className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors group mb-6"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                        Volver al Admin Dashboard
                    </Link>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h1 className="text-3xl font-bold tracking-tight">Telegram Bridge Control</h1>
                        <p className="text-muted-foreground mt-2">
                            Observabilidad, kill-switches, economía y playbooks de operación del Telegram Bridge.
                        </p>
                    </div>
                </div>

                <TelegramBridgePanel />
            </div>
        </div>
    );
}

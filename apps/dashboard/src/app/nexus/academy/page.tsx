import React from "react";
import { redirect } from "next/navigation";
import { getNexusAuthContext, checkNexusPermission } from "@/lib/nexus/nexus-rbac";
import { NexusAccessGate } from "../../../components/nexus/NexusAccessGate";
import { CoursesAdminPanel } from "@/components/admin/CoursesAdminPanel";

export default async function NexusAcademyPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const resolvedSearchParams = await searchParams;
  const token = typeof resolvedSearchParams.token === 'string' ? resolvedSearchParams.token : undefined;
  
  // 1. Authenticate with Nexus Engine
  const auth = await getNexusAuthContext(null, token);

  if (!auth.isAuthenticated) {
    redirect("/portal/login?return=/nexus/academy");
  }

  // 2. Authorize capability
  if (!checkNexusPermission(auth, 'growth.manage')) {
    return <NexusAccessGate reason="Se requiere capacidad 'growth.manage' para gestionar la academia." />;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white">
          Academy & Courses
        </h1>
        <p className="text-zinc-400 text-lg">
          Gestiona los módulos de aprendizaje, certificados y material educativo del ecosistema.
        </p>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm p-6">
        <CoursesAdminPanel />
      </div>
    </div>
  );
}

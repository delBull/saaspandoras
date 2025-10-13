import { NextResponse } from "next/server";
import { db } from "~/db";
import { projects as projectsSchema } from "~/db/schema";
import { isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  console.log('🔄 TRANSFER: Starting transfer request');

  // Get headers directly from the request (same as other working admin endpoints)
  const requestHeaders = await headers();

  // Try multiple header names in case Vercel filters some
  const walletAddress = requestHeaders.get('x-thirdweb-address') ??
                       requestHeaders.get('x-wallet-address') ??
                       requestHeaders.get('x-user-address');

  console.log('🔄 TRANSFER: Headers received:', {
    'x-thirdweb-address': requestHeaders.get('x-thirdweb-address'),
    'x-wallet-address': requestHeaders.get('x-wallet-address'),
    'x-user-address': requestHeaders.get('x-user-address'),
    walletAddress
  });

  // Use the SAME authentication logic as other working admin endpoints
  const userIsAdmin = await isAdmin(walletAddress);

  console.log('🔄 TRANSFER: Admin check result:', userIsAdmin, {
    walletAddress
  });

  if (!userIsAdmin) {
    console.log('🔄 TRANSFER: Access denied - user is not admin');
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const projectId = Number(id);

  if (isNaN(projectId)) {
    return NextResponse.json({ message: "ID de proyecto inválido" }, { status: 400 });
  }

  try {
    console.log('🔄 TRANSFER: Parsing request body');
    const body: unknown = await request.json();
    console.log('🔄 TRANSFER: Request body:', body);

    if (typeof body !== 'object' || body === null || !('newOwnerWallet' in body)) {
      console.log('🔄 TRANSFER: Invalid body structure');
      return NextResponse.json(
        { message: "Se requiere la dirección de wallet del nuevo propietario" },
        { status: 400 }
      );
    }

    const { newOwnerWallet } = body as { newOwnerWallet: string };
    console.log('🔄 TRANSFER: New owner wallet:', newOwnerWallet);

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(newOwnerWallet)) {
      console.log('🔄 TRANSFER: Invalid wallet format');
      return NextResponse.json(
        { message: "Dirección de wallet inválida" },
        { status: 400 }
      );
    }

    const newOwnerWalletLower = newOwnerWallet.toLowerCase();

    // Verificar que el proyecto existe
    console.log('🔄 TRANSFER: Checking if project exists, ID:', projectId);
    const existingProject = await db.query.projects.findFirst({
      where: eq(projectsSchema.id, projectId),
    });

    console.log('🔄 TRANSFER: Project found:', !!existingProject, {
      id: existingProject?.id,
      title: existingProject?.title,
      currentOwner: existingProject?.applicantWalletAddress
    });

    if (!existingProject) {
      console.log('🔄 TRANSFER: Project not found');
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    // Verificar que no se está transfiriendo al mismo propietario
    if (existingProject.applicantWalletAddress?.toLowerCase() === newOwnerWalletLower) {
      console.log('🔄 TRANSFER: Transfer to same owner attempted');
      return NextResponse.json(
        { message: "El proyecto ya pertenece a esta wallet" },
        { status: 400 }
      );
    }

    // Actualizar el propietario del proyecto
    console.log('🔄 TRANSFER: Updating project ownership');
    const [updatedProject] = await db
      .update(projectsSchema)
      .set({
        applicantWalletAddress: newOwnerWalletLower,
        // Reset applicant info since it's a new owner
        applicantName: null,
        applicantPosition: null,
        applicantEmail: null,
        applicantPhone: null,
      })
      .where(eq(projectsSchema.id, projectId))
      .returning();

    console.log('🔄 TRANSFER: Project updated successfully:', {
      id: updatedProject?.id,
      newOwner: updatedProject?.applicantWalletAddress
    });

    return NextResponse.json({
      message: "Proyecto transferido exitosamente",
      project: updatedProject
    }, { status: 200 });

  } catch (error) {
    console.error("🔄 TRANSFER: Error transferring project:", error);
    console.error("🔄 TRANSFER: Error stack:", error instanceof Error ? error.stack : 'No stack');
    console.error("🔄 TRANSFER: Error details:", {
      projectId,
      walletAddress
    });

    return NextResponse.json(
      { message: "Error interno del servidor.", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
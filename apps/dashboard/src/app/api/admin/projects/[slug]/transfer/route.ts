import { NextResponse } from "next/server";
import { db } from "~/db";
// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";

// Database connection will be validated at runtime

// const client = postgres(connectionString);
// const db = drizzle(client, { schema: { projects: projectsSchema } });
import { isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { sql, eq } from "drizzle-orm";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface Project {
  id: number;
  title: string;
  applicant_wallet_address: string | null;
  // Agrega aquí otros campos del proyecto si los necesitas
}

// TEMPORARY TEST - Remove after debugging
export function GET(_request: Request, _params: RouteParams) {
  console.log('🔄 TRANSFER: ===== GET TEST ENDPOINT =====');
  return new Response('Transfer endpoint is working', { status: 200 });
}

export async function POST(request: Request, { params }: RouteParams) {
  console.log('🔄 TRANSFER: ===== STARTING TRANSFER REQUEST =====');

  try {
    console.log('🔄 TRANSFER: Step 1 - Getting headers');
    const requestHeaders = await headers();

    console.log('🔄 TRANSFER: Step 2 - Extracting wallet address');
    const walletAddress = requestHeaders.get('x-thirdweb-address') ??
      requestHeaders.get('x-wallet-address') ??
      requestHeaders.get('x-user-address');

    console.log('🔄 TRANSFER: Step 3 - Checking admin status');
    const userIsAdmin = await isAdmin(walletAddress);

    console.log('🔄 TRANSFER: Step 4 - Admin check result:', userIsAdmin);

    if (!userIsAdmin) {
      console.log('🔄 TRANSFER: Access denied - user is not admin');
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    console.log('🔄 TRANSFER: Step 5 - Getting params');
    const { slug } = await params;
    const projectIdRaw = Number(slug);
    const isId = !isNaN(projectIdRaw);

    let projectId = projectIdRaw;

    if (!isId) {
      console.log('🔄 TRANSFER: Slug provided instead of ID, looking up project:', slug);
      const project = await db.query.projects.findFirst({
        where: eq(sql`slug`, slug),
        columns: { id: true }
      });
      if (!project) {
        return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
      }
      projectId = project.id;
    }

    console.log('🔄 TRANSFER: Target Project ID:', projectId);

    console.log('🔄 TRANSFER: Step 6 - Parsing body');
    const body: unknown = await request.json();
    console.log('🔄 TRANSFER: Body:', body);

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

    console.log('🔄 TRANSFER: Step 7 - Checking if project exists');
    // Verificar que el proyecto existe - Use SQL raw to avoid Drizzle compilation issues
    const existingProjectResult = await db.execute(sql`SELECT id, title, applicant_wallet_address FROM projects WHERE id = ${projectId}`);
    const projectData = existingProjectResult[0] as Project | undefined;

    console.log('🔄 TRANSFER: Step 8 - Project found:', !!projectData, {
      id: projectData?.id,
      title: projectData?.title,
      currentOwner: projectData?.applicant_wallet_address,
    });

    if (!projectData) {
      console.log('🔄 TRANSFER: Project not found');
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    console.log('🔄 TRANSFER: Step 9 - Checking ownership conflict');
    // Verificar que no se está transfiriendo al mismo propietario
    if (projectData.applicant_wallet_address?.toLowerCase() === newOwnerWalletLower) {
      console.log('🔄 TRANSFER: Transfer to same owner attempted');
      return NextResponse.json(
        { message: "El proyecto ya pertenece a esta wallet" },
        { status: 400 }
      );
    }

    console.log('🔄 TRANSFER: Step 10 - Updating project ownership');
    // Actualizar el propietario del proyecto - Use SQL raw to avoid Drizzle compilation issues
    const updateResult = await db.execute(sql<Project>`
      UPDATE projects
      SET applicant_wallet_address = ${newOwnerWalletLower},
          applicant_name = ${newOwnerWalletLower},
          applicant_position = NULL,
          applicant_email = NULL,
          applicant_phone = NULL
      WHERE id = ${projectId} 
      RETURNING *
    `);
    const updatedProject = updateResult[0];

    console.log('🔄 TRANSFER: Step 11 - Project updated successfully:', {
      id: updatedProject?.id,
      newOwner: updatedProject?.applicant_wallet_address
    });

    console.log('🔄 TRANSFER: ===== TRANSFER COMPLETED SUCCESSFULLY =====');
    return NextResponse.json({
      message: "Proyecto transferido exitosamente",
      project: updatedProject
    }, { status: 200 });

  } catch (error) {
    console.error("🔄 TRANSFER: ===== ERROR IN TRANSFER =====");
    console.error("🔄 TRANSFER: Error:", error);
    console.error("🔄 TRANSFER: Error stack:", error instanceof Error ? error.stack : 'No stack');

    return NextResponse.json(
      { message: "Error interno del servidor.", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

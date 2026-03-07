import { NextResponse } from "next/server";
import { db } from "~/db";
import { eq } from "drizzle-orm";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { projects as projectsSchema } from "@/db/schema";
import { projectApiSchema } from "@/lib/project-schema-api";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import slugify from "slugify";
import { trackGamificationEvent } from "@/lib/gamification/service";
import { WebhookService } from "@/lib/integrations/webhook-service";
import { integrationClients } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsedData = projectApiSchema.safeParse(body);

    // Obtener wallet address del usuario conectado
    const { session } = await getAuth(await headers());
    const applicantWalletAddress = session?.userId ?? null;

    if (!parsedData.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: parsedData.error.flatten() },
        { status: 400 }
      );
    }

    // Generar un slug único
    let slug = slugify(parsedData.data.title, { lower: true, strict: true });
    const existingProject = await db.query.projects.findFirst({
      where: (projects, { eq }) => eq(projects.slug, slug),
    });
    if (existingProject) {
      slug = `${slug}-${Date.now()}`;
    }

    // Insertar en la base de datos con estado 'pending'
    const [newProject] = await db
      .insert(projectsSchema)
      // .values() espera un ARRAY de objetos
      .values({
        // --- Sección 1: Strings / Enums ---
        title: parsedData.data.title,
        description: parsedData.data.description,
        slug: slug,
        tagline: parsedData.data.tagline ?? null,
        businessCategory: parsedData.data.businessCategory ?? 'other',
        logoUrl: parsedData.data.logoUrl ?? null,
        coverPhotoUrl: parsedData.data.coverPhotoUrl ?? null,
        videoPitch: parsedData.data.videoPitch ?? null,

        // --- Sección 2: Strings ---
        website: parsedData.data.website ?? null,
        whitepaperUrl: parsedData.data.whitepaperUrl ?? null,
        twitterUrl: parsedData.data.twitterUrl ?? null,
        discordUrl: parsedData.data.discordUrl ?? null,
        telegramUrl: parsedData.data.telegramUrl ?? null,
        linkedinUrl: parsedData.data.linkedinUrl ?? null,

        // --- Sección 3: ¡LA CLAVE! Híbrido de Números y Strings ---

        // Campos DECIMAL (decimal, numeric) -> van como STRING
        targetAmount: parsedData.data.targetAmount.toString(), // Convertir a string
        totalValuationUsd: parsedData.data.totalValuationUsd?.toString() ?? null, // Convertir a string
        tokenPriceUsd: parsedData.data.tokenPriceUsd?.toString() ?? null, // Convertir a string

        // Campos INTEGER (integer) -> van como NUMBER
        totalTokens: parsedData.data.totalTokens ?? null, // Dejar como número
        tokensOffered: parsedData.data.tokensOffered ?? null, // Dejar como número

        // Campos VARCHAR/TEXT -> van como STRING
        tokenType: parsedData.data.tokenType ?? 'erc20',
        estimatedApy: parsedData.data.estimatedApy ?? null,
        yieldSource: parsedData.data.yieldSource ?? 'other',
        lockupPeriod: parsedData.data.lockupPeriod ?? null,
        fundUsage: parsedData.data.fundUsage ?? null,

        // --- Sección 4: JSONB (como Objetos/Arrays) y Strings ---
        teamMembers: parsedData.data.teamMembers ?? [], // Como Array
        advisors: parsedData.data.advisors ?? [], // Como Array
        tokenDistribution: parsedData.data.tokenDistribution ?? {}, // Como Objeto
        contractAddress: parsedData.data.contractAddress ?? null,
        treasuryAddress: parsedData.data.treasuryAddress ?? null,

        // --- Sección 5: Strings / Text ---
        legalStatus: parsedData.data.legalStatus ?? null,
        valuationDocumentUrl: parsedData.data.valuationDocumentUrl ?? null,
        fiduciaryEntity: parsedData.data.fiduciaryEntity ?? null,
        dueDiligenceReportUrl: parsedData.data.dueDiligenceReportUrl ?? null,

        // --- Sección 6: Booleans ---
        isMintable: parsedData.data.isMintable ?? false,
        isMutable: parsedData.data.isMutable ?? false,
        updateAuthorityAddress: parsedData.data.updateAuthorityAddress ?? null,

        // --- Sección 7: Strings y Booleans ---
        applicantName: parsedData.data.applicantName ?? null,
        applicantPosition: parsedData.data.applicantPosition ?? null,
        applicantEmail: parsedData.data.applicantEmail ?? null,
        applicantPhone: parsedData.data.applicantPhone ?? null,
        applicantWalletAddress: applicantWalletAddress,
        verificationAgreement: parsedData.data.verificationAgreement,

        // --- Campo de Estado: String (Enum) ---
        status: "pending",
      })
      .returning();

    // 🎯 TRACK GAMIFICATION EVENT: Project application submitted
    if (applicantWalletAddress && newProject) {
      try {
        await trackGamificationEvent(
          applicantWalletAddress,
          'project_application_submitted',
          {
            projectId: newProject.id.toString(),
            projectTitle: newProject.title,
            projectSlug: newProject.slug,
            submittedAt: new Date().toISOString()
          }
        );
        console.log(`🎯 Gamification event tracked: project_application_submitted for ${applicantWalletAddress}`);
      } catch (gamificationError) {
        console.warn('⚠️ Failed to track gamification event:', gamificationError);
      }
    }

    // 🕸️ WEBHOOK: Notify external clients
    try {
      // For now, we broadcast to all clients in the same environment
      // (Staging if development/预览, Production if main)
      const host = (await headers()).get("host") || "";
      const isProduction = host === "dash.pandoras.finance" || host === "www.dash.pandoras.finance";
      const env = isProduction ? 'production' : 'staging';

      if (newProject) {
        const clients = await db.query.integrationClients.findMany({
          where: eq(integrationClients.environment, env)
        });

        for (const client of clients) {
          await WebhookService.queueEvent(client.id, 'project.application_submitted', {
            projectId: newProject.id.toString(),
            title: newProject.title,
            category: newProject.businessCategory || "other",
            applicantWallet: applicantWalletAddress || "unknown",
            targetAmount: newProject.targetAmount,
            isSandbox: env === 'staging'
          });
        }
        if (clients.length > 0) {
          console.log(`📡 Webhook(s) queued for ${clients.length} clients: project.application_submitted`);
        }
      }
    } catch (webhookError) {
      console.warn('⚠️ Failed to queue application webhook:', webhookError);
    }

    // 🔔 DISCORD NOTIFICATION
    try {
      const { notifyNewApplication, ensureNotificationServiceConfigured } = await import("@/lib/notifications");
      ensureNotificationServiceConfigured(); // ⚡ Initialize Discord webhook BEFORE sending
      if (newProject) {
        await notifyNewApplication(newProject);
        console.log(`🔔 Discord notification sent for project: ${newProject.title}`);
      }
    } catch (notificationError) {
      console.warn('⚠️ Failed to send notification:', notificationError);
    }

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Error al crear la aplicación del proyecto:", error);
    return NextResponse.json(
      {
        message: "Error interno del servidor.",
      },
      { status: 500 }
    );
  }
}

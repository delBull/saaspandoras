import { NextResponse } from 'next/server';
import { trackGamificationEvent } from '@/lib/gamification/service';
import { db } from '@/db';
import { projects, userReferrals, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getAuth, isAdmin } from '@/lib/auth';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Support both walletAddress (from frontend) and userId (legacy)
    const userId = body.walletAddress || body.userId;
    const { eventType, metadata } = body;

    if (!userId || !eventType) {
      return NextResponse.json(
        { error: 'userId/walletAddress and eventType are required' },
        { status: 400 }
      );
    }

    console.log(`🎯 API: Tracking event ${eventType} for user ${userId}`);
    const event = await trackGamificationEvent(userId, eventType, metadata);
    console.log(`✅ API: Event tracked successfully: +${event.points} points`);

    return NextResponse.json({
      success: true,
      event,
      message: `¡Evento registrado! +${event.points} puntos de gamificación`
    });
  } catch (error) {
    console.error('❌ API Error tracking gamification event:', error);
    return NextResponse.json(
      { error: 'Failed to track event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Endpoint especial para reprocesar acciones históricas de un usuario
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, processAll = false, forceRun = false } = body;

    // Verificar autenticación de admin
    const { session } = await getAuth(await headers());
    const userIsAdmin = await isAdmin(session?.address ?? session?.userId);

    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Admin required' }, { status: 403 });
    }

    if (processAll) {
      // Procesar TODOS los usuarios
      return await reprocessAllUsers();
    } else {
      // Procesar un usuario específico
      if (!walletAddress) {
        return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
      }
      return await reprocessUser(walletAddress.toLowerCase());
    }

  } catch (error) {
    console.error('❌ API Error reprocessing historical actions:', error);
    return NextResponse.json(
      { error: 'Failed to reprocess historical actions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Función para reprocesar un usuario específico
async function reprocessUser(userWallet: string) {
  console.log(`🔄 Reprocessing historical actions for user: ${userWallet}`);

  let processedEvents = 0;
  let totalPointsGranted = 0;

  // 1. Reprocesar proyectos enviados
  const userProjects = await db.query.projects.findMany({
    where: eq(projects.applicantWalletAddress, userWallet),
    columns: { id: true, title: true, status: true, createdAt: true }
  });

  console.log(`📝 Found ${userProjects.length} projects for user`);

  for (const project of userProjects) {
    // Otorgar puntos por envío de proyecto (50 puntos)
    try {
      await trackGamificationEvent(userWallet, 'project_application_submitted', {
        projectId: project.id.toString(),
        projectTitle: project.title,
        submittedAt: project.createdAt.toISOString(),
        isHistorical: true
      });
      processedEvents++;
      totalPointsGranted += 50;
      console.log(`✅ Processed project submission: ${project.title}`);
    } catch (error) {
      console.warn(`⚠️ Failed to process project ${project.id}:`, error);
    }

    // Si el proyecto está aprobado, otorgar puntos por aprobación (100 puntos)
    if (project.status === 'approved') {
      try {
        await trackGamificationEvent(userWallet, 'project_application_approved', {
          projectId: project.id.toString(),
          projectTitle: project.title,
          approvalDate: new Date().toISOString(),
          isHistorical: true
        });
        processedEvents++;
        totalPointsGranted += 100;
        console.log(`✅ Processed project approval: ${project.title}`);
      } catch (error) {
        console.warn(`⚠️ Failed to process approval for project ${project.id}:`, error);
      }
    }
  }

  // 2. Reprocesar referidos realizados
  const userReferralRecords = await db.query.userReferrals.findMany({
    where: eq(userReferrals.referrerWalletAddress, userWallet),
    columns: { id: true, referredWalletAddress: true, status: true, createdAt: true }
  });

  console.log(`👥 Found ${userReferralRecords.length} referrals made by user`);

  for (const referral of userReferralRecords) {
    try {
      await trackGamificationEvent(userWallet, 'referral_made', {
        referredWallet: referral.referredWalletAddress,
        referralDate: referral.createdAt.toISOString(),
        isHistorical: true
      });
      processedEvents++;
      totalPointsGranted += 200; // 200 puntos por referido
      console.log(`✅ Processed referral: ${referral.referredWalletAddress.slice(0, 6)}...`);
    } catch (error) {
      console.warn(`⚠️ Failed to process referral ${referral.id}:`, error);
    }
  }

  console.log(`🎉 Historical reprocessing complete for ${userWallet}:`);
  console.log(`   - Events processed: ${processedEvents}`);
  console.log(`   - Total points granted: ${totalPointsGranted}`);

  return NextResponse.json({
    success: true,
    message: `Historical actions reprocessed successfully`,
    data: {
      walletAddress: userWallet,
      eventsProcessed: processedEvents,
      totalPointsGranted: totalPointsGranted,
      projectsProcessed: userProjects.length,
      referralsProcessed: userReferralRecords.length
    }
  });
}

// Función para reprocesar TODOS los usuarios
async function reprocessAllUsers() {
  console.log(`🔄 Starting bulk reprocessing of all users...`);

  // Obtener todos los usuarios que tienen proyectos
  const usersWithProjects = await db.query.projects.findMany({
    columns: { applicantWalletAddress: true }
  });

  // Obtener todos los usuarios que tienen referidos
  const usersWithReferrals = await db.query.userReferrals.findMany({
    columns: { referrerWalletAddress: true }
  });

  // Combinar y deduplicar las wallets
  const walletSet = new Set<string>();

  usersWithProjects.forEach(p => {
    if (p.applicantWalletAddress) walletSet.add(p.applicantWalletAddress.toLowerCase());
  });

  usersWithReferrals.forEach(r => {
    if (r.referrerWalletAddress) walletSet.add(r.referrerWalletAddress.toLowerCase());
  });

  const activeUsers = Array.from(walletSet).map(walletAddress => ({ walletAddress }));
  console.log(`👥 Found ${activeUsers.length} users with activity to reprocess`);

  let totalEventsProcessed = 0;
  let totalPointsGranted = 0;
  let usersProcessed = 0;
  const results = [];

  for (const user of activeUsers) {
    const walletAddress = user.walletAddress;
    console.log(`\n🔄 Processing user ${usersProcessed + 1}/${activeUsers.length}: ${walletAddress}`);

    try {
      const userResult = await reprocessUser(walletAddress);
      const userData = await userResult.json();

      if (userData.success) {
        totalEventsProcessed += userData.data.eventsProcessed;
        totalPointsGranted += userData.data.totalPointsGranted;
        usersProcessed++;
        results.push({
          walletAddress,
          eventsProcessed: userData.data.eventsProcessed,
          pointsGranted: userData.data.totalPointsGranted,
          success: true
        });
      } else {
        results.push({
          walletAddress,
          error: userData.error,
          success: false
        });
      }
    } catch (error) {
      console.error(`❌ Failed to process user ${walletAddress}:`, error);
      results.push({
        walletAddress,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      });
    }

    // Pequeña pausa para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n🎉 Bulk reprocessing complete!`);
  console.log(`   - Users processed: ${usersProcessed}/${activeUsers.length}`);
  console.log(`   - Total events: ${totalEventsProcessed}`);
  console.log(`   - Total points granted: ${totalPointsGranted}`);

  return NextResponse.json({
    success: true,
    message: `Bulk historical reprocessing completed`,
    data: {
      totalUsers: activeUsers.length,
      usersProcessed,
      totalEventsProcessed,
      totalPointsGranted,
      results
    }
  });
}

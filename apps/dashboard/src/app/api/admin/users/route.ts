/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { getAuth, isAdmin } from "@/lib/auth";
import { db } from "~/db";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import type { UserData, UserRole } from "@/types/admin";

export async function GET() {
  try {
    const { session } = await getAuth(await headers());
    const userIsAdmin = await isAdmin(session?.userId);

    if (!userIsAdmin) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    // First, try a simple query to check if table exists and has data
    const simpleUserQuery = await db.execute(sql`SELECT COUNT(*) as total FROM "User"`);
    console.log("Simple user count:", simpleUserQuery);
    const totalUsers = simpleUserQuery[0]?.total as string;
    console.log("Total users:", totalUsers);

    // For testing, if no users exist, create a sample user to verify the system works
    if (totalUsers === '0') {
      console.log("No users found in database - creating sample user for testing");

      // Insert a sample user
      await db.execute(sql`
        INSERT INTO "User" ("id", "name", "email", "image", "walletAddress", "hasPandorasKey", "connectionCount", "lastConnectionAt", "createdAt")
        VALUES (
          'sample-user-uuid',
          'Usuario de Ejemplo',
          'sample@example.com',
          '/images/avatars/rasta.png',
          '0x1234567890123456789012345678901234567890',
          true,
          1,
          NOW(),
          NOW()
        )
      `);

      console.log("Sample user created successfully");
    }

    // Get all users with their project counts and roles
    console.log("Executing simplified user query");

    // SUPER ADMIN WALLET TO HIDE FROM USER MANAGEMENT
    const SUPER_ADMIN_WALLET = '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    // Get all users EXCEPT super admin
    const usersQuery = await db.execute(sql`
      SELECT
        "id",
        "name",
        "email",
        "image",
        "walletAddress",
        "hasPandorasKey",
        "connectionCount",
        "lastConnectionAt",
        "createdAt",
        "kycLevel",
        "kycCompleted",
        "kycData"
      FROM "User"
      WHERE LOWER("walletAddress") != LOWER(${SUPER_ADMIN_WALLET})
      ORDER BY "createdAt" DESC
    `);

    console.log("Users query result:", usersQuery.length, "users found");

    // Get comprehensive project counts - MORE ROBUST COUNTING SYSTEM
    const projectCountsByEmail: Record<string, number> = {};
    const projectCountsByWallet: Record<string, number> = {};
    const totalProjectsInDb = { count: 0 };

    try {
      console.log("🔢 Fetching comprehensive project counts...");

      // First get total projects for super admin calculation
      const totalQuery = await db.execute(sql`SELECT COUNT(*) as count FROM "projects"`);
      totalProjectsInDb.count = Number(totalQuery[0]?.count as string);
      console.log("📊 Total projects in DB:", totalProjectsInDb.count);

      // Get projects by applicant wallet address (NEW AND RELIABLE METHOD)
      const applicantProjects = await db.execute(sql`
        SELECT
          "applicant_wallet_address" as applicantWallet,
          COUNT(*) as count,
          STRING_AGG("status", ', ') as statuses,
          COUNT(CASE WHEN "status" IN ('draft', 'pending', 'approved', 'live', 'completed', 'incomplete', 'rejected') THEN 1 END) as all_status_count
        FROM "projects"
        WHERE "applicant_wallet_address" IS NOT NULL AND "applicant_wallet_address" != ''
        GROUP BY "applicant_wallet_address"
      `);

      console.log("🧑‍💻 Projects by applicant wallet:", applicantProjects.length);
      console.log("Available project wallets:", applicantProjects.map((p: any) =>
        `"${p.applicantWallet}" (${p.all_status_count} total)`
      ).join(', '));

      // Store comprehensive counts by wallet address (MORE RELIABLE)
      applicantProjects.forEach((row: any) => {
        const wallet = row.applicantWallet as string;
        const allStatusCount = Number(row.all_status_count);
        projectCountsByWallet[wallet] = allStatusCount;
        console.log(`📈 ${wallet}: ${allStatusCount} projects (${row.statuses})`);
      });

      console.log("🎯 Final project counts by email:", projectCountsByEmail);
      // TEMPORARY: Update existing projects that have email but no wallet address
      console.log("🔧 Attempting to associate existing projects with wallet addresses...");
      const projectsWithoutWallet = await db.execute(sql`
        SELECT p.id, p.applicant_email, u."walletAddress"
        FROM projects p
        LEFT JOIN "User" u ON u.email = p.applicant_email
        WHERE p.applicant_wallet_address IS NULL AND p.applicant_email IS NOT NULL
      `);

      if (projectsWithoutWallet.length > 0) {
        console.log(`📝 Found ${projectsWithoutWallet.length} projects to update with wallet addresses`);
        for (const proj of projectsWithoutWallet) {
          try {
            const walletAddr = proj.walletAddress as string;
            const projectId = proj.id as number;
            await db.execute(sql`
              UPDATE projects
              SET applicant_wallet_address = ${walletAddr}
              WHERE id = ${projectId}
            `);
            console.log(`✅ Updated project ${String(proj.id)} with wallet ${String(proj.walletAddress)}`);
          } catch (updateError) {
            console.error(`❌ Failed to update project ${String(proj.id)}:`, updateError);
          }
        }
      }

      console.log("🏦 Final project counts by wallet:", projectCountsByWallet);
      console.log("📊 Current logged-in admin wallet:", session?.userId);

    } catch (error) {
      console.warn("⚠️ Could not fetch comprehensive project counts:", error);
    }

    // Get all admin wallets for role detection (incluyendo super admins hardcodeados)
    const SUPER_ADMIN_WALLETS = [
      '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9' // Tú - siempre admin
    ].map(addr => addr.toLowerCase());

    const adminWallets: string[] = [];
    try {
      const adminQuery = await db.execute(sql`
        SELECT "wallet_address" FROM "administrators"
      `);
      adminQuery.forEach((row: any) => {
        adminWallets.push((row.wallet_address as string).toLowerCase());
      });
    } catch (error) {
      console.warn("Could not fetch admin wallets:", error);
    }

    // Combinar super admins con admins de BD
    const ALL_ADMIN_WALLETS = [...SUPER_ADMIN_WALLETS, ...adminWallets];
    console.log('📊 Total admin wallets for role detection:', ALL_ADMIN_WALLETS.length, ALL_ADMIN_WALLETS);

    // Process each user with the collected data
    const usersWithDetails = usersQuery.map((user: any) => {
      const userWallet = (user.walletAddress as string).toLowerCase();
      // Check for SUPER admin wallet address directly (case sensitive check)
      const isSuperAdmin = user.walletAddress === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';
      const isAdmin = ALL_ADMIN_WALLETS.includes(userWallet);

      // Enhanced logging for debugging
      console.log(`🔍 Processing user ${userWallet.substring(0, 8)}...`);
      console.log(`   Wallet: ${user.walletAddress}`);
      console.log(`   Email: ${user.email || 'null'}`);
      console.log(`   Is super admin: ${isSuperAdmin}`);
      console.log(`   Is admin (any): ${isAdmin}`);

      // For super admins, don't show personal projects - they only manage the system
      // For regular admins (non-super), show projects with their email
      // For regular users, show only their projects
      let projectCount: number;
      let systemProjectsManaged: number | undefined;
      if (isSuperAdmin) {
        projectCount = 0; // No personal projects for super admin
        systemProjectsManaged = totalProjectsInDb.count; // System management count
        console.log(`   ✅ SUPER ADMIN: 0 personal projects, manages ${systemProjectsManaged} total projects`);
      } else {
        // TEMPORARY: Direct project assignment for existing projects until wallet field is populated
        const knownProjectAssignments: Record<string, number> = {
          // Known wallet -> project count mappings (update as new projects are created)
          '0xb2d4c368b9c21e3fde04197d6ea176b44c5c7d18': 1, // Amon - 1 project (Zunu)
          '0x98e2f115a70538fe8cdf6a638ec9e60a124bfe42': 0, // Other users - no projects yet
          '0x1a9e88c61397ae3582488bd1fc6d6b496fdf2fc3': 0,
          '0xe2bb7a2a5b538e50212dbc8eaca9e57324a7928d': 0,
          '0x9156319619b043e8467eab13c3e56e1817a6b1b1': 0,
          '0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa': 0,
          '0xdeeb671deda720a75b07e9874e4371c194e38919': 0, // Pandoras Admin
          '0x1234567890123456789012345678901234567890': 0, // Sample user
        };

        // Use wallet-based counting if available, otherwise fallback to manual assignment
        if (projectCountsByWallet[userWallet]) {
          projectCount = projectCountsByWallet[userWallet]!;
          console.log(`   🏦 WALLET RELATION: ${projectCount} projects for wallet ${userWallet}`);
        } else if (knownProjectAssignments[userWallet]) {
          projectCount = knownProjectAssignments[userWallet]!;
          console.log(`   🔧 TEMP ASSIGNMENT: ${projectCount} projects for wallet ${userWallet}`);
        } else {
          // Fallback to email-based matching (deprecated but still available)
          const userEmail = user.email;
          if (userEmail && projectCountsByEmail[userEmail] !== undefined) {
            projectCount = projectCountsByEmail[userEmail]!;
            console.log(`   📧 EMAIL FALLBACK: ${projectCount} projects for ${userEmail}`);
          } else {
            projectCount = 0;
            console.log(`   ❌ No projects found for wallet ${userWallet} or email ${userEmail || 'null email'}`);
          }
        }
      }

      // Determine role
      let role: 'admin' | 'applicant' | 'pandorian';
      if (isAdmin) {
        role = 'admin';
      } else if (projectCount > 0) {
        role = 'applicant';
      } else {
        role = 'pandorian';
      }

      // Determine Pandora's Key status - for now, give to all users since it's required to access platform
      // TODO: Implement proper Pandora's Key verification system
      const hasPandorasKey = true; // All users get it until proper verification is implemented

      console.log(`   Final: Count=${projectCount}, Role=${role}, Key=${hasPandorasKey}${systemProjectsManaged ? `, Manages=${systemProjectsManaged}` : ''}`);
      console.log(`   ---`);

      const result = {
        ...user,
        projectCount,
        systemProjectsManaged,
        role,
        hasPandorasKey
      };

      return result;
    });

    console.log("Users processed with roles and counts");

    const users: UserData[] = usersWithDetails.map((row: any) => ({
      id: (row as Record<string, unknown>).id as string,
      name: (row as Record<string, unknown>).name as string | null,
      email: (row as Record<string, unknown>).email as string | null,
      image: (row as Record<string, unknown>).image as string | null,
      walletAddress: (row as Record<string, unknown>).walletAddress as string,
      hasPandorasKey: (row as Record<string, unknown>).hasPandorasKey as boolean,
      connectionCount: Number((row as Record<string, unknown>).connectionCount),
      lastConnectionAt: (row as Record<string, unknown>).lastConnectionAt as string,
      createdAt: (row as Record<string, unknown>).createdAt as string,
      role: (row as Record<string, unknown>).role as UserRole,
      projectCount: Number((row as Record<string, unknown>).projectCount),
      systemProjectsManaged: (row as Record<string, unknown>).systemProjectsManaged as number | undefined,
      kycLevel: (row as Record<string, unknown>).kycLevel as 'basic' | 'advanced',
      kycCompleted: (row as Record<string, unknown>).kycCompleted as boolean,
      kycData: (row as Record<string, unknown>).kycData as any || null,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { message: "Error al obtener usuarios", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

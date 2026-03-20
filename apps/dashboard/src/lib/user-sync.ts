import { db } from '~/db';
import { sql, eq } from 'drizzle-orm';
import { users as usersSchema } from '@/db/schema';
import { IdentityService } from '@/lib/marketing/identity-service';
import { RewardEngine } from '@/lib/marketing/reward-engine';

export async function syncThirdwebUser(userData: {
  walletAddress: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  try {
    console.log('🚀  START: syncThirdwebUser called with:', {
      walletAddress: userData.walletAddress,
      email: userData.email,
      name: userData.name,
      image: userData.image
    });

    // Lista de SUPER ADMINS desde variable de entorno (siempre admin sin importar BD)
    const SUPER_ADMINS = (process.env.SUPER_ADMIN_WALLET ?? '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9')
      .split(',')
      .map(addr => addr.trim().toLowerCase());

    // Leer TODAS las wallets admin adicionales desde la base de datos
    const adminWallets = await db.execute(sql`
      SELECT "wallet_address", "alias" FROM "administrators"
    `);

    console.log('📊 Admin wallets in DB:', adminWallets.length);
    adminWallets.forEach((admin: Record<string, unknown>) => {
      console.log('📊 Admin wallet:', admin.wallet_address ?? 'unknown', 'alias:', admin.alias ?? 'no-alias');
    });

    // Combinar super admins con admins de BD
    const ALL_ADMIN_WALLETS = [
      ...SUPER_ADMINS,
      ...adminWallets.map(row => (row.wallet_address as string).toLowerCase())
    ];

    const isSystemAdmin = ALL_ADMIN_WALLETS.includes(userData.walletAddress.toLowerCase());

    console.log('🔍 📌 GENERATING LOGS FOR:', userData.walletAddress);
    console.log('📊 📍 Admin wallets in system:', ALL_ADMIN_WALLETS.length, 'wallets');
    console.log('📊 📍 Is current user admin?', isSystemAdmin);
    console.log('📊 📍 Checking if user exists in User table...');

    // Verificar si usuario existe
    const existing = await db.execute(sql`
      SELECT id, "connectionCount" FROM "users" WHERE "walletAddress" = ${userData.walletAddress}
    `);

    if (existing.length > 0) {
      // ✅ Usuario existe - INCREMENTAR conexiones + actualizar datos
      const currentCount = Number(existing[0]?.connectionCount as string);
      const newCount = currentCount + 1;

      console.log('🔄 Existing user found - updating connection count:', currentCount, '→', newCount);

      await db.execute(sql`
        UPDATE "users"
        SET "name" = COALESCE(${userData.name ?? null}, "name"),
            "email" = COALESCE(${userData.email ?? null}, "email"),
            "image" = COALESCE(${userData.image ?? null}, "image"),
            "connectionCount" = ${newCount},
            "lastConnectionAt" = NOW()
        WHERE "walletAddress" = ${userData.walletAddress}
      `);

      console.log('✅ User updated - New connection count:', newCount);

    } else {
      // ❌ Usuario NO existe - CREARLO
      console.log('🆕 Creating new user in database:', userData.walletAddress);

      await db.execute(sql`
        INSERT INTO "users" ("id", "walletAddress", "email", "name", "image", "hasPandorasKey", "connectionCount", "lastConnectionAt", "createdAt")
        VALUES (
          ${crypto.randomUUID()},
          ${userData.walletAddress},
          ${userData.email ?? null},
          ${userData.name ?? null},
          ${userData.image ?? '/images/avatars/onlybox2.png'},  -- Avatar por defecto
          ${isSystemAdmin},  -- Admins automáticamente tienen Pandora's Key
          1,
          NOW(),
          NOW()
        )
      `);

      console.log('✅ New user created in database:', userData.walletAddress);
    }

    // Si es admin del sistema pero no está en la tabla administrators, agregarlo automáticamente
    if (isSystemAdmin) {
      console.log('👑 Checking admin privileges for:', userData.walletAddress);
      const adminExists = await db.execute(sql`
        SELECT COUNT(*) as count FROM "administrators" WHERE "wallet_address" = ${userData.walletAddress}
      `);

      if (Number(adminExists[0]?.count as string) === 0) {
        await db.execute(sql`
          INSERT INTO "administrators" ("wallet_address", "alias", "role", "added_by", "created_at")
          VALUES (${userData.walletAddress}, 'System Admin', 'admin', 'system', NOW())
        `);
        console.log('✅ Admin privileges granted automatically');
      } else {
        console.log('ℹ️ Admin already exists in administrators table');
      }
    }

    // 🔄 REACTIVATE SOCIAL PROFILE ENRICHMENT
    // Intentar enriquecer con datos sociales de Thirdweb después de la sincronización básica
    try {
      console.log('🤝 Attempting to enrich user with social profiles from Thirdweb...');

      // IMPORTANTE: Esta llamada se hace al final para no bloquear la sincronización básica
      // Si Thirdweb API no está configurado o falla, el usuario aún funciona con datos básicos

      // Usar la URL correcta en producción (Vercel URL) o desarrollo
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

      const enrichedProfile = await fetch(`${baseUrl}/api/thirdweb-fetch?address=${userData.walletAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (enrichedProfile.ok) {
        const enrichedData = await enrichedProfile.json();

        // Actualizar user con datos sociales si están disponibles
        if (enrichedData.socialProfiles && enrichedData.socialProfiles.length > 0) {
          console.log('🎯 Found social profiles - updating user...');

          // Actualizar con datos sociales más ricos
          await db.execute(sql`
            UPDATE "users"
            SET "name" = COALESCE(${enrichedData.name}, "name"),
                "email" = COALESCE(${enrichedData.email}, "email"),
                "image" = COALESCE(${enrichedData.image}, "image")
            WHERE "walletAddress" = ${userData.walletAddress}
          `);

          console.log('✅ Social profile data merged successfully');
          console.log('📊 Social login methods:', enrichedData.socialProfiles.map((p: any) => p.type).filter((t: string) => t !== 'wallet'));
        } else {
          console.log('📝 No social profiles found for this wallet (this is normal for wallet-only logins)');
        }
      } else {
        console.log('📄 Thirdweb API not available (this is expected in development without secret key)');
      }
    } catch (socialError) {
      console.warn('⚠️ Social profile enrichment failed - continuing with basic user sync:', socialError);
      // NO fallamos aquí - la sincronización básica ya funciona
    }

    // 🔗 GROWTH OS IDENTITY BRIDGE (Phase 5)
    // Link anonymous marketing leads to this verified user and sync rewards
    try {
      const finalUser = await db.query.users.findFirst({
        where: eq(usersSchema.walletAddress, userData.walletAddress.toLowerCase())
      });

      if (finalUser) {
        console.log(`🔗 [Growth OS] Bridging identity for user: ${finalUser.id}`);
        
        // 1. Link leads by Email or Wallet
        await IdentityService.linkIdentity(finalUser.id, {
          email: userData.email || finalUser.email || undefined,
          walletAddress: userData.walletAddress
        });

        // 2. Sync Rewards (Asynchronously to avoid blocking login)
        RewardEngine.syncUserRewards(finalUser.id).catch(err => {
          console.error('❌ [Growth OS] Async Reward Sync failed:', err);
        });
      }
    } catch (bridgeError) {
      console.warn('⚠️ [Growth OS] Identity Bridge failed:', bridgeError);
    }

  } catch (error) {
    console.error('❌ Error syncing user:', error);
  }
}

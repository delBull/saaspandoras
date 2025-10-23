#!/usr/bin/env node

/**
 * Script para importar datos a la base de datos de staging
 * Uso: node import-staging-data.js
 */

var postgres = require('postgres');
var fs = require('fs/promises');
var path = require('path');

// Configuración de la base de datos de staging
var stagingConnectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_uj0h1LpbAQxi@ep-withered-thunder-adt88vka-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

console.log('🔄 Iniciando importación de datos a staging...');
console.log('📊 Conectando a base de datos staging:', stagingConnectionString.replace(/\/\/.*@/, '//***:***@'));

async function importData() {
  let sql;

  try {
    sql = postgres(stagingConnectionString, {
      prepare: false
    });

    console.log('✅ Conexión establecida con base de datos staging');

    // Verificar archivo de exportación
    const exportPath = path.join(__dirname, 'local-data-export.json');
    let exportData;

    try {
      const exportContent = await fs.readFile(exportPath, 'utf8');
      exportData = JSON.parse(exportContent);
      console.log('📁 Archivo de exportación encontrado');
    } catch (error) {
      console.error('❌ Error al leer archivo de exportación:', error.message);
      console.log('💡 Asegúrate de ejecutar primero: node export-local-data.js');
      return;
    }

    // Verificar datos actuales en staging (usando nombres correctos de tablas)
    const currentUserCount = await sql`SELECT COUNT(*) as count FROM "User"`;
    const currentProjectCount = await sql`SELECT COUNT(*) as count FROM "projects"`;
    const currentAdminCount = await sql`SELECT COUNT(*) as count FROM "administrators"`;

    console.log(`📊 Datos actuales en staging:`);
    console.log(`   👥 Usuarios: ${currentUserCount[0].count}`);
    console.log(`   📁 Proyectos: ${currentProjectCount[0].count}`);
    console.log(`   🛡️  Administradores: ${currentAdminCount[0].count}`);

    // Importar usuarios
    console.log('📥 Importando usuarios...');
    let importedUsers = 0;

    for (const user of exportData.users) {
      try {
        await sql`
          INSERT INTO "User" (
            "name", "email", "image", "walletAddress", "connectionCount",
            "lastConnectionAt", "kycLevel", "kycCompleted", "kycData",
            "hasPandorasKey", "createdAt"
          ) VALUES (
            ${user.name || null},
            ${user.email || null},
            ${user.image || null},
            ${user.walletAddress},
            ${user.connectionCount || 0},
            ${user.lastConnectionAt ? new Date(user.lastConnectionAt) : new Date()},
            ${user.kycLevel || 'basic'},
            ${user.kycCompleted || false},
            ${user.kycData ? JSON.stringify(user.kycData) : null},
            ${user.hasPandorasKey || true},
            ${user.createdAt ? new Date(user.createdAt) : new Date()}
          )
          ON CONFLICT ("walletAddress") DO UPDATE SET
            "name" = EXCLUDED."name",
            "email" = EXCLUDED."email",
            "image" = EXCLUDED."image",
            "connectionCount" = EXCLUDED."connectionCount",
            "lastConnectionAt" = EXCLUDED."lastConnectionAt",
            "kycLevel" = EXCLUDED."kycLevel",
            "kycCompleted" = EXCLUDED."kycCompleted",
            "kycData" = EXCLUDED."kycData",
            "hasPandorasKey" = EXCLUDED."hasPandorasKey"
        `;
        importedUsers++;
      } catch (error) {
        console.error(`❌ Error importando usuario ${user.walletAddress}:`, error.message);
      }
    }

    console.log(`✅ Usuarios importados: ${importedUsers}/${exportData.users.length}`);

    // Importar administradores
    console.log('📥 Importando administradores...');
    let importedAdmins = 0;

    for (const admin of exportData.administrators) {
      try {
        await sql`
          INSERT INTO "administrators" (
            "wallet_address", "role", "added_by", "created_at", "alias"
          ) VALUES (
            ${admin.wallet_address},
            ${admin.role || 'admin'},
            ${admin.added_by || admin.wallet_address},
            ${admin.created_at ? new Date(admin.created_at) : new Date()},
            ${admin.alias || 'Admin'}
          )
          ON CONFLICT ("wallet_address") DO UPDATE SET
            "role" = EXCLUDED."role",
            "added_by" = EXCLUDED."added_by",
            "alias" = EXCLUDED."alias",
            "created_at" = EXCLUDED."created_at"
        `;
        importedAdmins++;
      } catch (error) {
        console.error(`❌ Error importando admin ${admin.wallet_address}:`, error.message);
      }
    }

    console.log(`✅ Administradores importados: ${importedAdmins}/${exportData.administrators.length}`);

    // Importar proyectos
    console.log('📥 Importando proyectos...');
    let importedProjects = 0;

    for (const project of exportData.projects) {
      try {
        await sql`
          INSERT INTO "projects" (
            "title", "slug", "description", "business_category", "logo_url", "cover_photo_url",
            "tagline", "website", "whitepaper_url", "twitter_url", "discord_url", "telegram_url",
            "linkedin_url", "target_amount", "total_valuation_usd", "token_type", "total_tokens",
            "tokens_offered", "token_price_usd", "estimated_apy", "yield_source", "lockup_period",
            "fund_usage", "team_members", "advisors", "token_distribution", "contract_address",
            "treasury_address", "legal_status", "valuation_document_url", "fiduciary_entity",
            "due_diligence_report_url", "is_mintable", "is_mutable", "update_authority_address",
            "applicant_name", "applicant_position", "applicant_email", "applicant_phone",
            "applicant_wallet_address", "verification_agreement", "image_url", "socials",
            "raised_amount", "returns_paid", "status", "featured", "featured_button_text",
            "created_at"
          ) VALUES (
            ${project.title},
            ${project.slug},
            ${project.description || null},
            ${project.business_category || null},
            ${project.logo_url || null},
            ${project.cover_photo_url || null},
            ${project.tagline || null},
            ${project.website || null},
            ${project.whitepaper_url || null},
            ${project.twitter_url || null},
            ${project.discord_url || null},
            ${project.telegram_url || null},
            ${project.linkedin_url || null},
            ${project.target_amount || '0'},
            ${project.total_valuation_usd || '0'},
            ${project.token_type || null},
            ${project.total_tokens || '0'},
            ${project.tokens_offered || '0'},
            ${project.token_price_usd || '0'},
            ${project.estimated_apy || '0'},
            ${project.yield_source || null},
            ${project.lockup_period || null},
            ${project.fund_usage || null},
            ${project.team_members || null},
            ${project.advisors || null},
            ${project.token_distribution || null},
            ${project.contract_address || null},
            ${project.treasury_address || null},
            ${project.legal_status || null},
            ${project.valuation_document_url || null},
            ${project.fiduciary_entity || null},
            ${project.due_diligence_report_url || null},
            ${project.is_mintable || false},
            ${project.is_mutable || false},
            ${project.update_authority_address || null},
            ${project.applicant_name || null},
            ${project.applicant_position || null},
            ${project.applicant_email || null},
            ${project.applicant_phone || null},
            ${project.applicant_wallet_address},
            ${project.verification_agreement || null},
            ${project.image_url || null},
            ${project.socials || null},
            ${project.raised_amount || '0'},
            ${project.returns_paid || '0'},
            ${project.status || 'pending'},
            ${project.featured || false},
            ${project.featured_button_text || null},
            ${project.created_at ? new Date(project.created_at) : new Date()},
            ${project.updated_at ? new Date(project.updated_at) : new Date()}
          )
          ON CONFLICT ("slug") DO UPDATE SET
            "title" = EXCLUDED."title",
            "description" = EXCLUDED."description",
            "business_category" = EXCLUDED."business_category",
            "logo_url" = EXCLUDED."logo_url",
            "cover_photo_url" = EXCLUDED."cover_photo_url",
            "tagline" = EXCLUDED."tagline",
            "website" = EXCLUDED."website",
            "whitepaper_url" = EXCLUDED."whitepaper_url",
            "twitter_url" = EXCLUDED."twitter_url",
            "discord_url" = EXCLUDED."discord_url",
            "telegram_url" = EXCLUDED."telegram_url",
            "linkedin_url" = EXCLUDED."linkedin_url",
            "target_amount" = EXCLUDED."target_amount",
            "total_valuation_usd" = EXCLUDED."total_valuation_usd",
            "token_type" = EXCLUDED."token_type",
            "total_tokens" = EXCLUDED."total_tokens",
            "tokens_offered" = EXCLUDED."tokens_offered",
            "token_price_usd" = EXCLUDED."token_price_usd",
            "estimated_apy" = EXCLUDED."estimated_apy",
            "yield_source" = EXCLUDED."yield_source",
            "lockup_period" = EXCLUDED."lockup_period",
            "fund_usage" = EXCLUDED."fund_usage",
            "team_members" = EXCLUDED."team_members",
            "advisors" = EXCLUDED."advisors",
            "token_distribution" = EXCLUDED."token_distribution",
            "contract_address" = EXCLUDED."contract_address",
            "treasury_address" = EXCLUDED."treasury_address",
            "legal_status" = EXCLUDED."legal_status",
            "valuation_document_url" = EXCLUDED."valuation_document_url",
            "fiduciary_entity" = EXCLUDED."fiduciary_entity",
            "due_diligence_report_url" = EXCLUDED."due_diligence_report_url",
            "is_mintable" = EXCLUDED."is_mintable",
            "is_mutable" = EXCLUDED."is_mutable",
            "update_authority_address" = EXCLUDED."update_authority_address",
            "applicant_name" = EXCLUDED."applicant_name",
            "applicant_position" = EXCLUDED."applicant_position",
            "applicant_email" = EXCLUDED."applicant_email",
            "applicant_phone" = EXCLUDED."applicant_phone",
            "applicant_wallet_address" = EXCLUDED."applicant_wallet_address",
            "verification_agreement" = EXCLUDED."verification_agreement",
            "image_url" = EXCLUDED."image_url",
            "socials" = EXCLUDED."socials",
            "raised_amount" = EXCLUDED."raised_amount",
            "returns_paid" = EXCLUDED."returns_paid",
            "status" = EXCLUDED."status",
            "featured" = EXCLUDED."featured",
            "featured_button_text" = EXCLUDED."featured_button_text"
        `;
        importedProjects++;
      } catch (error) {
        console.error(`❌ Error importando proyecto ${project.title}:`, error.message);
      }
    }

    console.log(`✅ Proyectos importados: ${importedProjects}/${exportData.projects.length}`);

    // Importar datos de gamificación si existen
    if (exportData.gamification) {
      console.log('📥 Importando datos de gamificación...');

      // Importar perfiles de gamificación
      if (exportData.gamification.profiles) {
        let importedGamificationProfiles = 0;
        for (const profile of exportData.gamification.profiles) {
          try {
            await sql`
              INSERT INTO "gamification_profiles" (
                "user_id", "wallet_address", "total_points", "current_level", "level_progress",
                "points_to_next_level", "projects_applied", "projects_approved", "total_invested",
                "community_contributions", "current_streak", "longest_streak", "total_active_days",
                "referrals_count", "community_rank", "reputation_score", "last_activity_date",
                "created_at", "updated_at"
              ) VALUES (
                ${profile.userId},
                ${profile.walletAddress},
                ${profile.totalPoints || 0},
                ${profile.currentLevel || 1},
                ${profile.levelProgress || 0},
                ${profile.pointsToNextLevel || 100},
                ${profile.projectsApplied || 0},
                ${profile.projectsApproved || 0},
                ${profile.totalInvested || '0.00'},
                ${profile.communityContributions || 0},
                ${profile.currentStreak || 0},
                ${profile.longestStreak || 0},
                ${profile.totalActiveDays || 0},
                ${profile.referralsCount || 0},
                ${profile.communityRank || 0},
                ${profile.reputationScore || 0},
                ${profile.lastActivityDate ? new Date(profile.lastActivityDate) : new Date()},
                ${profile.createdAt ? new Date(profile.createdAt) : new Date()},
                ${profile.updatedAt ? new Date(profile.updatedAt) : new Date()}
              )
              ON CONFLICT ("user_id") DO UPDATE SET
                "total_points" = EXCLUDED."total_points",
                "current_level" = EXCLUDED."current_level",
                "level_progress" = EXCLUDED."level_progress",
                "points_to_next_level" = EXCLUDED."points_to_next_level",
                "projects_applied" = EXCLUDED."projects_applied",
                "projects_approved" = EXCLUDED."projects_approved",
                "total_invested" = EXCLUDED."total_invested",
                "community_contributions" = EXCLUDED."community_contributions",
                "current_streak" = EXCLUDED."current_streak",
                "longest_streak" = EXCLUDED."longest_streak",
                "total_active_days" = EXCLUDED."total_active_days",
                "referrals_count" = EXCLUDED."referrals_count",
                "community_rank" = EXCLUDED."community_rank",
                "reputation_score" = EXCLUDED."reputation_score",
                "last_activity_date" = EXCLUDED."last_activity_date",
                "updated_at" = EXCLUDED."updated_at"
            `;
            importedGamificationProfiles++;
          } catch (error) {
            console.error(`❌ Error importando perfil de gamificación ${profile.userId}:`, error.message);
          }
        }
        console.log(`✅ Perfiles de gamificación importados: ${importedGamificationProfiles}/${exportData.gamification.profiles.length}`);
      }

      // Importar eventos de gamificación
      if (exportData.gamification.events) {
        let importedGamificationEvents = 0;
        for (const event of exportData.gamification.events) {
          try {
            await sql`
              INSERT INTO "gamification_events" (
                "user_id", "type", "category", "points", "metadata", "created_at"
              ) VALUES (
                ${event.userId},
                ${event.type},
                ${event.category},
                ${event.points || 0},
                ${event.metadata ? JSON.stringify(event.metadata) : null},
                ${event.createdAt ? new Date(event.createdAt) : new Date()}
              )
              ON CONFLICT DO NOTHING
            `;
            importedGamificationEvents++;
          } catch (error) {
            console.error(`❌ Error importando evento de gamificación ${event.id}:`, error.message);
          }
        }
        console.log(`✅ Eventos de gamificación importados: ${importedGamificationEvents}/${exportData.gamification.events.length}`);
      }

      // Importar puntos de usuario
      if (exportData.gamification.points) {
        let importedUserPoints = 0;
        for (const points of exportData.gamification.points) {
          try {
            await sql`
              INSERT INTO "user_points" (
                "user_id", "points", "reason", "category", "metadata", "created_at"
              ) VALUES (
                ${points.userId},
                ${points.points || 0},
                ${points.reason || ''},
                ${points.category || 'special_event'},
                ${points.metadata ? JSON.stringify(points.metadata) : null},
                ${points.createdAt ? new Date(points.createdAt) : new Date()}
              )
              ON CONFLICT DO NOTHING
            `;
            importedUserPoints++;
          } catch (error) {
            console.error(`❌ Error importando puntos de usuario ${points.id}:`, error.message);
          }
        }
        console.log(`✅ Puntos de usuario importados: ${importedUserPoints}/${exportData.gamification.points.length}`);
      }
    }

    // Verificar datos finales
    const finalUserCount = await sql`SELECT COUNT(*) as count FROM "User"`;
    const finalProjectCount = await sql`SELECT COUNT(*) as count FROM "projects"`;
    const finalAdminCount = await sql`SELECT COUNT(*) as count FROM "administrators"`;

    console.log(`\n📊 Datos finales en staging:`);
    console.log(`   👥 Usuarios: ${finalUserCount[0].count}`);
    console.log(`   📁 Proyectos: ${finalProjectCount[0].count}`);
    console.log(`   🛡️  Administradores: ${finalAdminCount[0].count}`);

    console.log(`\n✅ Importación completada exitosamente!`);
    console.log(`📊 Resumen de importación:`);
    console.log(`   👥 Usuarios: ${importedUsers}/${exportData.users.length}`);
    console.log(`   📁 Proyectos: ${importedProjects}/${exportData.projects.length}`);
    console.log(`   🛡️  Administradores: ${importedAdmins}/${exportData.administrators.length}`);

    if (exportData.gamification) {
      console.log(`   🎮 Gamificación: ${exportData.gamification.profiles?.length || 0} perfiles, ${exportData.gamification.events?.length || 0} eventos`);
    }

    console.log(`\n🎉 ¡Staging actualizado con datos locales!`);
    console.log(`💡 Ahora puedes hacer deploy y verificar que todo funcione correctamente.`);

  } catch (error) {
    console.error('❌ Error durante la importación:', error);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

// Ejecutar importación
importData().catch(console.error);

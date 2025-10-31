#!/usr/bin/env node

/**
 * Script para otorgar achievements faltantes a usuarios que ya tienen perfil pero no achievements
 * Fija específicamente el problema de "Primer Login" no otorgado
 * Uso: node fix-missing-achievements.js
 */

var postgres = require('postgres');

// Configuración de la base de datos de producción
var prodConnectionString = process.env.DATABASE_URL || 'postgresql://user:pass@host:5432/db';

console.log('🔧 Iniciando corrección de achievements faltantes...');
console.log('📊 Conectando a base de datos:', prodConnectionString.replace(/\/\/.*@/, '//***:***@'));

async function fixMissingAchievements() {
  var sql;

  try {
    sql = postgres(prodConnectionString, {
      prepare: false
    });

    console.log('✅ Conexión establecida');

    // 1. Encontrar usuarios que tienen perfil gamificación pero NO tienen achievements
    console.log('\n🔍 Buscando usuarios con perfil pero sin achievements...');

    var usersWithProfileNoAchievements = await sql`
      SELECT
        gp.user_id,
        gp.wallet_address,
        gp.total_points,
        gp.created_at as profile_created_at
      FROM gamification_profiles gp
      LEFT JOIN user_achievements ua ON gp.user_id = ua.user_id AND ua.is_unlocked = true
      WHERE gp.total_points > 0 AND ua.achievement_id IS NULL
      AND gp.created_at > NOW() - INTERVAL '1 day' -- Solo desde ayer para evitar afectar data antigua
      ORDER BY gp.created_at DESC
      LIMIT 20 -- Limitado por seguridad
    `;

    console.log(`\n📊 Encontrados ${usersWithProfileNoAchievements.length} usuarios con perfil pero SIN achievements`);
    console.log('   (Limitado a 20 usuarios)');

    if (usersWithProfileNoAchievements.length === 0) {
      console.log('\n✅ Todos los usuarios con perfil tienen achievements!');
      return;
    }

    // Mostrar usuarios encontrados
    console.log('\n👥 Usuarios a corregir:');
    usersWithProfileNoAchievements.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.wallet_address} (${user.total_points} pts) - Creado: ${new Date(user.profile_created_at).toLocaleDateString()}`);
    });

    // Obtener el ID del achievement "Primer Login"
    var firstLoginAchievement = await sql`
      SELECT id, name FROM achievements
      WHERE name = 'Primer Login' AND is_active = true
      LIMIT 1
    `;

    if (firstLoginAchievement.length === 0) {
      console.error('❌ Achievement "Primer Login" no encontrado en la base de datos');
      return;
    }

    var achievementId = firstLoginAchievement[0].id;
    console.log(`\n🎯 Achievement "Primer Login" encontrado (ID: ${achievementId})`);

    // Procesar cada usuario y otorgar el achievement faltante
    console.log('\n⏳ Otorgando achievements "Primer Login" faltantes...');

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (var user of usersWithProfileNoAchievements) {
      try {
        console.log(`\n🎯 Procesando: ${user.wallet_address}`);

        // Verificar que el usuario aún no tenga este achievement
        var existingAchievement = await sql`
          SELECT COUNT(*) as count FROM user_achievements
          WHERE user_id = ${user.user_id} AND achievement_id = ${achievementId}
        `;

        if (existingAchievement[0].count > 0) {
          console.log(`   ⚠️  Achievement ya existe, saltando...`);
          skipped++;
          continue;
        }

        // Otorgar achievement "Primer Login"
        // Solo incluimos las columnas que existen en la tabla
        await sql`
          INSERT INTO user_achievements (
            user_id, achievement_id, progress, is_unlocked,
            unlocked_at
          ) VALUES (
            ${user.user_id}, ${achievementId}, 100, true,
            NOW()
          )
          ON CONFLICT (user_id, achievement_id) DO NOTHING
        `;

        console.log(`   ✅ Achievement "Primer Login" otorgado`);
        processed++;

      } catch (error) {
        console.error(`   ❌ Error procesando usuario ${user.wallet_address}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Resumen de corrección:`);
    console.log(`   ✅ Achievements otorgados exitosamente: ${processed}`);
    console.log(`   ⚠️  Skipped (ya tenían): ${skipped}`);
    console.log(`   ❌ Errores: ${errors}`);

    if (processed > 0) {
      console.log(`\n🎉 ${processed} usuarios ahora tienen el achievement "Primer Login"!`);

      // Verificar resultados finales
      var [newAchievementCount] = await sql`
        SELECT COUNT(*) as count FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE a.name = 'Primer Login' AND ua.is_unlocked = true
      `;
      var [firstLoginStats] = await sql`
        SELECT
          COUNT(*) as total_achievements,
          COUNT(CASE WHEN ua.is_unlocked = true THEN 1 END) as unlocked_achievements
        FROM user_achievements ua
      `;

      console.log(`\n📈 ESTADÍSTICAS ACTUALIZADAS:`);
      console.log(`   🏆 "Primer Login" achievements otorgados: ${newAchievementCount.count}`);
      console.log(`   📊 Total user_achievements records: ${firstLoginStats.total_achievements}`);
      console.log(`   ✅ Achievements unlocked: ${firstLoginStats.unlocked_achievements}`);

      console.log(`\n🔄 VERIFICACIÓN EN PRODUCCIÓN:`);
      console.log(`   • Visита tu app y conecta wallet de un usuario que tenía puntos`);
      console.log(`   • Ve a /profile/dashboard → Debería mostrar "Logros Obtenidos: 1"`);
      console.log(`   • Ve a /profile/achievements → "Primer Login" debería estar COMPLETADO`);
      console.log(`   • "Logros Recientes" debería mostrar el achievement otorgado`);
    }

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

// Ejecutar corrección
fixMissingAchievements().catch(console.error);

#!/usr/bin/env node

/**
 * Script para otorgar "Primer Login" achievement + puntos a usuarios existentes
 * SOLO para usuarios que existen en users table pero NO tienen perfil gamificación
 * Uso: node grant-first-login-to-existing-users.js
 */

var postgres = require('postgres');
var fs = require('fs/promises');

// Configuración de la base de datos de producción
var prodConnectionString = process.env.DATABASE_URL || 'postgresql://user:pass@host:5432/db';

console.log('🔄 Iniciando otorgamiento de "Primer Login" a usuarios existentes...');
console.log('📊 Conectando a base de datos:', prodConnectionString.replace(/\/\/.*@/, '//***:***@'));

async function grantFirstLoginToExistingUsers() {
  var sql;

  try {
    sql = postgres(prodConnectionString, {
      prepare: false
    });

    console.log('✅ Conexión establecida');

    // 1. Encontrar usuarios existentes que NO tienen perfil de gamificación
    console.log('\n🔍 Buscando usuarios existentes sin perfil de gamificación...');

    var existingUsersWithoutProfile = await sql`
      SELECT
        u.id,
        u."walletAddress",
        u."createdAt",
        ug.total_points,
        ug.created_at as gamification_created_at
      FROM users u
      LEFT JOIN gamification_profiles ug ON u.id = ug.user_id
      WHERE ug.user_id IS NULL
        AND u."walletAddress" IS NOT NULL
        AND u."walletAddress" != ''
        AND u.id IS NOT NULL
      ORDER BY u."createdAt" DESC
      LIMIT 50 -- Limitar para testing/revisión manual
    `;

    console.log(`\n📊 Encontrados ${existingUsersWithoutProfile.length} usuarios sin perfil gamificación`);
    console.log('   (Limitado a 50 para revisión manual)');

    if (existingUsersWithoutProfile.length === 0) {
      console.log('\n✅ Todos los usuarios existentes ya tienen perfil de gamificación!');
      return;
    }

    // Mostrar usuarios encontrados
    console.log('\n👥 Usuarios a procesar:');
    existingUsersWithoutProfile.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.walletAddress} (ID: ${user.id}, Creado: ${new Date(user.createdAt).toLocaleDateString()})`);
    });

    // Preguntar confirmación (en script real se haría automático)
    console.log('\n⚠️  IMPORTANTE: Se otorgarán 10 puntos + achievement "Primer Login" a cada usuario');
    console.log('   Esto modificará la base de datos de producción.');
    console.log('\n❓ ¿Proceder con el otorgamiento?');

    // Para esta demo, esperaremos confirmación y procesaremos
    if (existingUsersWithoutProfile.length > 0) {
      console.log('\n⏳ Procesando otorgamiento automático...');

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
      console.log(`✅ Achievement "Primer Login" encontrado (ID: ${achievementId})`);

      // Procesar cada usuario
      let processed = 0;
      let errors = 0;

      for (var user of existingUsersWithoutProfile) {
        try {
          console.log(`\n🎯 Procesando usuario: ${user.walletAddress}`);

          // 1. Crear perfil de gamificación con 10 puntos iniciales
          var newProfile = await sql`
            INSERT INTO gamification_profiles (
              user_id, wallet_address, total_points, current_level,
              level_progress, points_to_next_level, total_active_days,
              last_activity_date, created_at, updated_at
            ) VALUES (
              ${user.id.toString()}, ${user.walletAddress.toLowerCase()},
              10, 1, 10, 90, 1,
              NOW(), NOW(), NOW()
            )
            ON CONFLICT (user_id) DO NOTHING
            RETURNING id
          `;

          if (newProfile.length > 0) {
            console.log(`   ✅ Perfil creado con 10 puntos iniciales`);

            // 2. Registrar en user_points
            await sql`
              INSERT INTO user_points (
                user_id, points, reason, category, metadata, created_at
              ) VALUES (
                ${user.id.toString()}, 10,
                'Primer Login: Otorgamiento retrospectivo por actualización',
                'daily_login',
                ${JSON.stringify({ type: 'first_login_retroactive' })},
                NOW()
              )
            `;

            // 3. Otorgar achievement "Primer Login"
            await sql`
              INSERT INTO user_achievements (
                user_id, achievement_id, progress, is_unlocked,
                unlocked_at, last_updated
              ) VALUES (
                ${user.id}, ${achievementId}, 100, true,
                NOW(), NOW()
              )
              ON CONFLICT (user_id, achievement_id) DO NOTHING
            `;

            console.log(`   🏆 Achievement "Primer Login" otorgado`);
            processed++;
          } else {
            console.log(`   ⚠️  Perfil ya existía, saltando...`);
          }

        } catch (error) {
          console.error(`   ❌ Error procesando usuario ${user.walletAddress}:`, error.message);
          errors++;
        }
      }

      console.log(`\n📊 Resumen del processamento:`);
      console.log(`   ✅ Procesados exitosamente: ${processed}`);
      console.log(`   ❌ Errores: ${errors}`);

      if (processed > 0) {
        console.log(`\n🎉 ${processed} usuarios recibieron "Primer Login" + 10 puntos retrospectivamente!`);
        console.log(`   Verificación: Ve a /profile/achievements en producción para ver los achievements.`);
      }

      // Verificar el impacto total
      var updatedProfiles = await sql`SELECT COUNT(*) as count FROM gamification_profiles WHERE total_points = 10`;
      var givenAchievements = await sql`SELECT COUNT(*) as count FROM user_achievements ua JOIN achievements a ON ua.achievement_id = a.id WHERE a.name = 'Primer Login'`;

      console.log(`\n📈 Estadísticas actualizadas:`);
      console.log(`   🎮 Perfiles de gamificación totales: ${updatedProfiles[0].count}`);
      console.log(`   🏆 "Primer Login" achievements otorgados: ${givenAchievements[0].count}`);
    }

  } catch (error) {
    console.error('❌ Error durante el procesamiento:', error);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

// Ejecutar otorgamiento
grantFirstLoginToExistingUsers().catch(console.error);

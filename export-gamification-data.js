#!/usr/bin/env node

/**
 * Script para exportar solo datos de gamificación de la base de datos local
 * Preserva usuarios existentes, solo extrae tablas de gamificación
 * Uso: node export-gamification-data.js
 */

var postgres = require('postgres');
var fs = require('fs/promises');
var path = require('path');

// Configuración de la base de datos local
var localConnectionString = process.env.DATABASE_URL || 'postgresql://Marco@localhost:5432/pandoras_local';

console.log('🔄 Iniciando exportación de ONLY datos de gamificación...');
console.log('📊 Conectando a base de datos local:', localConnectionString.replace(/\/\/.*@/, '//***:***@'));

async function exportGamificationData() {
  var sql;

  try {
    sql = postgres(localConnectionString, {
      prepare: false
    });

    console.log('✅ Conexión establecida con base de datos local');

    // Verificar tablas de gamificación existentes
    var gamificationTables = {
      achievements: [],
      gamificationProfiles: [],
      userAchievements: [],
      userPoints: [],
      rewards: [],
      userRewards: []
    };

    console.log('\n🔍 Verificando tablas de gamificación disponibles...');

    // Verificar cada tabla
    for (var tableName in gamificationTables) {
      try {
        var result = await sql`SELECT COUNT(*) as count FROM ${sql(tableName.toLowerCase())}`;
        var count = result[0].count;
        console.log(`   ✅ ${tableName}: ${count} registros`);
        gamificationTables[tableName] = count;
      } catch (error) {
        console.log(`   ⚠️  ${tableName}: Tabla no encontrada`);
        gamificationTables[tableName] = 0;
      }
    }

    if (gamificationTables.achievements === 0 && gamificationTables.gamificationProfiles === 0) {
      console.log('\n❌ No se encontraron datos de gamificación para exportar');
      console.log('¿Ya ejecutaste el setup de gamificación en local?');
      return;
    }

    // Exportar achievements (logros base)
    console.log('\n📤 Exportando achievements...');
    var achievements = [];
    if (gamificationTables.achievements > 0) {
      achievements = await sql`SELECT * FROM "achievements" ORDER BY id ASC`;
    }

    // Exportar gamification profiles (perfiles de usuario con puntos)
    console.log('📤 Exportando gamification profiles...');
    var gamificationProfiles = [];
    if (gamificationTables.gamificationProfiles > 0) {
      gamificationProfiles = await sql`SELECT * FROM "gamification_profiles" ORDER BY total_points DESC`;
    }

    // Exportar user achievements progress (progreso de logros por usuario)
    console.log('📤 Exportando user achievements...');
    var userAchievements = [];
    if (gamificationTables.userAchievements > 0) {
      userAchievements = await sql`SELECT * FROM "user_achievements" ORDER BY user_id, achievement_id`;
    }

    // Exportar user points history (historial de puntos)
    console.log('📤 Exportando user points...');
    var userPoints = [];
    if (gamificationTables.userPoints > 0) {
      userPoints = await sql`SELECT * FROM "user_points" ORDER BY created_at DESC`;
    }

    // Exportar rewards (si existe)
    console.log('📤 Exportando rewards...');
    var rewards = [];
    if (gamificationTables.rewards > 0) {
      rewards = await sql`SELECT * FROM "rewards" ORDER BY id ASC`;
    }

    // Exportar user rewards (historial de canjes)
    console.log('📤 Exportando user rewards...');
    var userRewards = [];
    if (gamificationTables.userRewards > 0) {
      userRewards = await sql`SELECT * FROM "user_rewards" ORDER BY redeemed_at DESC`;
    }

    // Crear estructura de datos para exportar
    var exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        userProfilesCount: gamificationProfiles.length,
        achievementsCount: achievements.length,
        userAchievementsCount: userAchievements.length,
        userPointsCount: userPoints.length,
        rewardsCount: rewards.length,
        userRewardsCount: userRewards.length,
        description: 'Gamificación data export - Local to Production',
        exportType: 'gamification_only',
        database: 'pandoras_local'
      },
      // Achievements base (se puede copiar tal cual)
      achievements: achievements.map(item => ({
        ...item,
        // Mantener IDs para referencias
      })),
      // Gamification profiles (perfiles con puntos)
      gamificationProfiles: gamificationProfiles.map(item => ({
        ...item,
        // Mantener user_id para mapear con usuarios producción
      })),
      // User achievements progress
      userAchievements: userAchievements.map(item => ({
        ...item,
      })),
      // User points history
      userPoints: userPoints.map(item => ({
        ...item,
      })),
      // Rewards (opcional)
      rewards: rewards.map(item => ({
        ...item,
        // Mantener IDs para referencias
      })),
      // User rewards history
      userRewards: userRewards.map(item => ({
        ...item,
      }))
    };

    // Guardar archivo de exportación
    var exportPath = path.join(__dirname, 'gamification-data-export.json');
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));

    console.log(`\n✅ Datos de gamificación exportados exitosamente!`);
    console.log(`📁 Archivo: ${exportPath}`);
    console.log(`\n📊 Resumen de exportación de gamificación:`);
    console.log(`   🏆 Logros base: ${achievements.length}`);
    console.log(`   👤 Perfiles de usuario: ${gamificationProfiles.length}`);
    console.log(`   📊 Progreso de logros: ${userAchievements.length}`);
    console.log(`   💎 Historial de puntos: ${userPoints.length}`);
    console.log(`   🎁 Recompensas disponibles: ${rewards.length}`);
    console.log(`   🛒 Historial de canjes: ${userRewards.length}`);

    if (gamificationProfiles.length > 0) {
      var avgPoints = gamificationProfiles.reduce((acc, p) => acc + p.total_points, 0) / gamificationProfiles.length;
      console.log(`\n📈 Estadísticas:`);
      console.log(`   📊 Puntos promedio por usuario: ${Math.round(avgPoints)}`);
      console.log(`   🏆 Usuario top: ${gamificationProfiles[0].total_points} puntos`);
      console.log(`   📋 Nivel promedio: ${Math.round(gamificationProfiles.reduce((acc, p) => acc + p.current_level, 0) / gamificationProfiles.length)}`);
    }

    console.log(`\n📝 Siguientes pasos:`);
    console.log(`   1. Copia 'gamification-data-export.json' a tu servidor de producción`);
    console.log(`   2. Ejecuta: node import-gamification-staging-data.js`);
    console.log(`   3. Verifica que aparezcan los logros en /profile/achievements`);
    console.log(`\n⚠️  NOTA: Esto SOLO afecta tablas de gamificación, NO usuarios existentes!`);

  } catch (error) {
    console.error('❌ Error durante la exportación:', error);
    process.exit(1);
  } finally {
    if (sql) {
      await sql.end();
    }
  }
}

// Ejecutar exportación
exportGamificationData().catch(console.error);

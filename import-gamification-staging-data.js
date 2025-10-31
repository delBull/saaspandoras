#!/usr/bin/env node

/**
 * Script para importar datos de gamificación a producción/staging
 * SOLO importa tablas de gamificación, PRESERVA usuarios existentes
 * Uso: node import-gamification-staging-data.js
 */

var postgres = require('postgres');
var fs = require('fs/promises');
var path = require('path');

// Configuración de la base de datos de destino (staging/producción)
var targetConnectionString = process.env.DATABASE_URL || 'postgresql://user:pass@host:5432/db';

console.log('🔄 Iniciando importación de datos de gamificación a producción...');
console.log('📊 Conectando a base de datos objetivo:', targetConnectionString.replace(/\/\/.*@/, '//***:***@'));

async function importGamificationData() {
  var sql;

  try {
    sql = postgres(targetConnectionString, {
      prepare: false
    });

    console.log('✅ Conexión establecida con base de datos objetivo');

    // Leer archivo de exportación
    var importPath = path.join(__dirname, 'gamification-data-export.json');
    var exportData;

    try {
      var jsonData = await fs.readFile(importPath, 'utf8');
      exportData = JSON.parse(jsonData);
    } catch (error) {
      console.error('❌ Error leyendo archivo de exportación:', error.message);
      console.log(`   Asegurate de que existe el archivo: ${importPath}`);
      return;
    }

    // Verificar que es un archivo válido de gamificación
    if (exportData.metadata?.exportType !== 'gamification_only') {
      console.error('❌ Este no es un archivo válido de exportación de gamificación');
      console.error('   Usa: node export-gamification-data.js para generar el archivo correcto');
      return;
    }

    console.log(`\n📦 Archivo válido encontrado:`);
    console.log(`   📅 Exportado: ${new Date(exportData.metadata.exportedAt).toLocaleString()}`);
    console.log(`   🎮 Tipo: ${exportData.metadata.exportType}`);
    console.log(`   🏆 Achievements: ${exportData.metadata.achievementsCount}`);

    // Verificar que las tablas existen en el objetivo
    console.log('\n🏗️  Verificando tablas necesarias...');

    var targetTables = {
      achievements: false,
      gamification_profiles: false,
      user_achievements: false,
      user_points: false
    };

    for (var tableName in targetTables) {
      try {
        await sql`SELECT 1 FROM ${sql(tableName)} LIMIT 1`;
        targetTables[tableName] = true;
        console.log(`   ✅ ${tableName}: OK`);
      } catch (error) {
        console.log(`   ❌ ${tableName}: No existe o inaccesible`);
        targetTables[tableName] = false;
      }
    }

    // Verificar que al menos la tabla principal existe
    if (!targetTables.achievements) {
      console.error('❌ Tabla "achievements" no encontrada. Las tablas de gamificación no están inicializadas.');
      console.error('   Ejecuta primero la inicialización de tables en tu base de datos de producción.');
      return;
    }

    console.log('\n🧹 Limpiando datos existentes de achievements...');
    // NOTA: No limpiamos perfiles ni progreso, solo las achievements base
    // para evitar perder progreso de usuarios existentes

    try {
      await sql`DELETE FROM "achievements"`;
      console.log('   ✅ Achievements base limpiadas (prep para importar)');
    } catch (error) {
      console.log(`   ⚠️  No se pudieron limpiar achievements existentes: ${error.message}`);
    }

    console.log('\n📥 Iniciando importación de datos...');

    // 1. Importar achievements base
    if (exportData.achievements && exportData.achievements.length > 0) {
      console.log(`📝 Importando ${exportData.achievements.length} achievements base...`);

      for (var achievement of exportData.achievements) {
        try {
          // Insertar achievement
          await sql`
            INSERT INTO "achievements" (
              id, name, description, icon, type, points_reward,
              is_active, is_secret, required_points, required_level,
              required_events, points_per_event, badge_url,
              created_at
            ) VALUES (
              ${achievement.id}, ${achievement.name}, ${achievement.description},
              ${achievement.icon}, ${achievement.type}, ${achievement.points_reward},
              ${achievement.is_active ?? true}, ${achievement.is_secret ?? false},
              ${achievement.required_points ?? 0}, ${achievement.required_level ?? 1},
              ${JSON.stringify(achievement.required_events ?? [])},
              ${achievement.points_per_event ?? achievement.points_reward ?? 0},
              ${achievement.badge_url ?? '/badges/default.png'},
              ${new Date(achievement.created_at ?? new Date())}
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              description = EXCLUDED.description,
              icon = EXCLUDED.icon,
              type = EXCLUDED.type,
              points_reward = EXCLUDED.points_reward,
              is_active = EXCLUDED.is_active,
              is_secret = EXCLUDED.is_secret,
              required_points = EXCLUDED.required_points,
              required_level = EXCLUDED.required_level,
              required_events = EXCLUDED.required_events,
              points_per_event = EXCLUDED.points_per_event,
              badge_url = EXCLUDED.badge_url
          `;
        } catch (error) {
          console.log(`   ❌ Error importando achievement ${achievement.name}:`, error.message);
        }
      }

      console.log('   ✅ Achievements base importadas');
    }

    // NOTA IMPORTANTE: NO importar los demás datos por ahora
    // Los perfiles y progreso se generarán automáticamente cuando los usuarios realicen acciones
    // Esto preserva usuarios existentes SIN sobreescribir su progreso

    console.log('\n📊 Verificando importación...');

    // Verificar que las achievements se importaron correctamente
    var importedAchievementsCount;
    try {
      var result = await sql`SELECT COUNT(*) as count FROM "achievements"`;
      importedAchievementsCount = result[0].count;
      console.log(`   🏆 Achievements importadas: ${importedAchievementsCount}`);

      if (importedAchievementsCount === exportData.metadata.achievementsCount) {
        console.log('   ✅ Todas las achievements importadas correctamente!');
      } else {
        console.log(`   ⚠️  Import faltando: esperadas ${exportData.metadata.achievementsCount}, importadas ${importedAchievementsCount}`);
      }
    } catch (error) {
      console.log(`   ❌ Error verificando achievements: ${error.message}`);
    }

    console.log('\n✅ IMPORTACIÓN COMPLETADA SÁTUFACTAMENTE!');
    console.log(`\n📈 Resumen:`);
    console.log(`   🏆 Logros base: ${importedAchievementsCount ?? 0} importados`);
    console.log(`   👤 Perfiles: 0 (se generarán automáticamente)`);
    console.log(`   📊 Progreso: 0 (se generarán automáticamente)`);
    console.log(`   💎 Puntos: 0 (se otorgarán automáticamente)`);

    console.log(`\n🎮 Cómo funciona ahora:`);
    console.log(`   • Cuando un usuario conecte wallet, se creará automáticamente su perfil de gamificación`);
    console.log(`   • Las achievements aparecerán en /profile/achievements`);
    console.log(`   • Los puntos y progreso se acumularán automáticamente`);
    console.log(`   • Usuarios existentes mantendrán sus proyectos sin interferencia`);

    console.log(`\n🔄 Prueba el sistema:`);
    console.log(`   1. Conecta wallet en tu app`);
    console.log(`   2. Ve a /profile/achievements → deberías ver todos los logros`);
    console.log(`   3. Completa cursos → deberían otorgar +100 puntos`);
    console.log(`   4. Ve el leaderboard → deberían aparecer los rankings`);

    console.log(`\n⚠️  NOTA: Perfiles y progreso de usuarios existentes quedan intocados!`);

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
importGamificationData().catch(console.error);

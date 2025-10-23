#!/usr/bin/env node

/**
 * Script para exportar datos de la base de datos local
 * Uso: node export-local-data.js
 */

var postgres = require('postgres');
var fs = require('fs/promises');
var path = require('path');

// Configuración de la base de datos local
var localConnectionString = process.env.DATABASE_URL || 'postgresql://Marco@localhost:5432/pandoras_local';

console.log('🔄 Iniciando exportación de datos locales...');
console.log('📊 Conectando a base de datos local:', localConnectionString.replace(/\/\/.*@/, '//***:***@'));

async function exportData() {
  var sql;

  try {
    sql = postgres(localConnectionString, {
      prepare: false
    });

    console.log('✅ Conexión establecida con base de datos local');

    // Verificar que hay datos
    var userCount = await sql`SELECT COUNT(*) as count FROM "users"`;
    var projectCount = await sql`SELECT COUNT(*) as count FROM "projects"`;
    var adminCount = await sql`SELECT COUNT(*) as count FROM "administrators"`;

    console.log(`📊 Datos encontrados:`);
    console.log(`   👥 Usuarios: ${userCount[0].count}`);
    console.log(`   📁 Proyectos: ${projectCount[0].count}`);
    console.log(`   🛡️  Administradores: ${adminCount[0].count}`);

    if (userCount[0].count === 0) {
      console.log('⚠️  No hay usuarios en la base de datos local');
      return;
    }

    // Exportar usuarios
    console.log('📤 Exportando usuarios...');
    var users = await sql`
      SELECT * FROM "users"
      ORDER BY "createdAt" DESC
    `;

    // Exportar proyectos
    console.log('📤 Exportando proyectos...');
    var projects = await sql`
      SELECT * FROM "projects"
      ORDER BY "created_at" DESC
    `;

    // Exportar administradores
    console.log('📤 Exportando administradores...');
    var administrators = await sql`
      SELECT * FROM "administrators"
      ORDER BY "created_at" DESC
    `;

    // Exportar tablas de gamificación si existen
    var gamificationData = null;
    try {
      console.log('📤 Exportando datos de gamificación...');
      var gamificationProfiles = await sql`SELECT * FROM "gamification_profiles"`;
      var gamificationEvents = await sql`SELECT * FROM "gamification_events"`;
      var userPoints = await sql`SELECT * FROM "user_points"`;
      var achievements = await sql`SELECT * FROM "achievements"`;
      var rewards = await sql`SELECT * FROM "rewards"`;

      gamificationData = {
        profiles: gamificationProfiles,
        events: gamificationEvents,
        points: userPoints,
        achievements,
        rewards
      };

      console.log(`📊 Datos de gamificación:`);
      console.log(`   🎯 Perfiles: ${gamificationProfiles.length}`);
      console.log(`   📝 Eventos: ${gamificationEvents.length}`);
      console.log(`   💎 Puntos: ${userPoints.length}`);
      console.log(`   🏆 Logros: ${achievements.length}`);
      console.log(`   🎁 Recompensas: ${rewards.length}`);
    } catch (error) {
      console.log('ℹ️  No se encontraron tablas de gamificación o error:', error.message);
    }

    // Crear estructura de datos para exportar
    var exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        userCount: userCount[0].count,
        projectCount: projectCount[0].count,
        adminCount: adminCount[0].count,
        database: 'pandoras_local'
      },
      users: users.map(user => ({
        ...user,
        // Remover campos que pueden causar problemas
        id: undefined, // Dejar que la BD de destino genere el ID
        createdAt: undefined,
        updatedAt: undefined
      })),
      projects: projects.map(project => ({
        ...project,
        id: undefined, // Dejar que la BD de destino genere el ID
        created_at: undefined,
        updated_at: undefined
      })),
      administrators: administrators.map(admin => ({
        ...admin,
        id: undefined, // Dejar que la BD de destino genere el ID
        created_at: undefined
      })),
      gamification: gamificationData
    };

    // Guardar archivo de exportación
    var exportPath = path.join(__dirname, 'local-data-export.json');
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));

    console.log(`✅ Datos exportados exitosamente a: ${exportPath}`);
    console.log(`📊 Resumen de exportación:`);
    console.log(`   👥 Usuarios: ${users.length}`);
    console.log(`   📁 Proyectos: ${projects.length}`);
    console.log(`   🛡️  Administradores: ${administrators.length}`);

    if (gamificationData) {
      console.log(`   🎮 Gamificación: ${gamificationData.profiles.length} perfiles, ${gamificationData.events.length} eventos`);
    }

    console.log(`\n📝 Siguientes pasos:`);
    console.log(`   1. Copia el archivo 'local-data-export.json' a tu servidor de staging`);
    console.log(`   2. Ejecuta el script de importación en staging: node import-staging-data.js`);
    console.log(`   3. Verifica que los datos se hayan importado correctamente`);

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
exportData().catch(console.error);

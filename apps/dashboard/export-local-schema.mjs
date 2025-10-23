#!/usr/bin/env node

/**
 * Script para exportar la estructura de la base de datos local
 * para replicarla en producción
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Exportando estructura de base de datos local...');

async function exportLocalSchema() {
  // Cargar variables de entorno locales
  let databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    try {
      const dotenv = await import('dotenv');
      const envLocalPath = path.join(__dirname, '.env.local');
      const envPath = path.join(__dirname, '.env');

      if (fs.existsSync(envLocalPath)) {
        dotenv.config({ path: envLocalPath });
        databaseUrl = process.env.DATABASE_URL;
        console.log('📋 Variables de entorno cargadas desde .env.local');
      } else if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath });
        databaseUrl = process.env.DATABASE_URL;
        console.log('📋 Variables de entorno cargadas desde .env');
      }
    } catch (error) {
      console.log('📋 dotenv no disponible');
    }
  }

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no configurada');
    console.log('📋 Configura la variable de entorno DATABASE_URL o crea un archivo .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔌 Conectando a la base de datos local...');
    await client.connect();

    // Obtener todas las tablas
    console.log('📊 Obteniendo lista de tablas...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`📋 Tablas encontradas: ${tables.length}`);
    tables.forEach(table => console.log(`   - ${table}`));

    // Exportar estructura de cada tabla
    const schemaData = {
      tables: [],
      timestamp: new Date().toISOString()
    };

    for (const tableName of tables) {
      console.log(`📋 Exportando estructura de ${tableName}...`);

      // Obtener definición de la tabla
      const createTableResult = await client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position;
      `, [tableName]);

      // Obtener constraints e índices
      const constraintsResult = await client.query(`
        SELECT
          constraint_name,
          constraint_type,
          column_name
        FROM information_schema.key_column_usage
        WHERE table_schema = 'public'
        AND table_name = $1;
      `, [tableName]);

      // Obtener datos de la tabla (si no es muy grande)
      let tableData = null;
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = parseInt(countResult.rows[0].count);

        if (count < 1000) { // Solo exportar tablas pequeñas
          console.log(`📋 Exportando ${count} registros de ${tableName}...`);
          const dataResult = await client.query(`SELECT * FROM "${tableName}"`);
          tableData = dataResult.rows;
        } else {
          console.log(`📋 ${tableName} tiene ${count} registros - omitiendo datos`);
        }
      } catch (error) {
        console.log(`⚠️ No se pudieron exportar datos de ${tableName}: ${error.message}`);
      }

      schemaData.tables.push({
        name: tableName,
        columns: createTableResult.rows,
        constraints: constraintsResult.rows,
        data: tableData
      });
    }

    // Guardar el esquema exportado
    const exportPath = path.join(__dirname, 'local-schema-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(schemaData, null, 2));

    console.log(`✅ Esquema exportado a: ${exportPath}`);
    console.log(`📊 Total de tablas: ${tables.length}`);
    console.log(`📋 Archivo de exportación: ${fs.statSync(exportPath).size} bytes`);

    await client.end();

  } catch (error) {
    console.error('❌ Error exportando esquema:', error.message);
    console.error('📋 Stack trace:', error.stack);
    await client.end();
    process.exit(1);
  }
}

exportLocalSchema();

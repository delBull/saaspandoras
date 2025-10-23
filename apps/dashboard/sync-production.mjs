#!/usr/bin/env node

/**
 * Script para sincronizar la base de datos de producción con la local
 * Usa el archivo de exportación local para recrear la estructura en producción
 */

import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Sincronizando base de datos de producción con local...');

async function syncProduction() {
  // Verificar que tenemos DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no configurada');
    console.log('📋 Configura la variable de entorno DATABASE_URL');
    process.exit(1);
  }

  // Verificar que existe el archivo de exportación
  const exportPath = path.join(__dirname, 'local-schema-export.json');
  if (!fs.existsSync(exportPath)) {
    console.error('❌ Archivo de exportación no encontrado');
    console.log('📋 Primero exporta tu base de datos local:');
    console.log('   npm run db:export-local');
    process.exit(1);
  }

  const schemaData = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
  console.log(`📋 Exportación del: ${schemaData.timestamp}`);
  console.log(`📊 ${schemaData.tables.length} tablas para sincronizar`);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔌 Conectando a la base de datos de producción...');
    await client.connect();

    // Verificar tablas existentes en producción
    const existingTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const existingTables = existingTablesResult.rows.map(row => row.table_name);
    console.log(`📋 Tablas existentes en producción: ${existingTables.length}`);
    existingTables.forEach(table => console.log(`   - ${table}`));

    // Procesar cada tabla del export
    for (const table of schemaData.tables) {
      const tableName = table.name;
      console.log(`\n📋 Procesando tabla: ${tableName}`);

      // Verificar si la tabla existe en producción
      const exists = existingTables.includes(tableName);

      if (exists) {
        console.log(`   ✅ ${tableName} ya existe en producción`);

        // Verificar si necesitamos actualizar la estructura
        const prodStructure = await client.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);

        const localColumns = table.columns.map(col => col.column_name);
        const prodColumns = prodStructure.rows.map(col => col.column_name);

        const missingColumns = localColumns.filter(col => !prodColumns.includes(col));

        if (missingColumns.length > 0) {
          console.log(`   ⚠️ Faltan columnas en producción: ${missingColumns.join(', ')}`);
          console.log(`   📋 Actualizando estructura de ${tableName}...`);

          // Agregar columnas faltantes
          for (const columnName of missingColumns) {
            const columnDef = table.columns.find(col => col.column_name === columnName);
            const columnSQL = generateColumnSQL(columnDef);

            try {
              await client.query(`ALTER TABLE "${tableName}" ADD COLUMN ${columnSQL}`);
              console.log(`   ✅ Columna ${columnName} agregada`);
            } catch (error) {
              console.log(`   ⚠️ No se pudo agregar columna ${columnName}: ${error.message}`);
            }
          }
        } else {
          console.log(`   ✅ Estructura de ${tableName} está actualizada`);
        }

      } else {
        console.log(`   📋 Creando tabla ${tableName} en producción...`);

        // Crear la tabla
        const createSQL = generateCreateTableSQL(table);
        await client.query(createSQL);
        console.log(`   ✅ Tabla ${tableName} creada`);

        // Insertar datos si existen
        if (table.data && table.data.length > 0) {
          console.log(`   📋 Insertando ${table.data.length} registros...`);

          for (const row of table.data) {
            const columns = Object.keys(row);
            const values = columns.map(col => {
              const value = row[col];
              if (value === null) return 'NULL';
              if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
              if (typeof value === 'object') return `'${JSON.stringify(value)}'`;
              return value;
            });

            const insertSQL = `
              INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')})
              VALUES (${values.join(', ')})
            `;

            try {
              await client.query(insertSQL);
            } catch (error) {
              console.log(`   ⚠️ Error insertando fila: ${error.message}`);
            }
          }

          console.log(`   ✅ ${table.data.length} registros insertados`);
        }
      }
    }

    // Verificar resultado final
    const finalTablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const finalTables = finalTablesResult.rows.map(row => row.table_name);
    console.log(`\n✅ Sincronización completada`);
    console.log(`📊 Tablas en producción: ${finalTables.length}`);
    console.log(`📋 Tablas: ${finalTables.join(', ')}`);

    await client.end();

  } catch (error) {
    console.error('❌ Error sincronizando producción:', error.message);
    console.error('📋 Stack trace:', error.stack);
    await client.end();
    process.exit(1);
  }
}

function generateColumnSQL(column) {
  let sql = `"${column.column_name}" ${column.data_type}`;

  if (column.character_maximum_length) {
    sql += `(${column.character_maximum_length})`;
  } else if (column.numeric_precision && column.numeric_scale) {
    sql += `(${column.numeric_precision}, ${column.numeric_scale})`;
  }

  if (column.is_nullable === 'NO') {
    sql += ' NOT NULL';
  }

  if (column.column_default) {
    sql += ` DEFAULT ${column.column_default}`;
  }

  return sql;
}

function generateCreateTableSQL(table) {
  const columnsSQL = table.columns.map(col => generateColumnSQL(col)).join(',\n        ');

  let sql = `CREATE TABLE "${table.name}" (\n        ${columnsSQL}\n    )`;

  // Agregar constraints si existen
  const primaryKeys = table.constraints.filter(c => c.constraint_type === 'PRIMARY KEY');
  if (primaryKeys.length > 0) {
    const pkColumns = primaryKeys.map(pk => `"${pk.column_name}"`).join(', ');
    sql += `;\n\nALTER TABLE "${table.name}" ADD CONSTRAINT "${primaryKeys[0].constraint_name}" PRIMARY KEY (${pkColumns})`;
  }

  return sql;
}

syncProduction();

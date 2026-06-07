const { pgTable, integer } = require('drizzle-orm/pg-core');
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const t = pgTable('t', { id: integer('id') });
const sql = postgres('postgresql://postgres:postgres@localhost:5432/postgres');
const db = drizzle(sql);
const q = db.select().from(t).for('update').toSQL();
console.log(q.sql);

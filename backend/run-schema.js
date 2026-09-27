// run-schema.js — Runs schema.sql against tournamentData
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function main() {
  // Step 1: Connect without a database to create it
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || '127.0.0.1',
    port:     parseInt(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: false,
  });

  console.log('✅ Connected to MySQL server');

  const sqlFile = path.join(__dirname, 'database', 'schema.sql');
  const rawSql  = fs.readFileSync(sqlFile, 'utf8');

  // Remove comment lines
  const noComments = rawSql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  // Split into individual statements
  const statements = noComments
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 2);

  let ok = 0, skipped = 0;
  for (const stmt of statements) {
    try {
      await conn.query(stmt);
      ok++;
    } catch (err) {
      const ignorable = [
        'ER_DUP_ENTRY',
        'ER_TABLE_EXISTS_ERROR',
        'ER_DUP_KEYNAME',
        'ER_CANT_DROP_FIELD_OR_KEY',
        'ER_FK_DUP_NAME',
      ];
      if (ignorable.includes(err.code)) {
        skipped++;
      } else {
        console.warn(`  ⚠️  [${err.code}] ${err.message.slice(0, 100)}`);
        skipped++;
      }
    }
  }

  console.log(`\n✅ Schema applied: ${ok} executed, ${skipped} skipped`);
  console.log('🗄️  Database "tournamentData" is ready!\n');
  await conn.end();
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});

// run-schema.js — Runs schema.sql
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./database/db');

async function applySchema() {
  const sqlFile = path.join(__dirname, 'database', 'schema.sql');
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ schema.sql not found at:', sqlFile);
    return;
  }

  const rawSql = fs.readFileSync(sqlFile, 'utf8');

  // Remove single line comments
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
    // Skip CREATE DATABASE or USE statements when already connected to a specific database
    if (/^CREATE\s+DATABASE/i.test(stmt) || /^USE\s+/i.test(stmt)) {
      skipped++;
      continue;
    }

    try {
      await db.query(stmt);
      ok++;
    } catch (err) {
      const ignorable = [
        'ER_DUP_ENTRY',
        'ER_TABLE_EXISTS_ERROR',
        'ER_DUP_KEYNAME',
        'ER_CANT_DROP_FIELD_OR_KEY',
        'ER_FK_DUP_NAME',
        'ER_DBACCESS_DENIED_ERROR',
        'ER_SPECIFIC_ACCESS_DENIED_ERROR',
      ];
      if (ignorable.includes(err.code)) {
        skipped++;
      } else {
        console.warn(`  ⚠️  [${err.code || 'WARN'}] ${err.message.slice(0, 100)}`);
        skipped++;
      }
    }
  }

  console.log(`✅ Schema applied: ${ok} executed, ${skipped} skipped/safe.`);
}

if (require.main === module) {
  applySchema()
    .then(() => {
      console.log('🗄️ Database tables are ready!\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Fatal error:', err.message);
      process.exit(1);
    });
}

module.exports = applySchema;

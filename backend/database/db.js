const mysql = require('mysql2/promise');
require('dotenv').config();

function getPoolConfig() {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (dbUrl) {
    try {
      const url = new URL(dbUrl);
      const isRemote = !['localhost', '127.0.0.1'].includes(url.hostname);
      const useSsl =
        process.env.DB_SSL === 'true' ||
        process.env.MYSQL_SSL === 'true' ||
        (isRemote && process.env.DB_SSL !== 'false' && !url.hostname.endsWith('.internal'));

      const config = {
        host: url.hostname,
        port: parseInt(url.port, 10) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, '') || process.env.DB_NAME || 'tournamentData',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4',
      };

      if (useSsl) {
        config.ssl = { rejectUnauthorized: false };
      }
      return config;
    } catch (err) {
      console.warn('⚠️ Could not parse DATABASE_URL with URL parser, using connection string directly.');
      return dbUrl;
    }
  }

  const host = process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT, 10) || 3306;
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'tournamentData';

  const isRemote = !['localhost', '127.0.0.1'].includes(host);
  const useSsl =
    process.env.DB_SSL === 'true' ||
    process.env.MYSQL_SSL === 'true' ||
    (isRemote && process.env.DB_SSL !== 'false' && !host.endsWith('.internal'));

  const config = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  };

  if (useSsl) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

const pool = mysql.createPool(getPoolConfig());

// Test connection on startup and run migrations if AUTO_MIGRATE=true
(async () => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT DATABASE() AS db');
    const currentDb = rows[0]?.db || process.env.DB_NAME || 'tournamentData';
    console.log(`✅ MySQL connected successfully → database: ${currentDb}`);
    conn.release();

    if (process.env.AUTO_MIGRATE === 'true') {
      console.log('🔄 AUTO_MIGRATE is true: applying schema and default seed...');
      const applySchema = require('../run-schema');
      const seedAdmin = require('../seed-admin');
      await applySchema();
      await seedAdmin();
      console.log('✨ Auto-migration complete.');
    }
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
  }
})();

module.exports = pool;

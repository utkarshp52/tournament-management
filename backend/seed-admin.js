require('dotenv').config();
const mysql  = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });

  const hash = await bcrypt.hash('Admin@123', 10);
  console.log('Generated hash:', hash);

  await conn.query(
    `INSERT INTO users (username, email, password_hash, role, full_name)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ['admin', 'admin@tournament.com', hash, 'admin', 'Tournament Administrator']
  );

  console.log('✅ Admin user seeded with password: Admin@123');
  await conn.end();
}

seedAdmin().catch(e => { console.error('❌', e.message); process.exit(1); });

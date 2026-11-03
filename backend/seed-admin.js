require('dotenv').config();
const db = require('./database/db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
  const hash = await bcrypt.hash('Admin@123', 10);

  await db.query(
    `INSERT INTO users (username, email, password_hash, role, full_name)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    ['admin', 'admin@tournament.com', hash, 'admin', 'Tournament Administrator']
  );

  console.log('✅ Admin user ready (Username: admin, Email: admin@tournament.com, Password: Admin@123)');
}

if (require.main === module) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch(e => {
      console.error('❌ Seed admin failed:', e.message);
      process.exit(1);
    });
}

module.exports = seedAdmin;

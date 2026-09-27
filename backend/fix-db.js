require('dotenv').config();
const mysql = require('mysql2/promise');

async function fix() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS standings (
      standing_id     INT AUTO_INCREMENT PRIMARY KEY,
      tournament_id   INT NOT NULL,
      team_id         INT NOT NULL,
      matches_played  INT DEFAULT 0,
      wins            INT DEFAULT 0,
      losses          INT DEFAULT 0,
      draws           INT DEFAULT 0,
      points          INT DEFAULT 0,
      net_run_rate    DECIMAL(8,4) DEFAULT 0.0000,
      goals_for       INT DEFAULT 0,
      goals_against   INT DEFAULT 0,
      rank_position   INT,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id) ON DELETE CASCADE,
      FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE,
      UNIQUE KEY uq_standing (tournament_id, team_id)
    )
  `);
  console.log('✅ standings table created');

  try {
    await conn.query('CREATE INDEX idx_standings_points ON standings(tournament_id, points DESC)');
    console.log('✅ index created');
  } catch(e) { console.log('   index already exists'); }

  const [rows] = await conn.query('SHOW TABLES');
  console.log('\n📋 All tables in tournamentData:');
  rows.forEach(r => console.log('  ✓', Object.values(r)[0]));

  const [users] = await conn.query('SELECT username, email, role FROM users LIMIT 5');
  console.log('\n👥 Users:', users.length ? users : 'none yet');

  await conn.end();
  console.log('\n🎉 Database tournamentData is fully ready!');
}

fix().catch(e => { console.error('❌', e.message); process.exit(1); });
